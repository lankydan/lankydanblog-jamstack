---
title: Extending Flows to customise transaction validation
date: "2019-05-18"
published: true
tags: [corda, corda 4, kotlin, dlt, distributed ledger technology, blockchain]
cover_image: ./corda-cherry-blossom.png
github_url: https://github.com/lankydan/corda-extendable-flows/tree/extra-validation-logic-in-responder-flow
---

Through the use of flow extension, nodes running the same CorDapp can include extra validation to ensure that a transaction meets their specific requirements. The validation inside contracts focuses on the rules that must be adhered to by all transacting parties. Because of this, they are more general and focus on ensuring that no one is putting together invalid transactions. This leaves out any checks that individual organisations require. By providing a base CorDapp between the organisations with the ability to add further checks, they can each tailor the CorDapp to meet their needs. Flow extension makes this possible. Continuing the push for organisations to communicate together through common CorDapps while still providing enough customisation to meet each of their specific requirements.

That introduction might have caught your attention (I hope it did anyway), but the code to achieve this is relatively simple. It follows the same concepts that I wrote about in [Extending and Overriding Flows from external CorDapps](https://lankydan.dev/extending-and-overriding-flows-from-external-cordapps). The extra transaction validation I have been talking about can be achieved by providing a single `open` function inside of a flow or responder flow.

I will skip over a lot of information in the following snippets since they were covered in [Extending and Overriding Flows from external CorDapps](https://lankydan.dev/extending-and-overriding-flows-from-external-cordapps). If you haven't realised this by now, I heavily recommend that you read that post.

For extra validation in the initiating flow, I believe a base flow that looks like the example below is what you want:

```kotlin
@InitiatingFlow
open class SendMessageFlow(private val message: MessageState) :
  FlowLogic<SignedTransaction>() {

  open fun extraTransactionValidation(transaction: TransactionBuilder) {
    // to be implemented by subtype flows - otherwise do nothing
  }

  @Suspendable
  final override fun call(): SignedTransaction {
    // build transaction
    val tx = verifyAndSign(transaction)
    // collect signatures
    // save transaction
  }

  private fun verifyAndSign(transaction: TransactionBuilder): SignedTransaction {
    extraTransactionValidation(transaction)
    transaction.verify(serviceHub)
    return serviceHub.signInitialTransaction(transaction)
  }
}
```

Calling `extraTransactionValidation` before the `TransactionBuilder`'s `verify` function forces the proposed transaction to meet an organisation's personal requirements before running any shared transaction validation.

An implementation of `extraTransactionValidation` is provided by a extended flow. Its implementation might look like:

```kotlin
class ExtraValidationSendMessageFlow(message: MessageState) :
  SendMessageFlow(message) {

  override fun extraTransactionValidation(transaction: TransactionBuilder) {
    requireThat {
      val messages = transaction.toLedgerTransaction(serviceHub).outputsOfType<MessageState>()
      "There must be only one output message" using (messages.size == 1)
      val message = messages.single()
      "Message must contain the secret passphrase" using (message.contents.contains("I love Corda"))
    }
  }
}
```

This is pretty much the same sort of validation you would see inside of a contract. That is the point really. The validation is done in the same way, but the rules the transaction is checked against are customised.

In a similar fashion to the initiating flow. The base responder flow will look like the following snippet:

```kotlin
@InitiatedBy(SendMessageFlow::class)
open class SendMessageResponder(private val session: FlowSession) : FlowLogic<SignedTransaction>() {

  open fun extraTransactionValidation(stx: SignedTransaction) {
    // to be implemented by subtype flows - otherwise do nothing
  }

  @Suspendable
  final override fun call(): SignedTransaction {
    val stx = subFlow(object : SignTransactionFlow(session) {
      override fun checkTransaction(stx: SignedTransaction) {
        extraTransactionValidation(stx)
      }
    })
    // save transaction
  }
}
```

Adding the `extraTransactionValidation` to the body of `SignTransactionFlow.checkTransaction` makes perfect sense. `checkTransaction` and subsequently `extraTransactionValidation` runs before the general contract validation that `SignTransactionFlow` executes.

Below is an example flow extending the base flow and implementing `extraTransactionValidation`:

```kotlin
@InitiatedBy(SendMessageFlow::class)
class ExtraValidationSendMessageResponder(session: FlowSession) :
  SendMessageResponder(session) {

  override fun extraTransactionValidation(stx: SignedTransaction) {
    requireThat {
      val messages = stx.coreTransaction.outputsOfType<MessageState>()
      "There must be only one output message" using (messages.size == 1)
      val message = messages.single()
      "Message must contain the secret passphrase" using (message.contents.contains("I love Corda"))
    }
  }
}
```

Yes, this validation is also included in the initiating flow. This is what I am talking about. By adding this validation into both the initiating and responder flow, an organisation can ensure that any transactions that pass through their system meet their precise requirements.

Due to the nature of this validation, it could be moved out into a function shared between the flows:

```kotlin
private fun validate(transaction: BaseTransaction) {
  requireThat {
    val messages = transaction.outputsOfType<MessageState>()
    "There must be only one output message" using (messages.size == 1)
    val message = messages.single()
    "Message must contain the secret passphrase" using (message.contents.contains("I love Corda"))
  }
}
```

This Kotlin function has been moved out of a class, making it a static function. It can then be used in both flows.

One point I want to explore further before wrapping up this post is the additional validation in the initiating flow. It is highly likely that a transaction put together by an organisation will be found valid by that same organisation. So the question is, why add the extra checks into the flow? Similar validation could be done before the flow has been invoked. Which is a perfectly valid place to do it. The benefit of adding it to the flow is realised when using a third-party CorDapp. It is further compounded as the complexity of a CorDapp increases. Determining the states created by a complex flow might not be a simple thing to do. Therefore creating and immediately checking a transaction's contents is the safest thing to do.

To conclude, placing additional validation inside of flows ensures that transacting organisations are completely happy with the contents of transactions before they commit them. Furthermore, it continues the push for organisations to utilise CorDapps implemented by third-party developers. By providing enough flexibility in CorDapps for organisations to add their own rules. It becomes easier to adopt them, due to the guarantees that transactions meet the requirements of any organisation in the network.

The rest of the code used in this post can be found on my [Github](https://github.com/lankydan/corda-extendable-flows/tree/extra-validation-logic-in-responder-flow).

If you enjoyed this post or found it helpful (or both) then please feel free to follow me on Twitter at [@LankyDanDev](https://twitter.com/LankyDanDev) and remember to share with anyone else who might find this useful!