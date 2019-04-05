---
title: Developing with Corda 4
date: "2019-04-05"
published: true
tags: [corda, corda 4, kotlin, dlt, distributed ledger technology, blockchain]
canonical_url: https://lankydanblog.com/2018/06/05/developing-with-corda/
cover_image: ./corda-sunset-mountains.png
github_url: https://github.com/corda/corda-training-solutions
---

This is an updated version of the [Developing with Corda](https://lankydanblog.com/2018/06/05/developing-with-corda/) post that I wrote last year. Since then quite a lot has changed, but from your perspective, as a developer, it should feel very similar. Corda has changed a lot to increase its performance, improve security and provide a better developer experience. Touching on the last point, improving the developer experience requires adding better functionality while removing less desirable parts. But, to do so while maintaining backwards compatibility allows you to go through the process of working with Corda 3 to 4 come with little issues. That being said, there are a few differences. These are the things that will be highlighted throughout this post while mainly focusing on providing a base for any newer Corda developers reading this.

If you have already worked with Corda before, then skimming through this post is probably enough. Maybe you have worked with Corda 3 and want to upgrade to 4, then taking a quick look at the code examples and seeing if anything looks different will probably get you what you need out of this post. But, if you are a brand new to Corda, then I recommend you take some time to read through this as well as [What is Corda?](https://lankydanblog.com/2018/06/05/what-is-corda/) and watch the [Corda key concepts](https://docs.corda.net/key-concepts.html).

From this point on you will be reading through an updated version of [Developing with Corda](https://lankydanblog.com/2018/06/05/developing-with-corda/).

In [What is Corda?](https://lankydanblog.com/2018/06/05/what-is-corda/) I gave an overview of what Corda is trying to achieve and the design decisions that were made to do so. That information is great to know so we can get some perspective of the platform but it's not going to help us in writing a system that can leverage Corda. To do that we need to know how the components of Corda work and fit together, only then can we start writing an application that actually does something and works correctly from the perspective of Corda. I see this as the same as learning any other framework. But, we need the voice in the back of our heads to remind us every now and then that we are in fact designing upon a Distributed Ledger Technology platform. Steps need to be taken to ensure that the applications we create are properly designed.

In this post, we will look at writing a very simple Corda application.

Corda is compatible with any JVM language. I know you're thinking it, but no, it's not written in Java. It is actually written in Kotlin. This might require a little bit of extra learning to get to grips with Kotlin if you normally work with Java (like I do) but it shouldn't take you long to be comfortable with it. Due to this, I personally suggest writing your own code in Kotlin to keep the whole stack in the same language. This will help when you need to dig down into Corda's own code as it will look less alien compared to what you were just writing. Obviously, that is just my suggestion and you could instead use Clojure. But you're going to find it hard to get a hold of any existing examples without first converting them into their Clojure equivalents.

It is a bit hard to dive straight into the code without first understanding the [key concepts of Corda](https://docs.corda.net/key-concepts.html). Rather than going through these myself, I personally believe the documentation provide on this subject is very helpful and should get you most of the way there.

For the purpose of this post, I think it is best to leave out the configuration required to actually setup Corda nodes and instead we should fully focus on writing a Corda application.

## Overview of the application

Before we can begin writing any code, we need to have an understanding of what the application is trying to achieve. Rather than coming up with my own example, I will lean upon [r3's training materials](https://github.com/corda/corda-training-solutions) as the example is reasonably simple to understand. This example is the "IOU" process (I owe you), where someone requests for some money which will be paid back at a later date. In this post, we will just focus on the issuing of an IOU.

Below is a sequence diagram containing the very simplified steps involved in issuing an IOU between two people:

![very simple iou sequence diagram](./iou-sequence-diagram-1.png)

As you can see, the borrower asks for some money, if the lender agrees, then they both try and remember that the borrower owes the lender some money. This is process is simple, but even then, it has been simplified some more. In this process, we haven't actually mentioned when and how the money is transferred between them. For the purpose of this tutorial, we shall leave this transfer out and just focus on saving the intent of borrowing and lending money between them.

So, how is this sort of process modelled in Corda? Again, before we move on, I want to mention [Corda's key concepts](https://docs.corda.net/key-concepts.html) as they are extremely important for understanding what is going on properly.

To model this process in Corda, we need to replace some of the steps. Determining how much money to borrow, becomes the creation of a transaction containing this information. A party being happy with what is proposed is now represented by signing the transaction with their key. Communication between the borrower and lender is replaced with sending a transaction between them. Finally, remembering who owes who is now set in stone with both parties saving the transaction that occurred between them. By altering the simple diagram with this new information, a new version is created:

![iou sequence diagram 2](./iou-sequence-diagram-2.png)

There are more steps, but the process is still pretty simple. The diagram really speaks for itself and I don't think there is anything more I can add to it. What I will say, is that I have still further simplified the diagram a little bit by removing the Notary, but only to focus on the process we are trying to model. We'll touch on what a Notary is very, very, very briefly later on but I will again suggest [Corda's documentation](https://docs.corda.net/key-concepts-notaries.html) on the subject (I'll do the same again later on).

These diagrams should provide us with enough guidance to put our Corda application together for issuing an IOU between two parties.

## States

Onto the coding sections, let's start with states. Information on states can be found [here](https://docs.corda.net/key-concepts-states.html) from the Corda documentation. States are passed around the network between nodes and eventually find themselves stored on the ledger. In terms of a transaction, a state can be an input or an output and many of these can exist on a single transaction. They are also immutable, which is required to build up the chain of states that are used within transactions.

As mentioned earlier, I am leaning upon [r3 training materials](https://github.com/corda/corda-training-solutions). Below is the `IOUState` that will be passed around with the application:

```kotlin
@BelongsToContract(IOUContract::class)
data class IOUState(
  val amount: Amount<Currency>,
  val lender: Party,
  val borrower: Party,
  val paid: Amount<Currency> = Amount(0, amount.token),
  override val linearId: UniqueIdentifier = UniqueIdentifier()
) : LinearState {

  override val participants: List<Party> get() = listOf(lender, borrower)
}
```

Due to the "IOU" concept, pretty much all the fields make sense without much explanation; `amount` is the lent amount, `lender` the party lending the money and so on. The only property that needs explaining is `linearId` which is of type `UniqueIdentifier`, this class is basically a UUID, in fact, it's `internalId` is generated from the `UUID` class.

The state extends `LinearState` which is one of the general types of state that Corda uses with another being `FungibleState`. Both of these are implementations of `ContractState`. `LinearState`s are used to represent states that, quoting its docs, _evolves by superseding itself_. As such, when the state is updated it should be included as an input of a transaction with a newer version being output. The old state will now be marked as `CONSUMED` from `UNCONSUMED` when saved to the vault (Corda's abstraction over the database).

`ContractState` requires a property that returns the participants of the state.

The participants are a very important part of the state. The parties defined within this list determine who gets to have the state saved to their own vault/database. If you find that your state is not being saved to a party that should know about it, this is most likely the issue. I have personally run into and felt the pain of this mistake.

In the above code, the participants were not included in the constructor and instead relies on defining a `get` function that can be used to retrieve them. Here it returns the `lender` and the `borrower` since they are the only two parties involved in the transaction. If you wanted to, you could add the `participants` to the constructor like below:

```kotlin
@BelongsToContract(IOUContract::class)
data class IOUState(
  val amount: Amount<Currency>,
  val lender: Party,
  val borrower: Party,
  val paid: Amount<Currency> = Amount(0, amount.token),
  override val linearId: UniqueIdentifier = UniqueIdentifier(),
  override val participants: List<Party> = listOf(lender, borrower)
) : LinearState
```

This allows you to define participants that might not be included in the state. Which route you take depends on your use-case, for this tutorial either will do the job.

One quick little thing before moving onto the next section. The `@BelongsToContract` annotation, that was not mentioned before, is binding a state to a contract (which we will look at very soon). Another way to write the same code without the need for the annotation is to move the state into an inner class of the contract, this would look something like the below:

```kotlin
class IOUContract : Contract {

  data class IOUState(
    val amount: Amount<Currency>,
    val lender: Party,
    val borrower: Party,
    val paid: Amount<Currency> = Amount(0, amount.token),
    override val linearId: UniqueIdentifier = UniqueIdentifier(),
    override val participants: List<Party> = listOf(lender, borrower)
  ) : LinearState
}
```

If you don't do this or add the annotation then you're going to get the following warning:

```log
[WARN] 16:41:55,620 [Test worker] contracts.TransactionState.<init> - State class net.corda.training.state.IOUState
is not annotated with @BelongsToContract, and does not have an enclosing class which implements Contract.
Annotate IOUState with @BelongsToContract(net.corda.training.contract.IOUContract.class) to remove this warning.
```

Lucky for you, it is a clear message and should point you in the correct direction. If you ever get around to looking into the Corda codebase then you will see that the inbuilt states that have their own contracts are written like the example above. More information on this can be found in the [Corda 3 to 4 upgrade notes](https://docs.corda.net/head/upgrade-notes.html#step-7-security-add-belongstocontract-annotations).

## Contracts

Next up are contracts. Contracts are used to validate input and output states for a given command by all parties involved in the transaction. The command could be, for example, issuing the state or paying off owed money. We will look at commands slightly later in this section but we should be able to brush over them for now.

Contracts are quite nice to write due to their expressiveness. We are able to write conditions within the contract that must be met for a transaction to be valid. If any are not met then an exception will be thrown. This normally ends in terminating the current transaction since an involved party has found it invalid.

These conditions use the `requireThat` DSL that Corda defines to specify conditions along with error messages that detail what is wrong with the transaction. This makes it nice and easy to go through a contract and understand what it is doing since the code conditions are nicely complemented by the English messages (or whatever language you want to write them in).

Below is an example of a contract that is used to validate the `IOUState` defined above:

```kotlin
class IOUContract : Contract {

  companion object {
    @JvmStatic
    val IOU_CONTRACT_ID = "net.corda.training.contract.IOUContract"
  }

  interface Commands : CommandData {
    class Issue : TypeOnlyCommandData(), Commands
    class Transfer : TypeOnlyCommandData(), Commands
    class Settle : TypeOnlyCommandData(), Commands
  }

  override fun verify(tx: LedgerTransaction) {
    val command = tx.commands.requireSingleCommand<IOUContract.Commands>()
    when (command.value) {
      is Commands.Issue -> requireThat {
        "No inputs should be consumed when issuing an IOU." using (tx.inputs.isEmpty())
        "Only one output state should be created when issuing an IOU." using (tx.outputs.size == 1)
        val iou = tx.outputStates.single() as IOUState
        "A newly issued IOU must have a positive amount." using (iou.amount.quantity > 0)
        "The lender and borrower cannot have the same identity." using (iou.borrower != iou.lender)
        "Both lender and borrower together only may sign IOU issue transaction." using
                (command.signers.toSet() == iou.participants.map { it.owningKey }.toSet())
      }
      is Commands.Transfer -> requireThat {
        // more conditions
      }
      is Commands.Settle -> {
        // more conditions
      }
    }
  }
}
```

I have simplified the contract for the purpose of this post since we will only focus on implementing one command type. Let's start from the top and work our way down.

The `IOUContract` implements `Contract` requiring it to now have a `verify` function that gets called to verify (hence the name) a transaction.

### Contract class name

The class name of the contract has been included here:

```kotlin
companion object {
  @JvmStatic
  val IOU_CONTRACT_ID = "net.corda.contracts.IOUContract"
}
```

This is used in other parts of Corda when reflection is required. Another way to write this if you don't want to put the string in directly is like below:

```kotlin
companion object {
  @JvmStatic
  val IOU_CONTRACT_ID = IOUContract::class.qualifiedName!!
}
```

### Commands

Now we can talk about the commands that I briefly mentioned earlier on in this section. I have put them below again so you don't need to scroll again:

```kotlin
interface Commands : CommandData {
  class Issue : TypeOnlyCommandData(), Commands
  class Transfer : TypeOnlyCommandData(), Commands
  class Settle : TypeOnlyCommandData(), Commands
}
```

These commands are used to specify the intention of the transaction. They have been put here due to their connection to the contract since they determine what conditions must be validated. That being said, you could put these commands somewhere else if you wanted, such as in their own file or outside of the contract class but within the same file. As long as your solution best describes your intention then you are probably going in the correct direction.

Since these commands are simple and are only used to specify intent, `TypeOnlyCommandData` is extended. Other abstract classes are available that specify commands that we might want to use, such as `MoveCommand`.

We will see how to use the commands in the next section.

### Implementing verify

Here's where most of the magic happens, the code has been copied and pasted below:

```kotlin
override fun verify(tx: LedgerTransaction) {
  val command = tx.commands.requireSingleCommand<IOUContract.Commands>()
  when (command.value) {
    is Commands.Issue -> requireThat {
      "No inputs should be consumed when issuing an IOU." using (tx.inputs.isEmpty())
      "Only one output state should be created when issuing an IOU." using (tx.outputs.size == 1)
      val iou = tx.outputStates.single() as IOUState
      "A newly issued IOU must have a positive amount." using (iou.amount.quantity > 0)
      "The lender and borrower cannot have the same identity." using (iou.borrower != iou.lender)
      "Both lender and borrower together only may sign IOU issue transaction." using
              (command.signers.toSet() == iou.participants.map { it.owningKey }.toSet())
    }
    is Commands.Transfer -> requireThat {
      // more conditions
    }
    is Commands.Settle -> {
      // more conditions
    }
  }
}
```

The verify function checks whether the proposed transaction is valid. If so, the transaction will continue forward and most likely be signed and committed to the ledger. But, if any of the conditions are not met an `IllegalArgumentException` is thrown thus leading to the termination of the proposed transaction.

Exceptions are generally how Corda deals with unmet requirements. When an exception is thrown, assuming nothing is trying to catch it, execution is terminated and propagated up until it is caught or it ends up in the console output. This provides a simple way to control the flow of the transaction since it can be stopped anywhere in its execution, even on the counterparty's node, as the exception will be passed back to the initiator.

Onto the verification code itself. The command that the transaction is executing on its states is retrieved and depending on the type, different checks are made to check the validity of the transaction. The `requireThat` DSL that Corda provides allows you to write a condition that must be true to continue along an error message that is output if the condition is false.

Let's look at one of the `requireThat` statements a bit more closely:

```kotlin
val iou = tx.outputStates.single() as IOUState
"A newly issued IOU must have a positive amount." using (iou.amount.quantity > 0)
```

There's not much to explain here. The DSL takes care of the intent of the statement. What I will point out is the syntax:

```
<string message of what condition should be met> using <condition it must pass>
```

Quite simple. Although I will highlight this point. Something that used to stupidly catch me out when I started working with Corda, was the need for brackets in the `using` statement if the condition contains any spaces. Forgetting this will give you some errors 🤦‍. Finally, the DSL can contain code that is not in a condition expression, allowing you to initialise variables and such which can then be used in the actual conditions.

That's enough of contracts for now. They will pop up again in the next section when we put the `IOUContract` into action.

## Flows

In Corda, flows are the central point where we tie off all previous sections. States, contracts, and commands all come together to write the code that will propose a new transaction, send it to all counterparties to sign and commit it to the ledger if everyone is happy. You can do much more complicated things within flows but for this tutorial, we will stick with the basics.

Following on from the examples in the previous sections, we will now implement the `IOUIssueFlow`. Below is the code as a whole which we will then split and examine:

```kotlin
@InitiatingFlow
@StartableByRPC
class IOUIssueFlow(val state: IOUContract.IOUState) : FlowLogic<SignedTransaction>() {
  @Suspendable
  override fun call(): SignedTransaction {
    val transaction: TransactionBuilder = transaction()
    val signedTransaction: SignedTransaction = verifyAndSign(transaction)
    val sessions: List<FlowSession> = (state.participants - ourIdentity).map { initiateFlow(it) }.toSet().toList()
    val transactionSignedByAllParties: SignedTransaction = collectSignature(signedTransaction, sessions)
    return recordTransaction(transactionSignedByAllParties, sessions)
  }

  private fun transaction(): TransactionBuilder {
    val notary: Party = serviceHub.networkMapCache.notaryIdentities.first()
    val issueCommand: Command<IOUContract.Commands.Issue> =
      Command(IOUContract.Commands.Issue(), state.participants.map { it.owningKey })
    val builder = TransactionBuilder(notary = notary)
    builder.addOutputState(state, IOUContract.IOU_CONTRACT_ID)
    builder.addCommand(issueCommand)
    return builder
  }

  private fun verifyAndSign(transaction: TransactionBuilder): SignedTransaction {
    transaction.verify(serviceHub)
    return serviceHub.signInitialTransaction(transaction)
  }

  @Suspendable
  private fun collectSignature(
    transaction: SignedTransaction,
    sessions: List<FlowSession>
  ): SignedTransaction = subFlow(CollectSignaturesFlow(transaction, sessions))

  @Suspendable
  private fun recordTransaction(transaction: SignedTransaction, sessions: List<FlowSession>): SignedTransaction =
    subFlow(FinalityFlow(transaction, sessions))
}

@InitiatedBy(IOUIssueFlow::class)
class IOUIssueFlowResponder(val flowSession: FlowSession) : FlowLogic<SignedTransaction>() {

  @Suspendable
  override fun call(): SignedTransaction {
    val signTransactionFlow = object : SignTransactionFlow(flowSession) {
      override fun checkTransaction(stx: SignedTransaction) = requireThat {
        val output = stx.tx.outputs.single().data
        "This must be an IOU transaction" using (output is IOUContract.IOUState)
      }
    }
    val signedTransaction = subFlow(signTransactionFlow)
    return subFlow(ReceiveFinalityFlow(otherSideSession = flowSession, expectedTxId = signedTransaction.id))
  }
}
```

The flow of this code (yes that is a pun 😅) is reasonably straight forward and will be possibly one of the typical flows that you write within your own application. I can say for most flows that I have written over the last year or so for both work and for my other blog posts have followed this sort of structure. To be honest, whenever I start a new one, I copy and paste one a flow that looks like this and then start from there. Hasn't failed me yet 🙂.

You obviously don't have to write your flows in the exact same way. I have split the `call` function into a load of smaller functions. It does actually make the code a lot longer. But, I don't think it can get any easier to read than that 😎.

Anyway, enough about myself and back to the code.

What it does:

- Creates a state
- Adds the state to a new transaction
- Verifies the transaction with a contract
- Signs the transaction
- Requests the signatures of the counterparties
- Saves the transaction for all participants

Now that we know the steps that are made within this flow, we can go through and explain how this is done within the code.

### The Initiating Flow

Here's the code again with just the Initiating Flow extracted from it:

```kotlin
@InitiatingFlow
@StartableByRPC
class IOUIssueFlow(val state: IOUContract.IOUState) : FlowLogic<SignedTransaction>() {
  @Suspendable
  override fun call(): SignedTransaction {
    val transaction: TransactionBuilder = transaction()
    val signedTransaction: SignedTransaction = verifyAndSign(transaction)
    val sessions: List<FlowSession> = (state.participants - ourIdentity).map { initiateFlow(it) }.toSet().toList()
    val transactionSignedByAllParties: SignedTransaction = collectSignature(signedTransaction, sessions)
    return recordTransaction(transactionSignedByAllParties, sessions)
  }

  private fun transaction(): TransactionBuilder {
    val notary: Party = serviceHub.networkMapCache.notaryIdentities.first()
    val issueCommand: Command<IOUContract.Commands.Issue> =
      Command(IOUContract.Commands.Issue(), state.participants.map { it.owningKey })
    val builder = TransactionBuilder(notary = notary)
    builder.addOutputState(state, IOUContract.IOU_CONTRACT_ID)
    builder.addCommand(issueCommand)
    return builder
  }

  private fun verifyAndSign(transaction: TransactionBuilder): SignedTransaction {
    transaction.verify(serviceHub)
    return serviceHub.signInitialTransaction(transaction)
  }

  @Suspendable
  private fun collectSignature(
    transaction: SignedTransaction,
    sessions: List<FlowSession>
  ): SignedTransaction = subFlow(CollectSignaturesFlow(transaction, sessions))

  @Suspendable
  private fun recordTransaction(transaction: SignedTransaction, sessions: List<FlowSession>): SignedTransaction =
    subFlow(FinalityFlow(transaction, sessions))
}
```

Firstly, the flow class is annotated with `@InitiatingFlow` and extends `FlowLogic`. This combination is required by any flow that requests communication with a counterparty. `FlowLogic` contains one abstract function `call` that needs to be implemented by the flow. This is where all the magic happens. When the flow is triggered, which we will look at later, `call` is executed and any logic that put inside the function runs. `FlowLogic` is generic (`FlowLogic<T>`) where `T` determines the return type of `call`. In the above example, a `SignedTransaction` is returned but it is totally feasible to use `FlowLogic<Unit>` if you have no desire to return anything back to the caller of the flow.

Next up is the `@StartableByRPC` annotation. This allows the flow to be called from an RPC connection which is the interface between the outside of a Corda node and it's internals. We'll touch on this a bit more when we look at triggering the flow.

Yet another annotation popping up. `@Suspendable` actually originates from `quasar-core` instead of one of Corda's own libraries. If you forget to add it then you will see the error below and your flow will hang:

```
java.lang.IllegalArgumentException: Transaction context is missing.
This might happen if a suspendable method is not annotated with @Suspendable annotation.
```

`@Suspendable` is needed on all functions that communicate with a counterparty. As the name _suspendable_ suggests, the annotation allows the function to be suspended while the counterparty is dealing with their side of the transaction. Quite a bit of magic goes on here and it is touched on briefly in the [Corda documentation on flows](https://docs.corda.net/flow-state-machines.html#suspendable-functions).

In my original version of this post, I talked about the error being confusing and unrelated. But, it looks like that is resolved and an error message explaining exactly what is wrong has been thrown. That being said, if you do ever get some weird errors, it is still worth double checking that you have got `@Suspendable` in the right place.

Linking this back to the example. `call`, `collectSignatures` and `recordTransaction` are all annotated with `@Suspendable`. Both `collectSignatures` and `recordTransaction` call `subFlow`s that interact with counterparties. `call` on the other hand needs the annotation because it is delegating to our own functions which are _suspending_.

This is our first encounter with `subFlow`s. I will put a little section further down to quickly cover this and give the topic the explanation it deserves.

Back to the task at hand.

Missing the `@Suspendable` annotation is one of the most common pitfalls I have seen other developers fall into. So let me reiterate this point again.

> You need to add the `@Suspendable` annotation to any function that has an interaction with a counterparty

You don't understand how hard it is to not simplify this all the way down to 🤦‍

> You need to add the `@Suspendable` annotation to any function that suspends

Just read whichever one gets my point across.

Now we're done with the annotations we can look more closely at the contents of the `call` function.

### Creating the transaction

First, we will look at building the proposed transaction, the relevant code has been extracted below:

```kotlin
private fun transaction(): TransactionBuilder {
  val notary: Party = serviceHub.networkMapCache.notaryIdentities.first()
  val issueCommand: Command<IOUContract.Commands.Issue> =
    Command(IOUContract.Commands.Issue(), state.participants.map { it.owningKey })
  val builder = TransactionBuilder(notary = notary)
  builder.addOutputState(state, IOUContract.IOU_CONTRACT_ID)
  builder.addCommand(issueCommand)
  return builder
}
```

For the purpose of this post, we will assume there is only one Notary which allows us to be lazy and just retrieve the first one from the list. If you do not know what a Notary is, like earlier I suggest reviewing the [Corda Key Concepts](https://docs.corda.net/key-concepts-notaries.html) for a good explanation on the topic. For now, I'll provide you the bare minimum to carry on. A Notary is a node whose sole purpose is to validate that no double spends have occurred within a transaction sent to it. Extra validation can also be run if it is set up to do so.

The `serviceHub` comes provided since we extended `FlowLogic`; the function `networkMapCache` will then provide the identities of the parties on the network and `notaryIdentities` narrows it down even more. As I mentioned earlier, we're going to be lazy and just retrieve the first one from this list. How you retrieve the Notary that you wish to use in a transaction might change depending on your requirements.

We then create a command that represents the intent of the transaction. In this case, we use the `IOUContract.Commands.Issue` that was defined earlier. In creating the command we also need to provide the public keys of the parties required to sign the transaction. `it` is a `Party` and `owningKey` represents their public key. The only signers in this transaction are contained within the states `participants` property but an independent list could be passed in instead.

All the components needed for the transaction have now been retrieved or created. Now we need to actually start putting it together. `TransactionBuilder` does just that. The Notary is added via one of the `TransactionBuilder`'s constructors but can be set later on if preferred. `addOutputState` takes in the `state` passed into the flow along with the contract name that will verify it. Remember I mentioned two ways to get this name; via a public property within the object (how Corda normally does it) or by manually adding the classes name yourself, either way, the end goal is the same. The final component we add to this transaction is the command we created.

### Verifying and signing the transaction

The next block of code focuses on verifying and signing the transaction, again the relevant code has been pasted below:

```kotlin
private fun verifyAndSign(transaction: TransactionBuilder): SignedTransaction {
  transaction.verify(serviceHub)
  return serviceHub.signInitialTransaction(transaction)
}
```

Once we are happy that everything we want to include in the transaction has been included, we need to verify it. Simply call the `verify` function the `TransactionBuilder` provides. This function results in the validation inside the contract running against the transaction. As mentioned earlier in the contract section, if any of the conditions in the contract fail an exception is thrown. Since, in this code, there are no attempts to catch the exception, the flow will fail as the exception is propagated up the stack.

After the transaction has passed validation, as far as we (the initiator) are concerned, the transaction is valid and should be signed. To do this, `serviceHub.signInitialTransaction` is called. This creates a new `SignedTransaction` that is currently only signed by the initiator. Having this transaction signed will become important later when the Notary checks that the transaction has been signed by all the parties involved.

### Collecting signatures from the counterparties

The transaction is now both verified and signed by the initiator. The next step is requesting the signatures of the counterparties involved in the transaction. Once that is done the transaction can be persisted to everyone's vaults as they all agree that the transaction is correct and meets their needs.

Below is the code in charge of collecting signatures from counterparties:

```kotlin
@Suspendable
private fun collectSignature(
  transaction: SignedTransaction,
  sessions: List<FlowSession>
): SignedTransaction = subFlow(CollectSignaturesFlow(transaction, sessions))
```

The counterparties in this transaction are defined by the parties in the `participants` list. If we remember back to how the state's `participants` field was constructed, only two parties were contained in it, therefore only two parties will need to sign the transaction. Although that statement is correct, the transaction has already been signed by the initiator so now only the single counterparty (the `lender`) needs to sign it.

To send the transaction to the counterparty we first need to create a session with them. The code below does just that and the sessions returned from it are the input to the function above:

```kotlin
val sessions: List<FlowSession> = (state.participants - ourIdentity).map { initiateFlow(it) }.toSet().toList()
```

The `initiateFlow` function creates a session to another node, it takes in a `Party` and returns a `FlowSession` to be used for communication. As mentioned the initiator does not need to sign the transaction again through this construct, so in the code, they have been removed from the parties whose communication sessions are being created for. Due to us knowing who are involved in this transaction, the single `FlowSession` could be created with the code below instead:

```kotlin
val session = initiateFlow(state.lender)
```

Instead of relying on the `participants` list we instead just create a session for the `lender` as our knowledge of the state indicates that they are the only counterparty.

The `FlowSession` needs to be used inside of the `CollectSignaturesFlow` along with the `SignedTransaction` that is still only signed by the initiator at this point. `CollectSignaturesFlow` sends the `SignedTransaction` to the counterparty (counterparties if multiple need to sign) and awaits their response. We will look at how the response is sent back in a following section. Once returned, the `SignedTransaction` is now complete as it has been signed by everyone and can be persisted.

### Persisting the signed transaction

The following code persists the transaction:

```kotlin
subFlow(FinalityFlow(transaction, sessions))
```

Although, for a one-liner, this piece of code packs quite a punch. `FinalityFlow` will most likely always be called at the end of your flows, at least for the simpler flows anyway.

Calling `FinalityFlow` will:

- Send the transaction to the Notary (if required)
- Record the transaction to the initiator's vault
- Broadcast to the participants of the transaction to record it to their vaults

Expanding slightly on the 1st point. A transaction is only sent to a Notary if it has any input states that are being consumed. This is due to Notaries checking for previously spent states to prevent double spends. Therefore, if there are no input states then there is nothing for the Notary to do. Not sending it to the Notary is mainly an optimisation that removes wasted work.

The last two steps depend on the Notary finding the transaction valid. If it does not, like usual, an exception is thrown thus leading to an exit from the flow.

### The Responder Flow

Everything in the flow that we have looked at so far is on the initiator's side of the process. There have been a few times during the example where the transaction was sent over to the counterparty and some "stuff" happened. In this brief section we will inspect the code that the counterparty would run:

```kotlin
@InitiatedBy(IOUIssueFlow::class)
class IOUIssueFlowResponder(val flowSession: FlowSession) : FlowLogic<SignedTransaction>() {

  @Suspendable
  override fun call(): SignedTransaction {
    val signTransactionFlow = object : SignTransactionFlow(flowSession) {
      override fun checkTransaction(stx: SignedTransaction) = requireThat {
        val output = stx.tx.outputs.single().data
        "This must be an IOU transaction" using (output is IOUContract.IOUState)
      }
    }
    val signedTransaction = subFlow(signTransactionFlow)
    return subFlow(ReceiveFinalityFlow(otherSideSession = flowSession, expectedTxId = signedTransaction.id))
  }
}
```

As before this code was included earlier on in the post.

The most important line in this class is the `@InitiatedBy` annotation that specifies which flow it accepts requests from and responds back to. In this example, it is the `IOUIssueFlow` that we have already gone through.

Since `IOUIssueFlowResponder` is also a flow, it extends `FlowLogic` and will need to implement its own version of `call`. The `FlowSession` in the constructor is the session that was used by the initiator to communicate with this flow. `@Suspendable` is also used on `call` just like it was in the initiating flow.

`SignTransactionFlow` is the other half of the `CollectSignaturesFlow` that was called in the initiator. It is an abstract class that requires `checkTransaction` to be implemented. This contains any extra validation that the counterparty might want to run against the transaction. `SignTransaction`'s `call` function will still verify the transaction against the contract so this is the chance for anything else; ensuring that the transaction is up to the standards of the counterparty. Saying that, `checkTransaction` can also contain as little code as desired and could even be empty if the contract validation is enough. Rather than showing you what that would look like, I'll let you use your vivid imagination to imagine an empty function...

`subFlow` is then called on the implementation of `SignTransactionFlow` leading to it being executed. The validation in the contract runs, followed by the contents of `checkTransaction` and if all the checks come back fine, the transaction is signed and sent back to where it came from.

The final step is the invocation of `ReceiveFinalityFlow`. This is different to how it previously worked in Corda 3, where you did not need to manually receive the transaction. Anyway, this `subFlow` needs to be called to record the transaction to the vault of the counterparty. The id of the expected transaction to record is extracted from the transaction that was signed beforehand. After this point, both the counterparty will have the transaction saved away in their vault, ready to use in future flows.

The code in this class could be as simple or complicated as it needs to be. For the example used in this tutorial, simple is good enough. This will change depending on your requirements and what must be communicated between the initiator and its responders.

### Making using of subFlows

You will have seen the `subFlow` function scattered throughout the code examples. Finally, I think we have reached a point in the post where I can talk about them a bit more.

`subFlow`s are flows, similar to the one we are looking at in this post, that are called from within other flows. For example, `CollectSignaturesFlow` and `FinalityFlow` cannot be triggered by themselves as they are not annotated with `@InitiatingFlow`, therefore they can only ever be used from within a `subFlow`. Most of the flows provided by Corda out of the box fall within this same category.

All `subFlow` does is run the flow passed into it, by calling the flow's `call` function and returning whatever the flow would normally return. A flow does not require anything special to be passed into `subFlow`, if we ever needed to, `IOUIssueFlow` could be passed into it from another flow.

Corda provides flows for a lot of the typical operations that need to be repeated throughout our own flows. These are called via `subFlow` and include (and many more): `CollectSignaturesFlow`, `SignTransactionFlow`, `SendTransactionFlow` and `ReceiveTransactionFlow`.

## Starting a Flow

In this final section, we will look at how to call a flow from outside of the Corda node.

There are a few ways to do this, each working slightly differently. But, let's keep this short and sweet and only look at the bog standard `startFlow` function:

```kotlin
proxy.startFlow(::IOUIssueFlow, state)
```

That's it. As I said, short and sweet. `proxy` is of type `CordaRPCOps` which contains a load of functions revolved around interacting with the Corda node via RPC. `startFlow` is one of those functions. It takes in the name of the flow class along with any arguments that are part of the flow's constructor. So in this example, `IOUIssueFlow`'s `call` function will be invoked with an `IOUState` being passed in to be used within the flow.

A `FlowHandle<T>` is returned where `T` is the same generic type of the invoked flow, in this case, a `SignedTransaction`. `returnValue` can then be called to retrieve a `CordaFuture`, allowing the result to be retrieved as soon as it's available. `CordaFuture` is a subtype of a standard `Future` with a few extra methods made available, one of which is `toCompletableFuture` that may or not be useful to you (this was useful to me anyway).

## Wrapping up

Here we are, at the end at last.

This post should have hopefully given you some help in understanding how to go about developing with Corda. There is much more to learn as I have only covered the basics in this post. In this post, we implemented the process of an IOU while inspecting the components that are required to do so. States are facts that are shared among parties on the network, contracts are used to validate transactions and flows contain the logic to propose new transactions. With this information, you should be in a good place to start writing your own flows. There is much more you can do with flows that hasn't been covered within this post, but these basics should serve you well through any flows that you try to write.

If you found this post helpful and want to keep up with my posts as I write them, then you can follow me on Twitter at [@LankyDanDev](https://twitter.com/lankydandev).

You can also join the [Corda slack channel](https://slack.corda.net/) if you have any questions or are interested in learning about Corda further after reading this post.
