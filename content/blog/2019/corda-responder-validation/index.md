---
title: Responder flow validation
date: "2019-11-25"
published: true
tags: [corda, kotlin, dlt, distributed ledger technology, blockchain]
cover_image: ./title-card.png
series: Responder flow validation
---

Do you want to prevent your node from accepting transactions that are not important to your business?

Do you want to prevent your node from accepting transactions that are invalid from your business's perspective?

If you answered yes to either of these questions, then you might want to consider adding some validation to your responder flows.

For context, a responder flow is executed by a counterparty node when communicating with an initiating flow. Responder flows typically sign and record transactions sent to them. This means an organisation can end up in a situation where they did not have a large involvement in putting the contents of the transaction together, yet are expected to sign and potentially record it.

Surely, there should be some rules to prevent an organisation from being sent any old rubbish? And, yes, there are. The very bare minimum that needs to pass is contract validation. This ensures that a transaction is logically valid at a general level. What it does not do, is enforce local identity/roles or business level requirements.

To an extent, this is fine. A __contract__ should only be ensuring that a transaction is __logically valid__.

__Flows__ on the other hand, need to take charge of __enforcing business level requirements__ on transactions.

## Including validation

To include your own validation, you need to make use of `SignTransactionFlow.checkTransaction` when calling the `SignTransactionFlow` subflow. I guarantee that you have seen `checkTransaction` before (if you have worked with Corda already). If you have not, then please tell me how.

Assuming you have seen it, I bet there is a good chance that you also left it blank like this:

```kotlin
val stx = subFlow(object : SignTransactionFlow(session) {
  override fun checkTransaction(stx: SignedTransaction) {
    // no validation
  }
})
```

That is a code snippet from one of my other blog posts. Yes... I have sinned, and I am also a hypocrite. I have failed so you can learn from my mistakes! 👩‍🏫

Instead, it should look something like:

```kotlin
@InitiatedBy(SendMessageFlow::class)
class SendMessageResponder(private val session: FlowSession) : FlowLogic<SignedTransaction>() {

  @Suspendable
  override fun call(): SignedTransaction {
    val stx = subFlow(object : SignTransactionFlow(session) {
      // [LedgerTransaction.verify] is called before [checkTransaction]
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

Obviously, most of the things being checked here are pretty random, but it does show off what I have been talking about.

- The `recipient` is checked to ensure that the `MessageState` is intended for the node it is being sent to.

  ```kotlin
  check(message.recipient == ourIdentity) { "I think you got the wrong person" }
  ```

  This is an essential step to ensure that transactions you receive are intended for you and the role you play in the current flow, or in general, within the network. Not doing this, will allow your node to accept anything it is asked to sign and record. Even if it has absolutely nothing to do with you.

- A series of other rules are also included. Each additional criteria is contractually valid but is not a desired property of the state in the context of this flow.

  ```kotlin
  check(!message.contents.containsSwearWords()) { "Mind your language" }
  check(!message.contents.containsMemes()) { "Only serious messages are accepted" }
  check(message.sender.name.organisation != "Nigerian Prince") { "Spam message detected" }
  ```

  I highly doubt that checking whether a message contains swear words would be contained inside of a contract. A message is still generally valid if it includes them. But, for the written flow, maybe it is a polite flow. Where any mention of a rude word must be beeped out (just like on pre-watershed TV). The same general gist applies to the other two rules.

## How to validate

I have just shown you what sort of validation to include. What I didn't do is explain how the code shown before leads to a transaction being rejected. You might have sussed it out, but let me be thorough and go through it properly.

To reject a transaction from within `checkTransaction` you need to throw an exception. Different exceptions will lead to different outcomes. This is due to the code below in `SignTransactionFlow`:

```kotlin
try {
  checkTransaction(stx)
} catch (e: Exception) {
  if (e is IllegalStateException || e is IllegalArgumentException || e is AssertionError)
    throw FlowException(e)
  else
    throw e
}
```

To properly indicate that a transaction is invalid, you should throw one of the following exceptions:

- `IllegalStateException`
- `IllegalArguementException`
- `AssertionError`

These exceptions are converted to `FlowException`s, allowing them to be transferred to the counterparty with all details intact. You can also throw your own subclass of `FlowException` to cause the same effect.

Any other exception will become an `UnexpectedFlowEndException` with all of the reasons for the failure stripped out. From a counterparty's perspective, this is the same as a random internal error that it could receive from its peers. Missing this vital information could have a significant effect on the outcome of the flow. It can be possible to propose a new transaction based on the information contained in the error. Receiving a `UnexpectedFlowEndException` makes it look like something just blew up.

To finally tie up this section, I want to give some suggestions on how to perform validation. This section is primarily focused on Kotlin developers since they provide some useful functions for this area (plus it's what I code in every day).

I tend to use the following (some Kotlin basics coming up):

- `require` - Throws an `IllegalArgumentException`

  ```kotlin
  require(message.recipient == ourIdentity) { "I think you got the wrong person" }
  ```

- `check` - Throws an `IllegalStateException`

  ```kotlin
  check(message.recipient == ourIdentity) { "I think you got the wrong person" }
  ```

Which one you throw depends on the context (and possibly personal preference). I also don't want to explain the difference between an `IllegalArgumentException` and `IllegalStateException` (as I would struggle). I personally prefer to use `check` here, but that's just my opinion.

Both of these also have alternatives for null checking, `requireNotNull` and `checkNotNull`.

Corda also provides a built-in way to do similar validation using the `requireThat` DSL (Domain Specific Language):

```kotlin
requireThat {
  // <message if criteria fails> using <statement that must be true>
  "I think you got the wrong person" using (message.recipient == ourIdentity)
  // Non `using` lines can also be included
  val contents = message.contents
  "Mind your language" using (!contents.containsSwearWords())
  "Only serious messages are accepted" using (!contents.containsMemes())
  "Spam message detected" using (message.sender.name.organisation != "Nigerian Prince")
}
```

`requireThat` was built for use inside contracts but can be used anywhere. As the name suggests, it follows the same semantics as `require`. The difference is that it is a DSL, which makes use of `using` to define a message and criteria. Note, that you can add general code into the `requireThat` block. Only the `using` lines are going to (potentially) throw exceptions.

`requireThat` can also be used from Java (but looks a tad worse):

```java
requireThat(require -> {
    require.using("I think you got the wrong person", message.getRecipient() == getOurIdentity());
    // Non `using` lines can also be included
    String contents = message.getContents()
    require.using("Mind your language", !contents.containsSwearWords());
    require.using("Only serious messages are accepted", !contents.containsMemes());
    require.using("Spam message detected", message.getSender().getName().getOrganisation() != "Nigerian Prince");
    return null;
});
```

It's a bit more of a pain to use compared to Kotlin, but you might prefer to use it instead of other Java validation techniques.

## Suggestions on what to validate

The following ideas are things that I think would be good to include. If I was writing a production-ready CorDapp, I might have some additional suggestions. For now, these are areas I think are important (some of these I touched on earlier):

- __Identity__
  - Is the transaction important to my business? Check that you are actually involved in this transaction in a meaningful way. For some scenarios, an organisation might be observing all transactions. Validation should change to accommodate this.
  - What is my role in this transaction? You should validate that your business is participating in the transaction with the role that you expect. For example, a buyer or seller. Based on this, follow on validation should be included. Identity cannot be checked from within a contract (no access to `ourIdentity`), so it must be done inside of a flow.
- __Existing states__
  - Is this _unique_ field actually unique compared to the states in my vault? It might be unique for the party proposing the transaction, it might not be for any of its peers though. The contents of a node's vault cannot be accessed from within a contract. Therefore all validation that includes a vault query must be done from within a flow.
- __Business logic__
  - Does that state have an acceptable value for my business? You should validate that the states you are receiving meet whatever criteria your business has. Contracts should not enforce business rules. This is why flows should perform business validation.

## Closing thoughts

I wrote this post to ensure that CorDapp developers add thorough validation to their applications. Ensuring that what they intend their CorDapps to do, is what they actually do. If there is even just a single hole in the hull of a ship, it is not a matter of whether it will sink, but when. Your applications should be put together with thorough consideration to reduce the chance (like a ship) that it sinks. Failures will still happen, but the chances of them happening and the repercussions that they cause will be significantly lower if your application is well defined and constrained. The validation inside of flows plays an essential part in fortifying the hull of your CorDapp.

While reading this, if you were particularly eagle-eyed and critical on what I wrote, you might have formulated the following question.

> How can I enforce the rules of __my business__ when the logic inside a CorDapp is __shared__?

I will answer that question in my next post...

You can wait until then.

If you enjoyed this post or found it helpful (or both) then please feel free to follow me on Twitter at [@LankyDanDev](https://twitter.com/LankyDanDev) and remember to share with anyone else who might find this useful!