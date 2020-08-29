---
title: Broadcasting a transaction to external organisations
date: "2019-05-31"
published: true
tags: [corda, kotlin, dlt, distributed ledger technology, blockchain]
github_url: https://github.com/lankydan/corda-broadcast-transaction
cover_image: blog-card.png
---

There is a misconception that Corda cannot _broadcast_ data across a network. This is simply wrong. In fact, Corda can send anything between nodes in a network. What Corda does not do, is share unnecessary data (transactions) with nodes that have nothing to do with an individual interaction. Privacy by default is a central component of Corda's design. Compared to other DLT (Distributed Ledger Technology) platforms and blockchains, this is indeed a big difference. Sharing data with non-transacting parties might not be part of Corda's default behaviour, but it is definitely within its capabilities. In this post, I will demonstrate the small amount of code required to send a transaction to any desired node.

That being said, the code included in this post is for a trivial implementation. Moving forward, I aim to write further posts on this subject and move towards more sophisticated and useful implementations for broadcasting transactions.

Before I show you any code, we should have a quick talk about the need for broadcasting data to parties not originally involved in a transaction. The most common reason I have come across is the need to meet regulatory requirements. For certain workflows information has to be shared with third-parties. These parties can then validate that nothing dodgy is going on and might also be a link to the _real_ world. I am not going to lie. This isn't exactly my area of expertise. Luckily, if you are reading this because you have concerns about meeting regulatory requirements, then you probably know better than me as to why you need the ability to broadcast transactions.

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

For this scenario, Corda does pretty much all of the heavy lifting from inside the platform. Therefore, the only thing you need to do is iterate through the passed in parties and send the transaction to each of them.

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

There is only a single line inside of `call`. So, due to nothing else being there, it must be important. `ReceiveTransactionFlow` is the counterpart of `SendTransactionFlow` who receives and persists the transaction sent to it. Furthermore, the `statesToRecord` property determines which states from the transaction should be stored in the vault. Since this is a broadcast (possibly for regulatory reasons) the contents of the transaction are going to be important. To achieve this, `StatesToRecord.ALL_VISIBLE` is used telling `ReceiveTransactionFlow` to record every state contained within the transaction. If, depending on your use-case, you do not require all of the transaction's states, then you can use `ONLY_RELEVANT` or even `NONE`.

The last important line of code in these snippets is the `@InitiatingFlow` annotation on `BroadcastTransactionFlow`. The annotation allows the flow to work without requiring its caller to create sessions and before passing them into the flow. The flow handles that. Logically this makes sense since most of the time, you will not have initiated sessions with parties that don't already have the transaction stored. Thanks to this, using this flow from inside another is nice and simple. For example, it could be added at the end of a flow:

```kotlin
subFlow(FinalityFlow(stx, sessions)).also {
  // sends to everyone in the network
  val broadcastToParties = serviceHub.networkMapCache.allNodes.map { node -> node.legalIdentities.first() }
    .minus(serviceHub.networkMapCache.notaryIdentities)
    .minus(message.recipient)
    .minus(message.sender)
  subFlow(BroadcastTransactionFlow(it, broadcastToParties))
}
```

At this point, after calling `BroadcastTransactionFlow`, the transaction will exist in the vault of each party passed to the flow. This includes the states contained within the transaction. Great, job done. You now know that Corda can broadcast transactions.

There is one concern that I need to address before you copy and paste this code and ship it straight to production. Parties who receive output states from broadcasted transactions also have the ability to consume them. Therefore, if you wish to share transactions like this, then you need to put in the required safeguards to prevent organisations from spending states that don't really belong to them. Yes, that organisation might be a regulator, and the chances of them doing anything dodgy is low. Yes, it might be possible to settle these issues outside of Corda. However, neither of these assumptions are ideal. To circumvent this, your contracts and flows must be designed to prevent organisations from spending states that are not theirs. __This responsibility falls onto you__, the CorDapp developer. Not Corda. The flexibility Corda empowers you with must be controlled to prevent undesired outcomes. I will cover this topic in a future post.

To wrap up, it is a myth that Corda cannot broadcast transactions to parties not originally involved in the process. You can achieve this in your application by using the code that I have presented in this post. It is not the fastest implementation. But it works. Allowing data to be shared with organisations who require details of transactions occurring on the network who are not otherwise included in individual transactions themselves.

If you enjoyed this post or found it helpful (or both) then please feel free to follow me on Twitter at [@LankyDanDev](https://twitter.com/LankyDanDev) and remember to share with anyone else who might find this useful!