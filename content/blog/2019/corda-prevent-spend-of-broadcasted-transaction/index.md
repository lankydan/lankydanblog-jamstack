---
title: Preventing invalid spending of broadcasted states
date: "2019-06-12"
published: true
tags: [corda, kotlin, dlt, distributed ledger technology, blockchain]
cover_image: ./corda-crowd.png
github_url: https://github.com/lankydan/corda-broadcast-transaction
---

Corda is super flexible and will allow you to put together the code needed to write many complex workflows. This flexibility does come with one disadvantage. You, the developer, need to spend some time and thought on designing your application. No more blank contracts. No more responder flows that sign anything they receive. You'll be glad you put in the effort when your application is working seamlessly in production. Luckily for you, I am here to protect your vaults from dodgy transactions and invalid spending of your states.

In my previous post, [Broadcasting a transaction to external organisations](https://lankydan.dev/broadcasting-a-transaction-to-external-organisations), I showed you how to share transactions and the states within them with anyone in a network. Raising potential avenues for states to be spent in ways that were not foreseen. Possibly leading to the business process that a CorDapp(s) defines to fall apart.

I gave you the knowledge to end up in this situation, and now I am trying to prevent you from making stupid 🤦‍♀️, and potentially significant, mistakes. In other words, I gave you the keys to the car, and now I am trying to prevent you from crashing or running someone over 🚗💀. 

Or even,

> 🕷 With great power comes great responsibility. 🕷

In this post, I will cover the sort of checks you should be adding to your contracts and flows to prevent other nodes from gaining advantages from potential oversights in your application. More precisely, preventing states received from broadcasted transactions from being spent in ways that were not anticipated. After making these changes, states can only be spent by parties that the application fully intended to allow.

I will be using the `MessageState` (a `LinearState`) that I have included in all of my Corda posts. Added below for clarity:

```kotlin
@BelongsToContract(MessageContract::class)
data class MessageState(
  val sender: Party,
  val recipient: Party,
  val contents: String,
  override val linearId: UniqueIdentifier,
  override val participants: List<Party> = listOf(sender, recipient)
) : LinearState
```

Using this state as an example, I can help you think about the design of your own contracts and the validation in your flows. The workflow we will be looking at is the process of replying to a message sent between two nodes.

## Contract verification

I hope you already know this. Contract verification is important. This is the validation that is run by each signer of a transaction and anyone who needs to verify that same transaction in the future. States can only evolve in ways which are allowed by their contract's design. Who can create them, who can spend them, what values they can have, how many of them per transaction, and so on. It is up to you to define these rules.

Below are some general requirements I believe are important to ensure a contract places the necessary boundaries on a state. Guiding the state along the possible routes it can take to be created and transformed:

```kotlin
override fun verify(tx: LedgerTransaction) {
  val commandWithParties: CommandWithParties<Commands> = tx.commands.requireSingleCommand()
  when (commandWithParties.value) {
    is Commands.Send -> // validation for sending
    is Commands.Reply -> requireThat {
      val inputPublicKeys = tx.inputs.flatMap { it.state.data.participants.map(AbstractParty::owningKey) }.toSet()
      "The input participant keys are a subset of the signing keys" using commandWithParties.signers.containsAll(inputPublicKeys)
      val outputPublicKeys = tx.outputStates.flatMap { it.participants.map(AbstractParty::owningKey) }.toSet()
      "The output participant keys are a subset of the signing keys" using commandWithParties.signers.containsAll(outputPublicKeys)
    }
  }
}
```

Although this validation is for a `LinearState`, I actually nicked the rules from `ContractsDSL.verifyMoveCommand`. Maybe this is an indication that my `MessageState` is actually an `OwnableState` (a state with a single owner), but let's brush that under the rug 🙈🙊.

The rules in the snippet above, check that the transaction is going to be signed by all the participants of the input and output states. Ensuring all the relevant parties have a chance to validate the transaction. In other words, the flow must include the parties mentioned by the input and output states in the command's required signers, and sessions opened to send them the transaction.

Thanks to these rules, there is no way for a transaction to be committed to anyone's vault without the participants of the input and output states signing the transaction. Doing so, in the eyes of the contract, would be illegal. Let me reword that into a more manageable explanation. Any transactions consuming `MessageState`s cannot be created without notifying the original participants of the state. Furthermore, the reply cannot be created and stored in a party's vault without their say so.

These rules are a good basis to build up your own contract's validation. Explicitly stating which parties must sign a transaction is an important requirement in proving its validity. Further rules can be added as needed.

For example, the following checks could be added to the example above:

```kotlin
override fun verify(tx: LedgerTransaction) {
  val commandWithParties: CommandWithParties<Commands> = tx.commands.requireSingleCommand()
  val command = commandWithParties.value
  when (command) {
    is Commands.Send -> // validation for sending
    is Commands.Reply -> requireThat {
      // general requirements from previous snippet
      // precise requirements for `MessageState`
      "One input should be consumed when replying to a message." using (tx.inputs.size == 1)
      "Only one output state should be created when replying to a message." using (tx.outputs.size == 1)
      val output = tx.outputsOfType<MessageState>().single()
      val input = tx.inputsOfType<MessageState>().single()
      "Only the original message's recipient can reply to the message" using (output.sender == input.recipient)
      "The reply must be sent to the original sender" using (output.recipient == input.sender)
      // covered by the general requirements
      "The original sender must be included in the required signers" using commandWithParties.signers.contains(input.sender.owningKey)
      "The original recipient must be included in the required signers" using commandWithParties.signers.contains(input.recipient.owningKey)
    }
  }
}
```

These rules are specific to the `MessageState`'s use-case. Restricting the parties who can reply to a message. More precisely, the sender of the reply must be the recipient of the original message and can only be sent back to the original sender. These rules make sense in this scenario.

Even with these rules, dodgy transactions can still go through. The contract checks the signatures based on the transaction's states as well as the contents of the states. But, there are still some ways around these.

That being said, some of these situations can only occur if a transaction has been sent to parties not originally involved in an exchange. This is the sort of scenario that can arise from broadcasting transactions as I mentioned in the introduction and in [Broadcasting a transaction to external organisations](https://lankydan.dev/broadcasting-a-transaction-to-external-organisations).

Now that I have set the stage let me explain a hole in the contract above. There is nothing preventing a third-party from creating a mimicked reply to the original message. In that, the sender and recipient of the reply are valid, but the message is created by someone else that is not actually the sender. It is a bit to get your head around, so you might need to read that sentence a few times.

To prevent this from occurring, some logic needs to be added into the flow that creates this transaction. This will be the topic of the following section.

Before we move on, I want to highlight again that this situation can only occur when the original transaction has been shared around with other parties. Therefore, it could be a situation that never happens. But it could. Covering your bases in these scenarios really depends on your use-case and how paranoid you are of users being naughty.

## Flow verification

Flows provide a space for you to add transaction verification that lives outside of the contract. These can be rules that are more specific to an individual organisation (I touched on this in [Extending Flows to customise transaction validation](https://lankydan.dev/extending-flows-to-customise-transaction-validation)), or rely on information not available to the contract.

Following on from the previous section where I mentioned there being a few holes in the contract verification. The responder flow below adds two restraints to patch them up:

```kotlin
@InitiatedBy(ReplyToMessageFlow::class)
class ReplyToMessageResponder(private val session: FlowSession) : FlowLogic<SignedTransaction>() {

  @Suspendable
  override fun call(): SignedTransaction {
    val stx = subFlow(object : SignTransactionFlow(session) {
      override fun checkTransaction(stx: SignedTransaction) {
        val message = stx.coreTransaction.outputsOfType<MessageState>().single()
        require(message.sender != ourIdentity) {
          "The sender of the new message cannot have my identity when I am not the creator of the transaction"
        }
        require(message.sender == session.counterparty) {
          "The sender of the reply must must be the party creating this transaction"
        }
      }
    })
    return subFlow(
      ReceiveFinalityFlow(
        otherSideSession = session,
        expectedTxId = stx.id
      )
    )
  }
}
```

The `require` blocks in this example are not possible from inside the contract as they need information that the contract does not contain. This extra context is vital. The contract can only validate based on the information it is given. On the other hand, the flow knows that it is on the receiving end of a proposed transaction and who is the counterparty sending it.

Using this knowledge, the flow can add two new rules.

- The sender of the reply cannot have the flow's identity. Preventing another party from impersonating their identity and attempting to send a reply on their behalf.
- The sender of the reply must be the owner of the counterparty session. Preventing another party from mimicking the identity of the sender.

Although the second rule is a superset of the first, splitting them out provides an opportunity for a better error message. If the messages are not important to you, then removing the first `require` statement is ok.

Thanks to the contract, the transaction has to gather this party's signature before it can be persisted. Providing the opportunity for their responder flow to add additional validation and decline it if needed. With the contract and flow working as a team, the chances of the flow being used illegally are vastly reduced.

## Conclusion

Due to Corda's flexibility, it is your responsibility as a CorDapp developer to restrain your application enough to prevent invalid usage. This is further complicated by the ability to share transactions with nodes not involved in original interactions. If the CorDapp is not put together thoughtfully, a transaction's states could be spent by a party that does not have direct ownership over the states. The validation found inside your contracts and flows is essential to prevent these scenarios from occurring.

However, it is important to remember that it really does depend on your use-case. Maybe you want to allow parties to spend states they don't own from transactions shared with them. In that case, you could relax the CorDapp's restrictions. As long as it is by design rather than an oversight.

If you enjoyed this post or found it helpful (or both) then please feel free to follow me on Twitter at [@LankyDanDev](https://twitter.com/LankyDanDev) and remember to share with anyone else who might find this useful!
