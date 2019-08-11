---
title: Connecting a Ktor web server to a Corda node
date: "2019-08-12"
published: true
tags: [corda, kotlin, dlt, distributed ledger technology, blockchain]
cover_image: ./title-card.png
github_url: https://github.com/lankydan/corda-ktor-webserver
---

The preparation for this blog post began several weeks ago (probably over a month by now). Before I could write about melding Corda and Ktor together, I first needed to lay the groundwork and focus solely on Ktor. That is where my blog post, [Ktor - a Kotlin web framework](https://lankydan.dev/ktor-a-kotlin-web-framework) came into existence. If you haven't used or seen Ktor before, I recommend taking a browse at that post either before or after reading this post. Reading it in advance is probably a better idea, but you are in control of your own life 🤷.

This post will focus on implementing a Ktor web server that connects to a Corda node. I am not going to talk about why you should use Ktor. That decision is up to you. What I am doing is providing you with some information and allowing you to formulate a decision by yourself (like anything you read on the internet 🙄).

## Dependencies

```groovy
buildscript {
  ext.ktor_version = '1.2.2'
  ext.kotlin_version_for_app = '1.3.41'

  repositories {
    mavenCentral()
    jcenter()
  }

  dependencies {
    classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlin_version_for_app"
  }
}

apply plugin: 'java'
apply plugin: 'kotlin'

java {
  disableAutoTargetJvm()
}

dependencies {
  compile "org.jetbrains.kotlin:kotlin-stdlib-jdk8:$kotlin_version_for_app"
  compile "$corda_release_group:corda-jackson:$corda_release_version"
  compile "$corda_release_group:corda-rpc:$corda_release_version"
  compile "$corda_release_group:corda:$corda_release_version"
  compile "io.ktor:ktor-server-netty:$ktor_version"
  compile "ch.qos.logback:logback-classic:1.2.3"
  implementation ("io.ktor:ktor-jackson:$ktor_version") {
    exclude group: 'com.fasterxml.jackson.module', module: 'jackson-module-kotlin'
  }
  compile project(":contracts")
  compile project(":workflows")
}
```

There are a few things to highlight here. First, the `kotlin_version_for_app` property. Ktor requires Kotlin 1.3 (as it uses coroutines) but, at the time of writing, Corda only supports Kotlin 1.2. Therefore, different versions need to be used for the web server code and the Corda node. Secondly, `jackson-module-kotlin` is excluded as it causes a runtime error due to a version mismatch.

## High level look at the code

Below is a small snippet of code showing the starting point of the web server's implementation:

```kotlin
fun main() {
  embeddedServer(
    Netty,
    port = System.getProperty("server.port").toInt(),
    module = Application::module
  ).start().addShutdownHook()
}

fun Application.module() {
  val connection: CordaRPCConnection = connectToNode()
  install(CallLogging) { level = Level.INFO }
  install(ContentNegotiation) { cordaJackson(connection.proxy) }
  routing { messages(connection.proxy) }
  addShutdownEvent(connection)
}
```

This code ties everything together as all the functionality of the server branches out from the functions above.

The contents of `module` will be explored in the following sections.

## Connecting to the node

I bet you might have a good idea what `connectToNode` does. I hope you do anyway... Below are the contents of `connectToNode`:

```kotlin
fun connectToNode(
  host: String = System.getProperty("config.rpc.host"),
  rpcPort: Int = System.getProperty("config.rpc.port").toInt(),
  username: String = System.getProperty("config.rpc.username"),
  password: String = System.getProperty("config.rpc.password")
): CordaRPCConnection {
  val rpcAddress = NetworkHostAndPort(host, rpcPort)
  val rpcClient = CordaRPCClient(rpcAddress)
  return rpcClient.start(username, password)
}
```

If you have seen any of the Corda samples, then you will probably be familiar with this piece of code. Long story short, it connects to the node with the given connection details. I chose to generate the function's default parameters from the application's system properties. This implementation is not particularly important, it just connects to the node and could be written in several different ways.

A `CordaRPCConnection` is returned from the function. Initially, I wanted to return a `CordaRPCOps` as the connection itself doesn't do too much. But, without returning the connection, there is no way to gracefully disconnect from a node. In other words, there needs to be a way to call `notifyServerAndClose` when the server stops. This is explored further down in the post.

## Setting up Jackson

Some extra setup needs to be done to properly use Jackson with Corda:

```kotlin
fun ContentNegotiation.Configuration.cordaJackson(proxy: CordaRPCOps) {
  val mapper: ObjectMapper = JacksonSupport.createDefaultMapper(proxy)
  mapper.apply {
    setDefaultPrettyPrinter(DefaultPrettyPrinter().apply {
      indentArraysWith(DefaultPrettyPrinter.FixedSpaceIndenter.instance)
      indentObjectsWith(DefaultIndenter("  ", "\n"))
    })
  }
  val converter = JacksonConverter(mapper)
  register(ContentType.Application.Json, converter)
}
```

The Corda `ObjectMapper` is initialised with `createDefaultMapper`, allowing classes like `Party` or `X509Certificate` to be serialised or deserialised. This can be important depending on what is being returned from your own API.

The rest of the code is stolen from the `ktor-jackson` module. It alters the JSON output slightly to be more somewhat more desirable.

## Creating the endpoints

HTTP requests are routed to these endpoints:

```kotlin
fun Routing.messages(proxy: CordaRPCOps) {
  route("/messages") {
    get("/") {
      call.respond(
        HttpStatusCode.OK,
        proxy.vaultQueryBy<MessageState>().states.map { it.state.data })
    }
    post("/") {
      val received = call.receive<Message>()
      try {
        val message = proxy.startFlow(
          ::SendMessageFlow,
          state(proxy, received, UUID.randomUUID())
        ).returnValue.getOrThrow().coreTransaction.outputStates.first() as MessageState
        call.respond(HttpStatusCode.Created, message)
      } catch (e: Exception) {
        call.respond(HttpStatusCode.InternalServerError, e.message ?: "Something went wrong")
      }
    }
  }
}
```

Logic wise, there is not much going on here. For a focused explanation of this code, I recommend reading [Ktor - a Kotlin web framework](https://lankydan.dev/ktor-a-kotlin-web-framework) as I mentioned earlier.

## Gracefully disconnecting from a node

To gracefully disconnect from a node, the web server needs to call `CordaRPCConnection.notifyServerAndClose`. Implementing this required a bit of work that I wasn't expecting. Below is the code that triggers `notifyServerAndClose`:

```kotlin
fun NettyApplicationEngine.addShutdownHook() {
  Runtime.getRuntime().addShutdownHook(Thread {
    stop(1, 1, TimeUnit.SECONDS)
  })
  Thread.currentThread().join()
}

fun Application.addShutdownEvent(connection: CordaRPCConnection) {
  environment.monitor.subscribe(ApplicationStopped) {
    connection.notifyServerAndClose()
  }
}
```

A shutdown hook is added to the server. As explained in [Graceful shutdown of Ktor applications](https://dev.to/viniciusccarvalho/graceful-shutdown-of-ktor-applications-1h53), subscribing to the `ApplicationStopped` event is not enough to execute code when terminating the application. The shutdown hook calls `stop` to gracefully close the `NettyApplicationEngine` that the server runs upon. Leading to the shutdown event being correctly triggered and executed.

## That's all there is

Yes, really, that is all. Implementing a super basic web server does not require much code at all. There isn't really anything else to write. I have shown you that there is another web framework that can be used to connect to a Corda node. You don't have to default to Spring just because the Corda samples use them. If you prefer Ktor, use Ktor. If you don't, don't. If you did like the look of Ktor, if you haven't already, I recommend looking at [Ktor - a Kotlin web framework](https://lankydan.dev/ktor-a-kotlin-web-framework).

A lot of code was excluded from this post as I focused on the more important aspects of the implementation. If you are interested in the rest of the code, you can find it on my [GitHub](https://github.com/lankydan/corda-ktor-webserver).

If you enjoyed this post or found it helpful (or both) then please feel free to follow me on Twitter at [@LankyDanDev](https://twitter.com/LankyDanDev) and remember to share with anyone else who might find this useful!
