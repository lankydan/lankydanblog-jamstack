---
title: Flows can do anything
date: "2019-07-29"
published: true
tags: [corda, kotlin, dlt, distributed ledger technology, blockchain]
cover_image: ./title-card.png
---

Flows can do a lot more than proposing new transactions to record between organisations. Although, saying they can do _anything_ is probably a bit far-reaching (it's catchy though). What I really want to say, is that flows are the entry points into a node. Corda provides a series of functions to interact with a node via RPC. These cover the more straightforward use cases, such as querying the vault, but there is a limitation to what is provided. Flows cover any of the _non standard_ logic that needs to be triggered.

## The theory

The easiest way to get this started is by showing you an example:

```kotlin
@StartableByRPC
class StupidSimpleQueryFlow(private val externalId: String) : FlowLogic<MessageState>() {
    // does not need to be suspendable?
    override fun call(): MessageState {
        return serviceHub.vaultService.queryBy<MessageState>(
            QueryCriteria.LinearStateQueryCriteria(
                externalId = listOf(externalId)
            )
        ).states.single().state.data
    }
}
```

If you know your stuff, then you will realise that you can do this via RPC. I chose this example to start you off with something familiar. You have probably done similar queries in your own flows. Although there is a good chance they were part of a more extensive process.

There are a few things to note here that differ compared to most flows you have written:

- No `@InitiatingFlow` annotation
- No `@Suspendable` annotation
- No matching responder flow

Why are they missing? Well, they are not needed. Think about it. Each point is related to communication with another node, which is not happening. The flow starts, does a query and returns the retrieved data. Let me expand on this:

- `@InitiatingFlow` allows a flow to create new sessions to communicate with other nodes. Since no interactions are required, no sessions need to be created, and therefore the annotation can be removed.
- `@Suspendable` is required on functions that suspend. Allowing a flow to create _checkpoints_ that are loaded when the flow needs to wake up again. The most common place for a flow to suspend is during communication with another node. In this scenario, the annotation can be removed since the flow never needs to suspend.
- __Responder flows__ run on counterparty nodes and interact with your flows when you `send` data to them. Again, there is no communication, so there is no need for other nodes to have a flow installed that pairs with the flow above.

Most flows that do not interact with other nodes will follow this sort of structure (some flows can still suspend depending on what you are doing).

## Examples

Below are a few examples of flows that you could write and why you might use them.

### Retrieving a value from a service

```kotlin
@StartableByRPC
class GetMeSomeValueFromAService : FlowLogic<Long>() {
  override fun call(): Long {
    return serviceHub.cordaService(IncrementingService::class.java).counter
  }
}

@CordaService
class IncrementingService(serviceHub: AppServiceHub) : SingletonSerializeAsToken() {

  var counter: Long = 0

  init {
    timer(period = TimeUnit.SECONDS.toMillis(1)) {
      counter += 1
    }
  }
}
```

If you have a service that stores some information that is useful to an external client, you will need a way to retrieve it.

### Calling code inside the node to reduce code duplication

```kotlin
@StartableByRPC
class ExecuteSomeInternalNodeLogicYouDontWantToDuplicateFlow(private val recipient: Party) :
  FlowLogic<List<MessageState>>() {
  override fun call(): List<MessageState> {
    return serviceHub.cordaService(MessageRepository::class.java)
      .findAllMessagesByRecipient(recipient)
  }
}

@CordaService
class MessageRepository(private val serviceHub: AppServiceHub) : SingletonSerializeAsToken() {

  fun findAllMessagesByRecipient(recipient: Party): List<MessageState> {
    return serviceHub.vaultService.queryBy<MessageState>(
      QueryCriteria.VaultCustomQueryCriteria(
        builder { MessageSchema.PersistentMessage::recipient.equal(recipient.name.toString()) }
      )
    ).states.map { it.state.data }
  }
}
```

Useful pieces of reusable code can be extracted into separate classes. More specifically to Corda, you could place logic within a flow or service.

To execute code inside a flow or service from the client:

- __Inside a flow__ - Just call the flow from the client
- __Inside a service__ - Add a new flow that delegates to the service

You could implement the query above in the client, but you will have two versions if you also use the same query inside the node.

### Executing logic that can't be done via RPC

```kotlin
@StartableByRPC
class DoSomethingComplicatedThatYouCantDoViaRpc(private val recipient: Party) :
    FlowLogic<List<MessageSchema.PersistentMessage>>() {
    override fun call(): List<MessageSchema.PersistentMessage> {
        return serviceHub.withEntityManager {
            createQuery(
                "SELECT m FROM $TABLE_NAME m WHERE m.recipient = ?1",
                MessageSchema.PersistentMessage::class.java
            ).setParameter(
                1,
                recipient.name.toString()
            ).resultList
        }
    }

    private companion object {
        val TABLE_NAME = MessageSchema.PersistentMessage::class.jvmName
    }
}
```

As mentioned earlier, there is a limit to what you can do via RPC. The code above is an example of this. It accesses the `EntityManager` which can execute lower level queries than what the vault allows.

## Conclusion

Short conclusion for this post. Flows are the only entry points into a node that can run fully custom logic. Corda provides several APIs to interact with a node, but these provide limited functionality. To execute any sort of logic (that a node can run), you need to have a flow that is allowed to walk into the node and press the button for you.

If you enjoyed this post or found it helpful (or both) then please feel free to follow me on Twitter at [@LankyDanDev](https://twitter.com/LankyDanDev) and remember to share with anyone else who might find this useful!
