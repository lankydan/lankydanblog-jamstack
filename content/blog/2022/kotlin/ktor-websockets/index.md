---
title: Ktor WebSockets
date: "2022-08-19"
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

Those steps will cover the bare minimum needed to leverage WebSockets in your Ktor server; however, it doesn't tell you how to use Ktor's implementation, which I'll go through next.

## Writing a WebSocket handler

As you saw above, writing a WebSocket handler requires calling the `webSocket` extension function inside a `Route` (which `Routing` is).

The previous example did not include its own path; if you want to have one, then you can write:

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

- `protocol` is the path I mentioned before (I find the naming odd myself).
- The `handler` is executed when a WebSocket connection is initiated, giving you a `DefaultWebSocketServerSession` to handle the back and forth between the client and server.
- `handler` is a suspendable function so that you can use coroutines or `Flow`s within it.

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

Sending and receiving data via WebSockets in Ktor is done via `Frame`s. Text data is transferred over the WebSocket using `Frame.Text` in this example. The other `Frame` types are: `Binary`, `Close`, `Ping` and `Pong`. 

Although it is not evident from the code, `personRepository.updates` is returning a hot `Flow` that does not complete, meaning that this socket will remain open until the client's termination due to the call to `collect`.

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

  `incoming` is a `ReceiveChannel` and therefore provides an `operator fun` for an `Iterator`, which is why you can loop over it directly using a `for` loop. If you wanted to write `Iterator` styled code, you could call `incoming.receive` directly.

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

In both versions, `ReceiveChannel.receive` is called under the hood, receiving incoming data over the WebSocket connection if there is any and suspending the coroutine otherwise. The use of coroutines and suspending functions means you don't need to worry about blocking your executing threads or managing threads yourself.

Similarly, to sending `outgoing` data, the WebSocket receives `Frame`s. The examples above check that each `Frame` is a `Text` frame, then parses its data using `readText`.

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

The crucial difference compared to the independent examples from before is that the `incoming` stream launches a `Job` which allows the current thread to carry on. Without this, the thread would never reach the `outgoing` code.

> To achieve the same behaviour, you can wrap the `for` loop version of the `incoming` stream from before in a `launch` block.

It is important to state that _something_ must block the `webSocket` handler from completing. If you fail to do this, your WebSocket will initiate correctly but will terminate instantly as your code completes. You can successfully keep your WebSocket open by calling `collect` (a terminal `Flow` operation) or using a `for` loop.

In the example, `collect` streams updates to the client, while a coroutine thread pool handles the `incoming` stream.

The blocking terminal call could be switched around, and the code would still work:

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

To cleanly terminate a WebSocket connection, we want the following to occur:

- A `close` frame is sent to the client.
- The `webSocket` handler stops executing.

In simpler code where `for` loops or `Iterator`s are used, `return`ing from the `webSocket` handler achieves clean termination:


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

The `webSocket` is terminated by completing it; however, calling `return` can be tricky depending on the code as you cannot return to outer scopes within a lambda/function.

Placing this code into a `launch` block prevents the `return@webSocket` from compiling and requires a different solution.

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

You can also trigger similar behaviour with the updates heading outbound over the WebSocket rather than inbound:

```kotlin
personRepository.updates.collect { (id, person) ->
  when (person) {
    null -> {
      if (filter == PeopleFilter.ALL || filter == PeopleFilter.DELETES) {
        outgoing.send(Frame.Text("Deleted person [$id]"))
        close() // Sends a [Frame.Close] to the client.
      }
    }
    else -> {
      if (filter == PeopleFilter.ALL || filter == PeopleFilter.SAVES) {
        outgoing.send(Frame.Text("Saved person [$id] $person"))
      }
    }
  }
}
```

Note that `collect` may still execute after `close` is called but will only do so for the next pass-through of `collect`, meaning that the `webSocket` handler only fully terminates after this point. Where the `close` occurs does not matter here. Without looking into it, I'm assuming it has something to do with the `coroutine` processing the `Flow` being suspended while the connection is closed.
