---
title: Responder flow validation reloaded (part 2)
date: "2019-12-02"
published: true
tags: [corda, kotlin, dlt, distributed ledger technology, blockchain]
cover_image: ./title-card.png
---

In [Responder flow validation](www.lankydan.dev/responder-flow-validation) I closed the post with the following:

> How can I enforce the rules of __my business__ when the logic inside a CorDapp is __shared__?
>
> I will answer that question in my next post...
>
> You can wait until then.

I'm not one to leave you hanging for too long. So, here I am to stay true to my word and show you how to enforce your own validation onto a shared CorDapp.

Now, before I continue, I have a little disclaimer. What I will cover in this post requires cooperation from the developers of the CorDapp that you wish to add your own rules to. Why? They are in control of what the CorDapp does. If they do not follow the required steps then extending their CorDapp becomes much more difficult. It is still possible but the chance of errors goes through the roof.

Obviously, this problem goes away if you are the one developing the CorDapp.

For the purpose of this post, I am going to assume that _you_ are the CorDapp develop. I will show you how to write an extensible CorDapp that an external developer could leverage while adding a sprinkle of their own code. More specifically, allowing them to add extra verification to the responder flows that you wrote.

<!-- <div style="background-color:#f7f7f7;">
  <a href="https://lankydan.dev/2019/03/02/extending-and-overriding-flows-from-external-cordapps">
    ![Non sharded network diagram](../2019/corda-extendable-flows/corda-tree.png)
    Extending and Overriding Flows from external CorDapps
  </a>
</div> -->

// USE A CARD FOR LINK TO OLD POST (might look cool)

I will be skimming through some of the content in this post. For extra background information, I wrote [Extending and Overriding Flows from external CorDapps](https://lankydan.dev/2019/03/02/extending-and-overriding-flows-from-external-cordapps) earlier on this year. That post dives deeper down in regards to implementation compared to this post. Here we will only focus on custom validation.

## Why extendable flows make sense for including validation

In Corda, organisations interact with each other through the use of shared code. Meaning that each and every organisation executes the exact same code. The false assumption that this model makes, is that the processes all these different businesses are identical. Large majorities might be the same (there is a lot of duplication in this world), but the chance of them being exact copies is extremely small. To be honest, I would go as far as saying it's impossible. Somewhere in the process there will be a difference.

CorDapps need to be able to reflect this. Corda does its best to amalgamate processes amongst organisations. But, there is an appreciation that local customisation is needed before companies can truly make the switch to distributed applications.

A vital example for the need of customisation is applying business rules to a shared application. The contracts and flows provided in CorDapps will provide a base level of validation. However, unique business rules still need to be applied before each individual organisation's requirements are met.

Designing an extendable flow is the most effective way to satisfy the desire for custom validation.

## What a CorDapp developer must do

There are only a hand full of required steps to create an extensible flow:

- The flow must be `open` (Kotlin) or not `final` (Java)
- Provide a function(s) that can be overridden
- The overridable function(s) must be called in relevant places

The following responder flow does incorporates all the points above:

```kotlin
@InitiatedBy(SendMessageFlow::class)
// The flow is open
open class SendMessageResponder(private val session: FlowSession) : FlowLogic<SignedTransaction>() {

  // An overridable function to contain validation is provided
  open fun checkTransaction(stx: SignedTransaction) {
    // To be implemented by sub type flows - otherwise do nothing
  }

  @Suspendable
  // [call] is final to prevent it from being overridden
  final override fun call(): SignedTransaction {
    val stx = subFlow(object : SignTransactionFlow(session) {
      override fun checkTransaction(stx: SignedTransaction) {
        // The validation function is called
        this@SendMessageResponder.checkTransaction(stx)
        // Any other rules the CorDapp developer wants executed
      }
    })
    return subFlow(ReceiveFinalityFlow(otherSideSession = session, expectedTxId = stx.id))
  }
}
```

I want to expand on the final step I mentioned above:

> The overridable function(s) must be called in relevant places

I believe that inside of `SignTransactionFlow.checkTransaction` is the best place to place the overridable function. `checkTransaction` is triggered before signing a transaction and therefore it makes sense to add extra rules here. You could place it somewhere else but the code becomes less efficient and harder to follow. I also discussed adding validation to `checkTransaction` in [Responder flow validation](www.lankydan.dev/responder-flow-validation).

An external developer now has two ways to use this flow:

- Directly call the flow as you would with any normal flow. This means `checkTransaction` will execute without any code inside of it.
- Leverage the flow by extending it and including their own custom verification.

Before we move on, I want to focus on a comment I included in the code:

```kotlin
// [call] is final to prevent it from being overridden
final override fun call(): SignedTransaction {
```

This _might_ not be important. But, I personally think it is. By preventing external applications from altering the flow too much, you reduce the chance of the flow malfunctioning. For example, one unbalanced `send` or `receive` will break the flow. Making `call` final does not actually prevent this problem. However, by providing clear functions to implement, developers are less likely to make mistakes.

## What an external developer must do

To extend and leverage an extensible flow you must do the following:

- Extend the flow
- Implement/override provided functions

In other words, exactly what you would do to extend any normal class in Kotlin or Java.

Below is what this could look like:

```kotlin
@InitiatedBy(SendMessageFlow::class)
class ValidatingSendMessageResponder(session: FlowSession) : SendMessageResponder(session) {

  override fun checkTransaction(stx: SignedTransaction) {
    val message = stx.coreTransaction.outputStates.single() as MessageState
    check(message.recipient == ourIdentity) { "I think you got the wrong person" }
    check(!message.contents.containsSwearWords()) { "Mind your language" }
    check(!message.contents.containsMemes()) { "Only serious messages are accepted" }
    check(message.sender.name.organisation != "Nigerian Prince") { "Spam message detected" }
  }
}
```

`SendMessageResponder` has been extended and `checkTransaction` has been implemented to include custom verification.

That's really all there is. If the CorDapp developer has done the work on their flow to make extendable. Then external developers that leverage the flow should normally have a straight forward task when it comes to implementing their code.