---
title: Responder flow validation (part 3 - overriding)
slug: responder-flow-validation-overriding
date: "2020-01-06"
published: true
tags: [corda, kotlin, dlt, distributed ledger technology, blockchain]
cover_image: ./title-card.png
---

To finish off my trilogy of blog posts on including validation inside your responder flows, I present to you the final topic. How to override a responder flow with your own custom implementation. You will need to go down this route if you are leveraging an external CorDapp that does not allow you to extend their flows. It is not ideal, as you will not be able to make use of any of the responder code that was written. But, at least it will provide you with a way to implement your requirements while still allowing your version to communicate to the paired initiating flow. To cement what I am saying, I will say it one more time, you should only override if you cannot extend.

Before I get to the good stuff and show you what you need to do, if you really do need to go down this route, you should send an angry email to whoever wrote the CorDapp you are utilising. Moreover, you can tell them to read [Responder flow validation (part 2 - extension)](/responder-flow-validation-extension) with some passive-aggressive message to go along with it 😎.

The content of this post is really a rehashing on what I already wrote in [Extending and Overriding Flows from external CorDapps](/2019/03/02/extending-and-overriding-flows-from-external-cordapps), except that I will focus precisely on overriding a responder flow.

## When to override

So what sort of flow will you need to override?

Below is a flow that cannot be extended:

```kotlin
@InitiatedBy(SendMessageFlow::class)
class SendMessageResponder(private val session: FlowSession) : FlowLogic<SignedTransaction>() {

  @Suspendable
  override fun call(): SignedTransaction {
    val stx = subFlow(object : SignTransactionFlow(session) {
      override fun checkTransaction(stx: SignedTransaction) {
      }
    })
    return subFlow(ReceiveFinalityFlow(otherSideSession = session, expectedTxId = stx.id))
  }
}
```

As this flow is written in Kotlin, the class is `final` and cannot be extended. In Java, the class would need to be marked as `final` explicitly to prevent you from extending it. In other words, all language rules around extending classes apply here and nothing else. If you tried to write a new flow that extended the one above, you would find a few compiler errors blocking your way.

Since this flow cannot be extended, the only solution is overriding it (or not using it at all).

## How to override

To override the flow, you must do the following:

- Write your own flow from scratch
- Include `@InitiatedBy` and reference the initiating flow that your implementation should respond to
- Add the `flowOverrides` configuration to your `node.conf`

Once these steps are taken, the node will start routing all calls to the original responder flow to your custom implementation.

Let's look into each point a bit further:

- __Write your own flow from scratch__
  - This could look like:

    ```kotlin
    @InitiatedBy(SendMessageFlow::class)
    class ValidatingSendMessageResponder(private val session: FlowSession) : FlowLogic<SignedTransaction>() {

      @Suspendable
      override fun call(): SignedTransaction {
        val stx = subFlow(object : SignTransactionFlow(session) {
          override fun checkTransaction(stx: SignedTransaction) {
            val message = stx.coreTransaction.outputStates.single() as MessageState
            check(message.recipient == ourIdentity) { "I think you got the wrong person" }
            check(!message.contents.containsSwearWords()) { "Mind your language" }
            check(!message.contents.containsMemes()) { "Only serious messages are accepted" }
            check(message.sender.name.organisation != "Nigerian Prince") { "Spam message detected" }
          }
        })
        return subFlow(ReceiveFinalityFlow(otherSideSession = session, expectedTxId = stx.id))
      }
    }
    ```

 > Note that there is no mention of the original responder flow

- __Include `@InitiatedBy` and reference the initiating flow that your implementation should respond to__
  - This was shown in the code block above:

    ```kotlin
    @InitiatedBy(SendMessageFlow::class)
    class ValidatingSendMessageResponder(private val session: FlowSession) : FlowLogic<SignedTransaction>() {
    ```

- __Add the `flowOverrides` configuration to your `node.conf`__
  - Add the following to your `node.conf`:

    ```java
    flowOverrides {
      overrides=[
        {
          initiator="dev.lankydan.tutorial.flows.SendMessageFlow"
          responder="dev.lankydan.tutorial.flows.ValidatingSendMessageResponder"
        }
      ]
    }
    ```

  This links `SendMessnageFlow` to `ValidatingSendMessageResponder` instead of the original `SendMessageResponder`

  - You can also add this configuration to the `deployNodes` build task:

    ```groovy
    node {
      name "O=PartyB,L=London,C=GB"
      p2pPort 10003
      flowOverride(
        "dev.lankydan.tutorial.flows.SendMessageFlow",
        "dev.lankydan.tutorial.flows.ValidatingSendMessageResponder"
      )
    }
    ```

When all these steps have been made, you should see a similar line in your node's log file:

```java
[INFO ] 2020-01-05T10:07:03,093Z [main] internal.NodeFlowManager. - Registered dev.lankydan.tutorial.flows.SendMessageFlow
 to initiate dev.lankydan.tutorial.flows.ValidatingSendMessageResponder (version 1)
```

This shows that the flow has been successfully switched out for the overridden version.

Forgetting to make step 2 or 3 will lead to errors.

- Forgetting to add the `@InitiatedBy` annotation will cause the node to keep using the original flow
- Forgetting to include the `flowOverrides` configuration will lead to an error due to multiple flows with the same `@InitiatedBy` annotation:

  ```java
  [ERROR] 2020-01-05T10:07:35,276Z [main] internal.NodeStartupLogging. - Exception during node startup: Unable to determine which flow to use when responding to:
  dev.lankydan.tutorial.flows.SendMessageFlow. [dev.lankydan.tutorial.flows.SendMessageResponder, dev.lankydan.tutorial.flows.ValidatingSendMessageResponder] are all
  registered with equal weight.
  ```

## Conclusion

That brings us to the end of this trilogy of blog posts on responder flow validation.

- Starting with why you should include validation in [Responder flow validation](/responder-flow-validation)
- With the sequel detailing how to write flows that can be extended in [Responder flow validation (part 2 - extension)](/responder-flow-validation-extension)
- Finally ending with this post on overriding responder flows

You should now have a good understanding of why you should include validation in your responder flows, how to write extendable flows for other developers to leverage and how to override a flow if can't be extended.

If you enjoyed this post or found it helpful (or both) then please feel free to follow me on Twitter at [@LankyDanDev](https://twitter.com/LankyDanDev) and remember to share with anyone else who might find this useful!
