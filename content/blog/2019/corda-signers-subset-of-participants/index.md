---
title: Saving transactions where only a subset of parties are signers
date: "2019-07-05"
published: true
tags: [corda, kotlin, dlt, distributed ledger technology, blockchain]
cover_image: blog-card.png
---

It took a while for me to think of a title that could summarise the contents of this post without becoming a full sentence itself. I think I have managed to choose something legible 😅. Either way, let me clarify what I am actually talking about.

I have seen several people ask questions like the one below in Slack:

> In the example, it shows a responder flow when the node which is running the responder flow is one of the required signers. But how about the case when the node running the responder flow is not a required signer (e.g. one of the participants of a state involved in the tx)? Do I need to write responder flow for such node? If so, how should I write the responder flow?

In other words:

> I have a state that has a set of participants. Some of them must sign the transaction, some must not. How do I structure my flows, especially the responder flow to cope with this?

Due to how responder flows work, where every counterparty runs the same responder code (unless overridden). Having a group of counterparties do one thing, and another do something else is not handled by the _simple_ code found in samples. Your flows need to be constructed to handle this explicitly.

The code to do this is relatively simple, but might not be evident unless you have been developing with Corda for a while.

So far, I have two solutions to this problem. I am pretty sure these are the best solutions currently available, and I cannot think of any others that would work or are worth pursuing. These solutions are:

- Sending a flag to counterparties to tell them whether they are signers or not
- Using subflow'd `@InitiatingFlow`s to collect signatures or to save the transaction

I will expand these in following sections.

Before I get to them, what happens if you don't account for the difference in signers and participants? A typical responder flow will include:

```kotlin
@InitiatedBy(SendMessageFlow::class)
class SendMessageResponder(private val session: FlowSession) : FlowLogic<SignedTransaction>() {

  @Suspendable
  override fun call(): SignedTransaction {
    subFlow(object : SignTransactionFlow(session) {
      override fun checkTransaction(stx: SignedTransaction) { }
    })
    return subFlow(ReceiveFinalityFlow(otherSideSession = session))
  }
}
```

If an initiating flow triggers this responder for a non-signing counterparty, an error occurs:

```java
net.corda.core.flows.UnexpectedFlowEndException: Tried to access ended session SessionId(toLong=3446769309292325575) with empty buffer
    at net.corda.node.services.statemachine.FlowStateMachineImpl.processEventsUntilFlowIsResumed(FlowStateMachineImpl.kt:161) ~[corda-node-4.0.jar:?]
    at net.corda.node.services.statemachine.FlowStateMachineImpl.suspend(FlowStateMachineImpl.kt:407) ~[corda-node-4.0.jar:?]
    at net.corda.node.services.statemachine.FlowSessionImpl.receive(FlowSessionImpl.kt:67) ~[corda-node-4.0.jar:?]
    at net.corda.node.services.statemachine.FlowSessionImpl.receive(FlowSessionImpl.kt:71) ~[corda-node-4.0.jar:?]
    at net.corda.core.flows.SignTransactionFlow.call(CollectSignaturesFlow.kt:294) ~[corda-core-4.0.jar:?]
    at net.corda.core.flows.SignTransactionFlow.call(CollectSignaturesFlow.kt:198) ~[corda-core-4.0.jar:?]
    at net.corda.node.services.statemachine.FlowStateMachineImpl.subFlow(FlowStateMachineImpl.kt:290) ~[corda-node-4.0.jar:?]
    at net.corda.core.flows.FlowLogic.subFlow(FlowLogic.kt:314) ~[corda-core-4.0.jar:?]
    at dev.lankydan.tutorial.flows.SendMessageResponder.call(SendMessageFlow.kt:70) ~[main/:?]
    at dev.lankydan.tutorial.flows.SendMessageResponder.call(SendMessageFlow.kt:64) ~[main/:?]
```

This is because the non-signer is never sent the transaction to sign, but, alas, their code is sitting there waiting to sign a transaction that never comes. How sad 😿. I'm here to stop the counterparties of your flows from being sad like this one here.

This is also a good teaching moment. If you ever see a stack trace like the one above, it is most likely due to misplaced `send`s and `receive`s. Either they are in the wrong order or there is a missing `send` or `receive`. Run through your code line by line and you should hopefully be able to pinpoint where the mismatch is.

## Differentiating by flag

This solution is the one that came to me first as it is the easier one to understand. 

A counterparty is notified telling them whether they need to sign the transaction or not. Their responder flow will then execute `SignTransactionFlow` or skip over it and go straight to `ReceiveFinalityFlow`. Both paths will always receive the flag and call `ReceiveFinalityFlow`.

An example can be found below:

```kotlin
@InitiatingFlow
class SendMessageFlow(private val message: MessageState) :
  FlowLogic<SignedTransaction>() {

  @Suspendable
  override fun call(): SignedTransaction {
    val spy = serviceHub.identityService.partiesFromName("Spy", false).first()

    val tx = verifyAndSign(transaction(spy))

    // initiate sessions with each party
    val signingSession = initiateFlow(message.recipient)
    val spySession = initiateFlow(spy)

    // send signing flags to counterparties
    signingSession.send(true)
    spySession.send(false)

    val stx = collectSignature(tx, listOf(signingSession))

    // tell everyone to save the transaction
    return subFlow(FinalityFlow(stx, listOf(signingSession, spySession))
  }

  private fun transaction(spy: Party) =
    TransactionBuilder(notary()).apply {
      // the spy is added to the messages participants
      val spiedOnMessage = message.copy(participants = message.participants + spy)
      addOutputState(spiedOnMessage, MessageContract.CONTRACT_ID)
      addCommand(Command(Send(), listOf(message.recipient, message.sender).map(Party::owningKey)))
    }
}

@InitiatedBy(SendMessageFlow::class)
class SendMessageResponder(private val session: FlowSession) : FlowLogic<SignedTransaction>() {

  @Suspendable
  override fun call(): SignedTransaction {
    // receive the flag
    val needsToSignTransaction = session.receive<Boolean>().unwrap { it }
    // only sign if instructed to do so
    if (needsToSignTransaction) {
      subFlow(object : SignTransactionFlow(session) {
        override fun checkTransaction(stx: SignedTransaction) { }
      })
    }
    // always save the transaction
    return subFlow(ReceiveFinalityFlow(otherSideSession = session))
  }
}
```

Important points to the code above:

- The `spy` (another party) is added to the state's `participants` list
- Flags are sent to the participants telling them whether to sign or not
- The responder flow `receive`s the flag and skips `SignTransactionFlow` if told to
- `ReceiveFinalityFlow` is invoked waiting for the initiator to call `FinalityFlow`

I'll leave the explanation at that as there is not much else to say.

## Separating logic by extra initiating flows

This solution is a bit more involved due to the indirection caused by the different flows intermingling with each other. This solution really needs to be read before any explaining can be done:

```kotlin
@InitiatingFlow
@StartableByRPC
class SendMessageWithExtraInitiatingFlowFlow(private val message: MessageState) :
  FlowLogic<SignedTransaction>() {

  @Suspendable
  override fun call(): SignedTransaction {
    logger.info("Started sending message ${message.contents}")

    val spy = serviceHub.identityService.partiesFromName("Spy", false).first()

    val tx = verifyAndSign(transaction(spy))

    // collect signatures from the signer in a new session
    val stx = subFlow(CollectSignaturesInitiatingFlow(tx, listOf(message.recipient)))

    // initiate new sessions for all parties
    val sessions = listOf(message.recipient, spy).map { initiateFlow(it) }

    // tell everyone to save the transaction
    return subFlow(FinalityFlow(stx, sessions))
  }

  private fun transaction(spy: Party) =
    TransactionBuilder(notary()).apply {
      // the spy is added to the messages participants
      val spiedOnMessage = message.copy(participants = message.participants + spy)
      addOutputState(spiedOnMessage, MessageContract.CONTRACT_ID)
      addCommand(Command(Send(), listOf(message.recipient, message.sender).map(Party::owningKey)))
    }
}

@InitiatedBy(SendMessageWithExtraInitiatingFlowFlow::class)
class SendMessageWithExtraInitiatingFlowResponder(private val session: FlowSession) : FlowLogic<SignedTransaction>() {

  @Suspendable
  override fun call(): SignedTransaction {
    // save the transaction and nothing else
    return subFlow(ReceiveFinalityFlow(otherSideSession = session))
  }
}

@InitiatingFlow
class CollectSignaturesInitiatingFlow(
  private val transaction: SignedTransaction,
  private val signers: List<Party>
) : FlowLogic<SignedTransaction>() {

  @Suspendable
  override fun call(): SignedTransaction {
    // create new sessions to signers and trigger the signing responder flow
    val sessions = signers.map { initiateFlow(it) }
    return subFlow(CollectSignaturesFlow(transaction, sessions))
  }
}

@InitiatedBy(CollectSignaturesInitiatingFlow::class)
class CollectSignaturesResponder(private val session: FlowSession) : FlowLogic<SignedTransaction>() {

  @Suspendable
  override fun call(): SignedTransaction {
    // sign the transaction and nothing else
    return subFlow(object : SignTransactionFlow(session) {
      override fun checkTransaction(stx: SignedTransaction) { }
    })
  }
}
```

The flow of the code above is as follows:

- The `spy` (another party) is added to the state's `participants` list
- The signer's signature is collected by calling `CollectSignaturesInitiatingFlow`
- `CollectSignaturesInitiatingFlow` creates a new session and calls `CollectSignaturesFlow`
- `CollectSignaturesResponder` signs the transaction sent by `CollectSignaturesInitiatingFlow`
- More sessions are initiated for each participant
- `FinalityFlow` is called which triggers the `SendMessageWithExtraInitiatingFlowResponder` linked to the original/top-level flow

The code above, is built upon the fact that any flow annotated with `@InitiatingFlow` will be routed to its `@InitiatedBy` partner and is done so in a __new session__. Leveraging this allows a responder flow to be added that is only triggered for required signers. Sessions are still created for the top level flow (`SendMessageWithExtraInitiatingFlowFlow`) and are used in `FinalityFlow`.

There are a few other things that happen under the covers, but they are not needed for the context of this post.

## Which is better?

Hard to say at the moment. I would have to do a little performance testing and play around with the code some more...

My current opinion is the __extra initiating flows__ works a bit better. It removes the need for an extra trip across the network from the initiator to each individual counterparty. It adds a bit of additional boilerplate code but also extracts the signing logic out from the rest of the responder/counterparty code.

To be honest, as I said a minute ago, I really need to use it and come up with more complex use cases before I can give a good answer. I doubt I'll ever get round to that though...😩

## Conclusion

Whichever route you go down or even if you manage to come up with another one, saving transactions where only a subset of parties are signers can 100% be done in Corda. I would be pretty disappointed if this were not possible. As long as you have a process in place to alter the logic in the responder flows to handle the different `send`s and `receive`s that signing and non-signing parties need. You should be good to go.

If you enjoyed this post or found it helpful (or both) then please feel free to follow me on Twitter at [@LankyDanDev](https://twitter.com/LankyDanDev) and remember to share with anyone else who might find this useful!