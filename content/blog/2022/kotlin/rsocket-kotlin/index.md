---
title: Getting started with RSocket Kotlin
date: "2022-06-04"
published: true
tags: [kotlin, ktor, rsocket, rsocket-kotlin]
cover_image: blog-card.png
github_url: https://github.com/lankydan/rsocket-kotlin
---

RSocket is a transport protocol designed for reactive applications. More information on RSocket can be found on their [website](https://rsocket.io/about/motivations), leaving me to focus on writing about how RSocket and Kotlin can be combined.

RSocket has several [libraries](https://rsocket.io/about/implementations) written in various languages that implement the RSocket protocol. For Kotlin, this comes as an extension for [Ktor](https://ktor.io/) (a Kotlin client and web-server library) named [rsocket-kotlin](https://github.com/rsocket/rsocket-kotlin). We will look at this extension through this post.

The RSocket + Ktor libraries heavily use Kotlin's [coroutines](https://kotlinlang.org/docs/coroutines-basics.html) and [flows](https://kotlinlang.org/docs/flow.html). I recommend looking at these first if you have not used them before. Writing the content for this post was the first experience I've had using flows, and although they resemble constructs I am used to, calling the right method at the right time still proved challenging.

In this post, we will construct two services; one handling inbound requests via HTTP and a backend service that only exposes RSocket endpoints. This allows me to demonstrate both a working RSocket client and server, as well as fiddling around with some Ktor functionality to make it more interesting. In later sections, the inbound service will be known as the "client" and the backend service as the "server".

## Dependencies

At the time of writing, you'll want to use the following dependencies:

```groovy
implementation("io.rsocket.kotlin:rsocket-core:0.15.4")

implementation("io.rsocket.kotlin:rsocket-ktor-client:0.15.4")

implementation("io.rsocket.kotlin:rsocket-ktor-server:0.15.4")

implementation("io.ktor:ktor-server-netty:2.0.1")

implementation("io.ktor:ktor-client-cio:2.0.1")
```

As you can see, the RSocket dependencies are all `0.x.x` versions, and therefore the APIs fluctuate over time. Hopefully, they'll remain slightly stable after I've written this so that I don't have to update it...

## Building blocks of the inbound and backend services

In the two sections below, representing the inbound and backend services, we will look at the foundational code that endpoints can be built onto.

## Inbound service (RSocket client + HTTP server)

```kotlin
fun main() {
    val client = HttpClient {
        install(WebSockets)
        install(RSocketSupport)
    }
    embeddedServer(Netty, port = 8000) {
        install(io.ktor.server.websocket.WebSockets)
        routing {
          // Add HTTP endpoints
        }
    }.start(wait = true)
}
```

Here we have a `HTTPClient`, which will be used to make RSocket requests. I know it doesn't look related to RSocket yet; right now, it's not. It's a plain old `HTTPClient` provided by Ktor; however, as you'll see later, the RSocket client library provides extension functions that leverage a `HTTPClient` to make requests.

The client installs `WebSockets` and `RSocketSupport` to add functionality via plugins for WebSockets and RSockets respectively. It is essential to point out here that `WebSockets` must be installed before `RSocketSupport`; otherwise, you will receive the following error:

```javastacktrace
Exception in thread "main" java.lang.IllegalStateException: RSocket require WebSockets to work. You must install WebSockets plugin first.
	at io.rsocket.kotlin.ktor.client.RSocketSupport$Plugin.install(RSocketSupport.kt:49)
	at io.rsocket.kotlin.ktor.client.RSocketSupport$Plugin.install(RSocketSupport.kt:40)
	at io.ktor.client.HttpClientConfig$install$3.invoke(HttpClientConfig.kt:78)
	at io.ktor.client.HttpClientConfig$install$3.invoke(HttpClientConfig.kt:73)
	at io.ktor.client.HttpClientConfig.install(HttpClientConfig.kt:96)
	at io.ktor.client.HttpClient.<init>(HttpClient.kt:165)
	at io.ktor.client.HttpClient.<init>(HttpClient.kt:80)
	at io.ktor.client.HttpClientKt.HttpClient(HttpClient.kt:42)
	at io.ktor.client.HttpClientJvmKt.HttpClient(HttpClientJvm.kt:21)
	at dev.lankydan.inbound.InboundKt.main(Inbound.kt:38)
	at dev.lankydan.inbound.InboundKt.main(Inbound.kt)
```

Thankfully, the exception is nice and explicit and tells you how to rectify the issue.

We then have the _non-RSocket_ part, where a HTTP server is created and represents the entry point to the system. `WebSockets` are also installed here, which has no relation to RSocket itself but is used in this post's examples to make them more interesting.

## Backend service (RSocket server)

```kotlin
fun main() {
    embeddedServer(Netty, port = 9000) {
        install(WebSockets)
        install(RSocketSupport)
        routing {
            // Add RSocket endpoints
        }
    }.start(wait = true)
}
```

Onto the backend service, which only provides RSocket endpoints, which the inbound service communicates with. This means there is no need for a `HTTPClient` to be created. This time around, the HTTP server provided by `embeddedServer` installs `WebSockets` and `RSocketSupport`.

> `WebSockets` should be installed before `RSocketSupport` here as well.

## RSocket request types

In the following sections, we will look at examples for each RSocket request type, which include:

- Fire-and-forget.
- Request response.
- Request stream.
- Request channel.

The examples in the following sections will detail both the client and server-side implementations of each RSocket request type.

## Fire-and-forget

A Fire and forget request sends an endpoint some data and moves on, not expecting a response to be sent back. This allows for optimisations in both the client and the server implementations.

From the [RSocket documentation](https://rsocket.io/about/motivations#fire-and-forget):

> Fire-and-forget is an optimization of request/response that is useful when a response is not needed. It allows for significant performance optimizations, not just in saved network usage by skipping the response but also in client and server processing time as no bookkeeping is needed to wait for and associate a response or cancellation request.

### Client side

```kotlin
fun Routing.fireAndForget(client: HttpClient) {
    get("fireAndForget") {
        val rSocket: RSocket = client.rSocket(path = "fireAndForget", port = 9000)
        rSocket.fireAndForget(buildPayload { data("Hello") })

        log.info("Completed fire and forget request")

        call.respondText { "Completed" }
    }
}
```

To send a fire-and-forget request, create a `RSocket` by calling `rSocket` on the `HTTPClient` made earlier. This is an extension function that the RSocket library provides to leverage Ktor's `HTTPClient`. When creating a `RSocket`, the endpoint's path is defined (which defaults to `localhost`) and a port is specified. `RSocket.fireAndForget` is then called using `buildPayload` to construct the data to send. `buildPayload` uses a lambda and a `PayloadBuilder` to assist in building a payload.

After `fireAndForget` is called, there is nothing left to do as you're meant to _forget_ about the response.

### Server side

```kotlin
fun Routing.fireAndForget() {
    rSocket("fireAndForget") {
        RSocketRequestHandler {
            fireAndForget { request: Payload ->
                val text = request.data.readText()
                log.info("Received request (fire and forget): '$text' ")
            }
        }
    }
}
```

On the server-side, `rSocket` defines the endpoint's path, then `RSocketRequestHandler` along with `fireAndForget` specifies the type of request that is handled. This pattern repeats in the following sections, with only the call to `fireAndForget` being replaced with the different request types.

Each request handler is provided with arguments that allow it to serve requests. In this `fireAndForget` example, only the request's `Payload` is provided since that is all it needs.

## Request response

Building upon the previous section's knowledge, there is not much of a difference between `requestResponse` and `fireAndForget` requests. So this section will be short and sweet.

### Client side

```kotlin
fun Routing.requestResponse(client: HttpClient) {
    get("requestResponse") {
        val rSocket: RSocket = client.rSocket(path = "requestResponse", port = 9000)
        val response: Payload = rSocket.requestResponse(buildPayload { data("Hello") })
        val text = response.data.readText()

        log.info("Received response from backend: '$text'")

        call.respondText { text }
    }
}
```

This is virtually the same as the `fireAndForget` example, with the only difference being the existence of a response `Payload` that the server replies with.

### Server side

```kotlin
fun Routing.requestResponse() {
    rSocket("requestResponse") {
        RSocketRequestHandler {
            requestResponse { request: Payload ->
                val text = request.data.readText()
                log.info("Received request (request/response): '$text' ")
                delay(200)
                buildPayload { data("Received: '$text' - Returning: 'some data'") }
            }
        }
    }
}
```

This request handler will also look familiar. Here we call `requestResponse` and then return a `Payload` from the function. This `Payload` is sent back to the client in the response.

> Note that the function passed into `requestResponse` is a suspending function, allowing it to call methods like `delay`. Each request handler method also shares this behaviour.

## Request stream

A Request stream is a stream of data that flows in one direction, towards the client, from the RSocket endpoint. This data stream can be finite or indefinite; however, either can be cancelled to terminate the stream on both sides of the connection.

### Client side

```kotlin
fun Routing.requestStream(client: HttpClient) {
    webSocket("requestStream") {
        val rSocket: RSocket = client.rSocket(path = "requestStream", port = 9000)
        val stream: Flow<Payload> = rSocket.requestStream(buildPayload { data("Hello") })
        
        // Receives data via a WebSocket
        incoming.receiveAsFlow().onEach { frame ->
            log.info("Received frame: $frame")
            if (frame is Frame.Text && frame.readText() == "stop") {
                log.info("Stop requested, cancelling socket")
                this@webSocket.close(CloseReason(CloseReason.Codes.NORMAL, "Client called 'stop'"))
            }
        }.launchIn(this)

        // Handles data sent back over the RSocket connection
        stream.onCompletion {
            log.info("Connection terminated")
        }.collect { payload: Payload ->
            val data = payload.data.readText()
            log.info("Received payload: '$data'")
            delay(500)
            send("Received payload: '$data'")
        }
    }
}
```

The example above looks more complex. Yet, that is partly due to the additional WebSocket code that didn't exist in the previous sections.

Let's look at the code now.

`requestStream` is called and passed a `Payload` that represents the initial `Payload` that the RSocket endpoint receives, returning a `Flow` of `Payload`s for the client to process. In the example, it logs the received payloads and sends them over WebSockets to the original caller of the HTTP endpoint. It does so by calling `collect`, which is a _terminal_ operation on the `Flow` API that triggers the execution of the `Flow` (more information can be found in the [Flow documentation](https://kotlinlang.org/docs/flow.html#flows-are-cold)). 

The `delay` called inside `collect` here is interesting. RSocket manages back-pressure for you, meaning that if payloads are being received faster than they can be processed, the RSocket endpoint will stop streaming payloads until the previous batch is dealt with. You can run the [code](https://github.com/lankydan/rsocket-kotlin) these examples are taken from if you wish to see for yourself.

At this point, we do not know if the request stream is finite or not, but whether it runs to completion or is cancelled, the `onCompletion` function will execute.

The code that we haven't gone through yet is the handling of incoming data via a WebSocket. `incoming` is a `ReceiveChannel` that does just this. By chaining it with `receiveAsFlow` to simplify the manipulation of received data and launching the `Flow` to run as a separate `Job`, it can be left to run on another thread that terminates once the WebSocket ends (thanks to Coroutines). Forgetting to call `launchIn` will result in incoming data being ignored because the `Flow` never started processing. You also don't want to call `collect` here as it is blocking and prevents the RSocket code that is called later on in the method from running. Trust me, I lost a lot of time to this mistake.

The final interesting part of this example is the call to `this@websocket.close`, which terminates the WebSocket and the RSocket `Flow` as it exists within the `CoroutineScope` of the `webSocket` function. This termination of the `Flow` is sent to the RSocket endpoint, which ends the stream running there.

### Server side

```kotlin
fun Routing.requestSteam() {
    rSocket("requestStream") {
        RSocketRequestHandler {
            requestStream { request: Payload ->

                val prefix = request.data.readText()

                log.info("Received request (stream): $prefix")

                flow {
                    emitDataContinuously(prefix)
                }.onCompletion { throwable ->
                    if (throwable is CancellationException) {
                        log.info("Connection terminated")
                    }
                }
            }
        }
    }
}

suspend fun FlowCollector<Payload>.emitDataContinuously(prefix: String) {
    var i = 0
    while (true) {
        val data = "data: ${if (prefix.isBlank()) "" else "($prefix) "}$i"
        log.info("Emitting $data")
        emitOrClose(buildPayload { data(data) })
        i += 1
        delay(200)
    }
}
```

The server-side code above emits data continuously into the stream connected to the client.

As with the other request handlers, an initial `Payload` is received to determine the overall behaviour of the stream.

A `Flow` is then created to represent the stream (or flow of) data to the caller. Note that `requestStream`'s call signature is:

```kotlin
public fun requestStream(block: suspend (RSocket.(payload: Payload) -> Flow<Payload>))
```

Meaning that creating a `Flow` is required, and interacting with the response stream in any other way is not possible.

Data is continuously emitted data by using a while loop that calls `emitOrClose` each time round to send data to the response stream. `emitOrclose` is a more graceful way of sending data when compared to `emit`, as it explicitly handles cancellation, so that it can close any `Payload`s being sent to prevent any memory leaks.

## Request channel

A request channel is a bi-directional stream of data. Where request streams only send data from the server to the client, request channels allow both sides to send and receive data; more interesting behaviour can then be modelled using this mechanism as either side can continuously influence the other.

### Client side

```kotlin
fun Routing.requestChannel(client: HttpClient) {
    webSocket("requestChannel") {
        val rSocket: RSocket = client.rSocket(path = "requestChannel", port = 9000)

        // Receives data via a WebSocket and transforms it
        val payloads: Flow<Payload> = incoming.receiveAsFlow().transform { frame ->
            if (frame is Frame.Text) {
                val text = frame.readText()
                log.info("Received text: $text")
                if (text == "stop") {
                    log.info("Stop requested, cancelling socket")
                    this@webSocket.close(CloseReason(CloseReason.Codes.NORMAL, "Client called 'stop'"))
                } else {
                    emitOrClose(buildPayload { data(text) })
                }
            }
        }

        val stream: Flow<Payload> = rSocket.requestChannel(buildPayload { data("Hello") }, payloads)

        // Handles data sent back over the RSocket connection
        stream.onCompletion {
            log.info("Connection terminated")
        }.collect { payload: Payload ->
            val data = payload.data.readText()
            log.info("Received payload: '$data'")
            delay(500)
            send("Received payload: '$data'")
        }
    }
}
```

Some of this code overlaps with the request stream implementation, with the difference being the `Flow` passed into the `requestChannel` method.

The input `Flow` represents the stream of data transferred to the request endpoint, while the returned `Flow` receives the data sent by the endpoint.

The example leverages the data received over a WebSocket via the `incoming` method (the same one in the request stream snippet). The incoming data is converted into a `Flow` and `transform`s the data into `Payload`s to send over the channel. Although in one way, this is "incoming" data, it is converted and treated as the outgoing stream from the perspective of created RSocket channel. This shows how you can write flexible code that melds various concepts using Kotlin's `Flow`s that the RSocket API leverages.

### Server side

```kotlin
private fun Routing.requestChannel() {
    rSocket("requestChannel") {
        RSocketRequestHandler {
            requestChannel { request: Payload, payloads: Flow<Payload> ->

                var prefix = request.data.readText()

                log.info("Received request (channel): '$prefix'")

                payloads.onEach { payload ->
                    prefix = payload.data.readText()
                    log.info("Received extra payload, changed emitted values to include prefix: '$prefix'")
                }.launchIn(this)

                flow {
                    emitDataContinuously(prefix)
                }.onCompletion { throwable ->
                    if (throwable is CancellationException) {
                        log.info("Connection terminated")
                    }
                }
            }
        }
    }
}

suspend fun FlowCollector<Payload>.emitDataContinuously(prefix: String) {
    var i = 0
    while (true) {
        val data = "data: ${if (prefix.isBlank()) "" else "($prefix) "}$i"
        log.info("Emitting $data")
        emitOrClose(buildPayload { data(data) })
        i += 1
        delay(200)
    }
}
```

As we saw in the client-side section, a `Flow` is passed into the `requestChannel` method to represent the flow of data from client to server. Therefore, the endpoint needs a way to receive this data; the `payloads` parameter of the `requestChannel`'s function does just that.

`onEach` is called to process each received `Payload` and then is launched to begin execution. This is important, as without actually starting the `Flow`, all the received `Payload`s will go unprocessed. I'll just copy and paste what I wrote earlier about this.

>  Forgetting to call `launchIn` will result in incoming data being ignored because the `Flow` never started processing. You also don't want to call `collect` here as it is blocking and prevents the RSocket code that is called later on in the method from running. Trust me, I lost a lot of time to this mistake.

Please, please, please, don't falter as I did.

Other than that, the implementation of request channels is the same as that of request streams.

## Summary

This post covered how to use RSocket with Kotlin and Ktor. The focus has been on implementation rather than "why RSocket", which I'll let you dig into yourself (if that is what you want anyway). I admit that I struggled to leverage the APIs correctly at first. However, once I had working implementations, their similarities became apparent, which is why I kept repeating, "this is the same as the previous section". The primary difficulty was the use of `Flow`s, which if you have not used them before, like me, you'll also likely make all the mistakes I did. If you base your own examples or real-life work on the code I wrote here, you should at least bypass some issues and progress to a working implementation more smoothly.