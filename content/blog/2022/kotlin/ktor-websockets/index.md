---
title: Ktor WebSockets
date: "2022-08-01"
published: true
tags: [kotlin, ktor, websockets, ktor websockets]
github_url: https://github.com/lankydan/ktor-with-kodein-di
cover_image: blog-card.png
---

Ktor provides a WebSocket plugin to allow your applications to push real-time data between backend servers and clients over HTTP.

> The code in this post was tested against `Ktor 2.0.3`.

## Including WebSockets

To include WebSockets in your Ktor server:

- Include the `ktor-server-websockets` dependency:

  ```groovy
  implementation "io.ktor:ktor-server-websockets:$ktor_version"
  ```

- Install the WebSockets plugin:

  ```kotlin
  fun Application.module() {
    install(WebSockets)
  }
  ```

- Add a `webSocket` route:

  ```kotlin
  fun Application.module() {
    install(WebSockets)
    routing { people(personRepository) }
  }

  fun Routing.people(personRepository: PersonRepository) {
    webSocket {
      personRepository.updates.collect { (id, person) ->
        when (person) {
          null -> outgoing.send(Frame.Text("Deleted person [$id]"))
          else -> outgoing.send(Frame.Text("Saved person [$id] $person"))
        }
      }
    }
  }
  ```

  Each new WebSocket connection invokes the `webSocket` handler.

  The `outgoing` property allows you to send data (as `Frame`s) to the consuming client.

Those steps will cover the bare minimum needed to leverage WebSockets in your Ktor server; however, it doesn't really tell you how to use Ktor's implementation, which I'll go through next.

## Writing a WebSocket handler

As you saw above, writing a WebSocket handler requires calling the `webSocket` extension function inside a `Route` (which `Routing` is).

The previous example did not include its own path, if you want to include one, then you can write:

```kotlin
webSocket("/updates") {
  ...
}
```

`webSocket`'s signature is:

```kotlin
public fun Route.webSocket(
  protocol: String? = null, 
  handler: suspend DefaultWebSocketServerSession.() -> Unit
)
```

A few things to point out:

- `protocol` is the path that I mentioned before (I find the naming odd myself).
- The `handler` that is executed when a WebSocket connection is initiated gives you a `DefaultWebSocketServerSession` to handle the back and forth between the client and server.
- `handler` is a suspendable function, so you can use coroutines or `Flow`s within it.

### Outgoing data

To send data from the WebSocket connection to the initiating client, you should call `send` on `DefaultWebSocketServerSession`'s `outgoing` property.

```kotlin
webSocket {
    personRepository.updates.collect { (id, person) ->
    when (person) {
      null -> outgoing.send(Frame.Text("Deleted person [$id]"))
      else -> outgoing.send(Frame.Text("Saved person [$id] $person"))
    }
  }
}
```

Sending and receiving data via WebSockets in Ktor is done via `Frame`s. In this example, text data is being transfered over the WebSocket using `Frame.Text`. The other `Frame` types are: `Binary`, `Close`, `Ping` and `Pong`. 

Although it is not obvious from the code, `personRepository.updates` is returning a hot `Flow` that does not complete, meaning that this socket will remain open until terminated by the client, due to the call to `collect`.

### Incoming data

To receive data from the client's side of the WebSocket, you should interact with `DefaultWebSocketServerSession.incoming`.

There are a few ways you can receive data from the `incoming` property:

- Using a `for` loop:

  ```kotlin
  webSocket {
    for (frame in incoming) {

      (frame as? Frame.Text)?.let { text ->

        filter = when (text.readText()) {
          "saves" -> PeopleFilter.SAVES
          "deletes" -> PeopleFilter.DELETES
          else -> PeopleFilter.ALL
        }
      }
    }
  }
  ```

  `incoming` is a `ReceiveChannel` and therefore provides an `operator fun` for an `Iterator`, which is why you can loop over it directly using a `for` loop. If you wanted to write `Iterator` styled code, then you could call `incoming.receive` directly.

- Creating a `Flow` using `receiveAsFlow`:

  ```kotlin
  webSocket {
    incoming.receiveAsFlow().collect { frame ->

      (frame as? Frame.Text)?.let { text ->

        filter = when(text.readText()) {
          "saves" -> PeopleFilter.SAVES
          "deletes" -> PeopleFilter.DELETES
          else -> PeopleFilter.ALL
        }
      }
    }
  }
  ```

In both versions, `ReceiveChannel.receive` is called under the hood, receiving incoming data over the WebSocket connect if there is any, and suspending the coroutine otherwise. The use of coroutines and suspending functions, means you don't need to worry about blocking your executing threads or managing threads yourself.

Similarly, to sending `outgoing` data, the WebSocket receives `Frame`s. In the examples above, it checks that each `Frame` is a `Text` frame, and then parses its data using `readText`.

### Sending and receiving at the same time

The code below combines the `incoming` and `outgoing` data streams from above to ensure data flows in both directions at the same time:

```kotlin
webSocket {
  var filter = PeopleFilter.ALL

  // Calls [launchIn] to create a [Job] that receives from the [incoming] stream.
  incoming.receiveAsFlow().onEach { frame ->
    (frame as? Frame.Text)?.let { text ->
      filter = when(text.readText()) {
        "saves" -> PeopleFilter.SAVES
        "deletes" -> PeopleFilter.DELETES
        else -> PeopleFilter.ALL
      }
    }
  }.launchIn(this)

  // Collect is a terminal operation.
  personRepository.updates.collect { (id, person) ->
    when (person) {
      null -> {
        if (filter == PeopleFilter.ALL || filter == PeopleFilter.DELETES) {
          outgoing.send(Frame.Text("Deleted person [$id]"))
        }
      }
      else -> {
        if (filter == PeopleFilter.ALL || filter == PeopleFilter.SAVES) {
          outgoing.send(Frame.Text("Saved person [$id] $person"))
        }
      }
    }
  }
}
```

The important difference compared to the idependent examples from before, is the fact that the `incoming` stream launches a `Job` which allows the current thread to carry on. Without this the `outgoing` code would never be reached.

> You can wrap the `for` loop version of the `incoming` stream from before in a `launch` block to achieve the same behaviour.

It is important to state, that _something_ must block the `webSocket` handler from completing. If you fail to do this, your WebSocket will initiate correctly but will terminate instantly as your code completes. You can successfully keep your WebSocket open by calling `collect` (a terminal `Flow` operation) or using `for` loop.

In the example, `collect` streams updates to the client, while the `incoming` stream is handled by a coroutine threadpool.

The blocking terminal call could be switched around and the code would still work:

```kotlin
webSocket {
  var filter = PeopleFilter.ALL

  // The outgoing stream now launches a job.
  personRepository.updates.onEach { (id, person) ->
    when (person) {
      null -> {
        if (filter == PeopleFilter.ALL || filter == PeopleFilter.DELETES) {
          outgoing.send(Frame.Text("Deleted person [$id]"))
        }
      }
      else -> {
        if (filter == PeopleFilter.ALL || filter == PeopleFilter.SAVES) {
          outgoing.send(Frame.Text("Saved person [$id] $person"))
        }
      }
    }
  }.launchIn(this)
  
  // The incoming stream now calls [collect].
  // This terminal operation blocks [webSocket] from completing.
  incoming.receiveAsFlow().collect { frame ->
    (frame as? Frame.Text)?.let { text ->
      filter = when(text.readText()) {
        "saves" -> PeopleFilter.SAVES
        "deletes" -> PeopleFilter.DELETES
        else -> PeopleFilter.ALL
      }
    }
  }
}
```

## Terminating a WebSocket

From my understanding there isn't a convenient way of cleanly terminating a WebSocket in Ktor.

When I say cleanly, I mean that the following occurs:

- A `close` frame is sent to the client.
- The `webSocket` handler stops executing.

In simpler code where `for` loops or `Iterator`s are used, `return`ing from the `webSocket` handler suffices:


```kotlin
webSocket {
  for (frame in incoming) {
    (frame as? Frame.Text)?.let { text ->
      filter = when (text.readText()) {
        "saves" -> PeopleFilter.SAVES
        "deletes" -> PeopleFilter.DELETES
        "stop" -> return@webSocket // Terminates the WebSocket.
        else -> PeopleFilter.ALL
      }
    }
  }
}
```

The `webSocket` is terminated by completing it; however, calling `return` can be tricky depending on the code as you cannot return from a lambda/function. Placing this code into a `launch` block, would prevent the `return@webSocket` from compiling and a different solution would be needed.

In this case, you should call `WebSocketSession.close` to terminate the socket:

```kotlin
launch {
  for (frame in incoming) {
    (frame as? Frame.Text)?.let { text ->
      filter = when (text.readText()) {
        "saves" -> PeopleFilter.SAVES
        "deletes" -> PeopleFilter.DELETES
        "stop" -> {
          close() // Sends a [Frame.Close] to the client.
          return@let // Returning here lets the code compile.
        }
        else -> PeopleFilter.ALL
      }
    }
  }
}
```

`close` sends a `Frame.Close` over the connection causing it to terminate.

Annoyingly though, when combining this solution with the `outgoing` code shown throughout this post, even after closing the WebSocket, the `Flow` sending the outgoing updates still executes on the next update. It only does so once, so its not the end of the world, but it is a bit annoying.

To prevent that _extra_ update from being processed, then you can use the following code:

```kotlin
webSocket {
  // Launch a new [Job] and store it so it can be cancelled later.
  val incomingJob: Job = incoming.receiveAsFlow().onEach { frame ->
      (frame as? Frame.Text)?.let { text ->
        filter = when (text.readText()) {
          "saves" -> PeopleFilter.SAVES
          "deletes" -> PeopleFilter.DELETES
          "stop" -> {
            close() // Sends a [Frame.Close] to the client.
            return@let // Returning here lets the code compile.
          }
          else -> PeopleFilter.ALL
        }
      }
    }.launchIn(this)

  // Launch a new [Job] and store it so it can be cancelled later.
  val outgoingJob: Job = personRepository.updates.onEach { (id, person) ->
    when (person) {
      null -> {
        if (filter == PeopleFilter.ALL || filter == PeopleFilter.DELETES) {
          outgoing.send(Frame.Text("Deleted person [$id]"))
        }
      }
      else -> {
        if (filter == PeopleFilter.ALL || filter == PeopleFilter.SAVES) {
          outgoing.send(Frame.Text("Saved person [$id] $person"))
        }
      }
    }
  }.launchIn(this)

  // Wait for the socket to close.
  val reason = closeReason.await()

  // Cancel the incoming and outgoing jobs.
  incomingJob.cancel()
  outgoingJob.cancel()
  joinAll(incomingJob, outgoingJob)
}
```

The `incoming` and `outgoing` channels are processed as `Flow`s and launched so that the processing thread can continue.

As the processing thread is not blocked, `closeReason.await` is reached (close reason is a property of `DefaultWebSocketSession`). As the naming suggests, this blocks the `webSocket` coroutine thread until the `incoming` channel is closed.

After this point, the `Job`s created for processing the `incoming` and `outgoing` channels are cancelled, preventing any futher processing of their `Flow` callbacks and resolving the issue I highlighted in the previous solution.

As you can see, this solution has way more code; therefore, in my opinion, you should stick to calling `close` and accept that a few side-effects may occur.
