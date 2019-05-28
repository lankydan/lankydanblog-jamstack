---
title: Broadcasting a transaction to external organisations
date: "2019-05-28"
published: true
tags: [corda, kotlin, distributed ledger technology, dlt, blockchain]
cover_image: ./java-city.jpeg
---

Corda does not globally broadcast transactions between organisations/nodes by default. Privacy by default is a central component of Corda's design. Compared to other DLT (Distributed Ledger Technology) platforms and blockchains, this is indeed a big difference. But, this statement comes with one fallacy. There is a belief that Corda cannot broadcast transactions to nodes that are not directly involved in a transaction. That is simply wrong. In this post I will demonstrate the small amount of code required to send a transaction to any desired node.

That being said, the code included in this post is for a trivial implementation. Moving forward, I aim to write further posts on this subject and move towards more complex and useful implementations for broadcasting transactions.

Before I show you any code. We should have a quick think about the need for broadcasting transactions to parties not originally involved in a transaction. The most common reason I have come across is the need to meet regulatory requirements. For certain workflows there is a need for information to be shared with a thirdparty. These parties can then validate that nothing dodgy is going on and might also be a link to the _real_ world. I am not going to lie, this isn't exactly my area of expertise. Luckily, if you are reading this because you had concern about meeting regulatory requirements, then you probably know better than me for why you need the ability to broadcast transactions.

There is also information in the [docs](https://docs.corda.net/tutorial-observer-nodes.html) around this subject.

Onto the code. Below is a flow that sends a `SignedTransaction` to any `Party` passed to it:

```kotlin
@InitiatingFlow
class BroadcastTransactionFlow(
  private val stx: SignedTransaction,
  private val recipients: List<Party>
) : FlowLogic<Unit>() {

  @Suspendable
  override fun call() {
    for (recipient in recipients) {
      val session = initiateFlow(recipient)
      subFlow(SendTransactionFlow(session, stx))
    }
  }
}
```

Corda does pretty much all of the heavy lifting for this situation from inside the platform. Therefore, the only thing you need to do is loop through the passed in parties and send the transaction to them.

Each call to `SendTransactionFlow` will communicate with the responder flow found below:

```kotlin
@InitiatedBy(BroadcastTransactionFlow::class)
class BroadcastTransactionResponder(private val session: FlowSession) : FlowLogic<Unit>() {

  @Suspendable
  override fun call() {
    subFlow(ReceiveTransactionFlow(session, statesToRecord = StatesToRecord.ALL_VISIBLE))
  }
}
```

There is only a single line inside of `call`. So, due to nothing else being there, it must be important. `ReceiveTransactionFlow` is the counterpart of `SendTransactionFlow` who receives and persists the transaction sent to it. Furthermore, the `statesToRecord` property determines what states from the transaction should be stored in the vault. Since this is a broadcast (possibly for regulatory reasons) the contents of the transaction are going to be important. `StatesToRecord.ALL_VISIBLE` will allow you to achieve this. If, depending on your use-case, you did not require all of the transaction's states, then you can use `ALL_VISIBLE` or even `NONE`.

The last important line of code in these snippets is the `@InitiatingFlow` that `BroadcastTransactionFlow` is annotated with. This allows the flow to work without the need to create sessions and pass them into the flow. Logically this makes sense, since most of the time you will not have initiated sessions with parties that don't already have the the transaction stored. Thanks to this, using this flow from inside another is nice and simple. For example, it could be added at the end of a flow:

```kotlin
subFlow(FinalityFlow(stx, sessions)).also {
  // sends to everyone in the network
  val broadcastToParties = 
    serviceHub.networkMapCache.allNodes.map { node -> node.legalIdentities.first() } - message.recipient - message.sender
  subFlow(BroadcastTransactionFlow(it, broadcastToParties))
}
```

At this point, after calling `BroadcastTransactionFlow`, the transaction will exist in each parties' vaults that were specified by the flow. This includes the states contained within the transaction. Great, job done. You now know that Corda can broadcast transactions.

There is one concern that needs to be addressed before you copy and paste this could into your own applications. The states inside the broadcasted transactions can now be spent by any party who has received them. Therefore, if you do wish to share transactions like this, then you need to put in the required safeguards to prevent organisations from spending states that don't really belong to them. That organisation might be a regulator and the chances of them doing anything dodgy is low. Any issues could also be settled outside of Corda. But, neither of those solutions are ideal. To circumvent this, contracts and flows must be designed to prevent organisations spending states that are not theirs. I will cover this in a future post.

To wrap up, it is a myth that Corda cannot broadcast transactions to parties not originally involved in the process. You can achieve this in your own application by using the code that I have presented in this post. It is not the fastest implementation. But it works. Allowing data to be shared to organisations that might require details of transactions occurring on the network that are not otherwise included in individual transactions themselves.