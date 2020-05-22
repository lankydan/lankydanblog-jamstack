---
title: Corda Services 101
date: "2018-08-19"
published: true
tags: [corda, kotlin, dlt, blockchain, distributed ledger technology]
include_date_in_url: true
github_url: https://github.com/lankydan/corda-services
---

I'm in the mood to write a short and to the point post today. I'm actually curious how quickly I can get this published. So let's go.

This post is about Corda Services (using Corda version `3.2`). What are they? As a developer that uses Spring a lot, I would personally say they are like Beans. There is more than Spring Beans can do, but on a basic level, they are pretty similar. Anyway, let's stop talking about Spring and focus on Corda.

## The bare minimum you need to know

Corda Services are classes external to Flows, that currently, can only be called from within an executing Flow or from another service (which is in turn, called by a Flow). Similar to a `subFlow`, they allow you to reuse code but should be used for different reasons. Such as, a collection of vault query functions or initiating `trackBy` within a node. These are what I tend to use services for anyway.

Corda Services are defined by using the `@CordaService` annotation along with extending `SingletonSerializeAsToken`. Once this is done, when your Cordapp is loaded and the node starts up, the service that you have just defined will be initialised:

```kotlin
@CordaService
class MessageRepository(private val serviceHub: AppServiceHub) : SingletonSerializeAsToken() {

    private companion object {
        val log = loggerFor<MessageRepository>()
    }

    init {
        log.info("I am alive!")
    }

    fun findAll(pageSpec: PageSpecification): Vault.Page<MessageState> =
        serviceHub.vaultService.queryBy(QueryCriteria.LinearStateQueryCriteria(), pageSpec)
}
```

`serviceHub` provides access to everything you need. In this example, the service accesses the `vaultService` to retrieve states from the node's vault.

It is now ready to be used from within your Flows or other services if desired. The snippet below is taken from one of my Flows:

```kotlin
private fun repository() = serviceHub.cordaService(MessageRepository::class.java)
```

`serviceHub` is available in all Flows and provides the `cordaService` function. For input, it requires the class of the service you are trying to retrieve. In this case, the `MessageRepository` is being loaded.

## A tiny bit more information 

That is all you need to start using Corda Services. But. I'll give you a bit more information so you don't make some of the same mistakes I made.

Lesson one. When calling a service from a Flow. Do not inject it inside the constructor of the Flow. Instead, call it from somewhere inside the `call` function or any others used from that point. If you don't you'll see the below error message:

```
java.lang.IllegalStateException: This can only be done after the flow has been started.
```

The above is the error you'll get when calling the Flow from a test. If calling from RPC you'll get something like this:

```
Caused by: java.lang.reflect.InvocationTargetException: null
Caused by: java.lang.IllegalStateException: This can only be done after the flow has been started.
```

Likely with a long stacktrace depending on your chosen web framework.

It isn't entirely clear that injecting the service in at this point causes these errors and you might find they pop up for other reasons. But I think it's safe to say, at least in Corda `3.2`, that you should not do anything inside the constructor or during initialisation of a Flow.

Just to make this even clearer, below is the code that accompanied the earlier snippet where I injected the service:

```kotlin
@InitiatingFlow
@StartableByRPC
class ReplyToMessagesFlow : FlowLogic<List<SignedTransaction>>() {

    @Suspendable
    override fun call(): List<SignedTransaction> {
        return messages().map { reply(it) }
    }

    private fun messages() =
        repository().findAll(PageSpecification(1, 100))
            .states
            .filter { it.state.data.recipient == ourIdentity }

    private fun repository() = serviceHub.cordaService(MessageRepository::class.java)

    @Suspendable
    private fun reply(message: StateAndRef<MessageState>) = subFlow(SendMessageFlow(response(message), message))

    private fun response(message: StateAndRef<MessageState>): MessageState {
        val state = message.state.data
        return state.copy(
            contents = "Thanks for your message: ${state.contents}",
            recipient = state.sender,
            sender = state.recipient
        )
    }
}  
```

As you can see, the service is injected within the `repository` function which is in turned called by `call`. Following this sort of structure everything will work just fine.

Lesson two. Do not forget to include `serviceHub: AppServiceHub` in your service's constructor (you can call `serviceHub` whatever you like). If you don't do this it won't create the service and you'll find the following error pops up when you try to access it:

```
Caused by: java.lang.IllegalArgumentException: Corda service com.lankydanblog.tutorial.services.MessageRepository does not exist
```

Although, there is a ray of hope in this situation... It is very unlikely you would do this. Because without an instance of `AppServiceHub` there isn't really much you can do with your own service. You will not have access to the vault or any of the other inbuilt services. So, at the end of the day, this lesson is a bit pointless but I still fell into this trap...

## Is that all? 

Damn, I think I actually wrote a short post for once! Is that good or bad? I'm not 100% sure...

Anyway, I'm trying really hard to think of some more snippets of information. But I cant. The bare minimum to get a Corda Service working really is nice and easy.

That being said, in the last few weeks, I have learnt that there is some pretty cool and useful stuff that you can do within services that cannot be done within Flows. That is a subject I hope to cover at some point!

## Conclusion

Corda Services allow you to create classes external to Flows where you can logically group code that isn't directly related to the execution of a Flow. My favourite way to use a service is to group vault query functions into a single class (pretty much what I would do in the Spring world). There are a few steps you need to take to ensure you create your service correctly. Firstly, annotate it with `@CordaService` and extend `SingletonSerializeAsToken`. Secondly, make sure that you inject them into your Flows in the correct way, which is pretty much anywhere but the constructor (or `init` in Kotlin). Lastly, remember to include `AppServiceHub` in the service's constructor. Once you are able to use Corda services, you will be able to separate code out of your Flows. Not only making the Flows shorter, but also making them easier to understand while increasing the reusability of the code that you spent your valuable time writing.

The code used for this post can be found on my [GitHub](https://github.com/lankydan/corda-services). There is a lot more in that repository that was not included in this post.

If you found this post helpful, you can follow me on Twitter at [@LankyDanDev](http://www.twitter.com/LankyDanDev) to keep up with my new posts.