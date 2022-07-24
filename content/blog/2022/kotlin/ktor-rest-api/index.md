---
title: Ktor - a Kotlin web framework
date: "2022-07-24"
slug: ktor-a-kotlin-web-framework-2
published: true
tags: [kotlin, ktor, ktor 2.0.3]
github_url: https://github.com/lankydan/ktor-with-kodein-di
cover_image: blog-card.png
---

[Ktor](https://ktor.io/) is an asynchronous web framework written in and designed for Kotlin, leveraging coroutines and allowing you to write asynchronous code without having to manage any threads yourself.

Here is a bit more background information on Ktor. It is backed by [Jetbrains](https://www.jetbrains.com/), who are also the creators of Kotlin itself. Who better to make a Kotlin web framework than the people that work on the language.

## Implementation

### Dependencies

```groovy
buildscript {
  ext.kotlin_version = '1.7.10'
  ext.ktor_version = '2.0.3'

  repositories {
    mavenCentral()
  }
  dependencies {
    classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlin_version"
  }
}

apply plugin: 'java'
apply plugin: 'kotlin'

group 'ktor-and-kodein-di'
version '1.0.0'

repositories {
  mavenLocal()
  mavenCentral()
}

dependencies {
  implementation "org.jetbrains.kotlin:kotlin-stdlib-jdk8:$kotlin_version"
  testImplementation "org.jetbrains.kotlin:kotlin-test:$kotlin_version"
  testImplementation "junit:junit:4.12"

  implementation "io.ktor:ktor-server-netty:$ktor_version"
  // each plugin is its own dependency which matches the name in code (default-headers = DefaultHeaders)
  implementation "io.ktor:ktor-serialization-jackson:$ktor_version"
  implementation "io.ktor:ktor-server-default-headers:$ktor_version"
  implementation "io.ktor:ktor-server-call-logging:$ktor_version"
  implementation "io.ktor:ktor-server-content-negotiation:$ktor_version"

  implementation group: 'org.kodein.di', name: 'kodein-di-generic-jvm', version: '6.5.1'
  implementation group: 'ch.qos.logback', name: 'logback-classic', version: '1.2.3'
  implementation group: 'com.datastax.oss', name: 'java-driver-core', version: '4.14.1'
}
```

A few things are going on here.

- Ktor `2.0.3` uses a minimum version of Kotlin `1.7` from what I've determined from their documentation.

- Dependencies on `ktor-server-netty` and several `ktor-server` plugins are brought in. As `ktor-server-netty` suggests, [Netty](https://netty.io/) will be used for this post. Depending on which you choose to import, different underlying web servers can be used. The other available options are Netty, Jetty, Tomcat and CIO. More information can be found in the [supported engines](https://ktor.io/docs/engines.html#supported-engines) documentation.

- [Logback](https://logback.qos.ch/) is brought in to handle logging. This is not included in the Ktor dependencies and is needed if you plan on doing any sort of logging.

- [Kodein](https://kosi-libs.org/kodein/7.14.0/index.html) is a dependency injection framework written in Kotlin. I have used it loosely in this post, and due to the size of the code examples, I could probably remove it altogether.

### Starting the web server

With the boring stuff out of the way, I can now run you through implementing a web server. The code below is all you need:

```kotlin
import io.ktor.server.engine.embeddedServer
import io.ktor.server.netty.Netty

fun main() {
  embeddedServer(Netty, port = 8080, module = Application::module).start()
}

fun Application.module() {
  // code that does stuff which is covered later
}
```

Bam. There you have it. A web server running with Ktor and Netty. Ok, yes, it doesn't really do anything, but we'll expand on this in the following sections. 

The code is pretty self-explanatory. The only piece worth highlighting is the `Application.module` function. The `module` parameter of `embeddedServer` requires an `Application.() -> Unit` function to be provided that configures the server and will be the _main_ entry point into the server code.

In the following sections, we will expand the contents of `Application.module` so that your web server actually does something worthwhile.

### Routing

All incoming requests will be rejected at the moment since there are no endpoints to handle them. By setting up the routing, you can specify valid paths that requests can travel along and the functions that will process the requests when they reach their destinations.

This is done inside of a `Routing` block (or multiple `Routing` blocks). Inside of a block, routes to different endpoints are set up:

```kotlin
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.call
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.response.respondText
import io.ktor.server.routing.Routing
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.route

routing {
  // All routes defined inside are prefixed with "/people"
  route("/people") {
    // Get a person
    get("/{id}") {
      val id = UUID.fromString(call.parameters["id"]!!)
      personRepository.find(id)?.let {
        call.respond(HttpStatusCode.OK, it)
      } ?: call.respondText(status = HttpStatusCode.NotFound) { "There is no record with id: $id" }
    }
    // Create a person
    post {
      val person = call.receive<Person>()
      val result = personRepository.save(person.copy(id = UUID.randomUUID()))
      call.respond(result)
    }
  }
}
```

> The imports have been included due to the reliance on extension functions, making discovering functions without an IDE difficult.

`routing` is a convenience function to make the code flow smoothly. The context (a.k.a `this`) inside of `routing` is of type `Routing`. Furthermore, the functions `route`, `get`, and `post` are all extension functions of `Routing`.

`route` sets a base path to all its following endpoints. In this scenario, `/people`. `get` and `post` do not specify a path themselves since the base path is suffice for their needs. If desired, a path could be added to each one, for example:

```kotlin
routing {
  // Get a person
  get("/people/{id}") {
    val id = UUID.fromString(call.parameters["id"]!!)
    personRepository.find(id)?.let {
      call.respond(HttpStatusCode.OK, it)
    } ?: call.respondText(status = HttpStatusCode.NotFound) { "There is no record with id: $id" }
  }
  // Create a person
  post("/people) {
    val person = call.receive<Person>()
    val result = personRepository.save(person.copy(id = UUID.randomUUID()))
    call.respond(result)
  }
}
```

Before you move onto the next section, I want to show you how I actually implemented the routing:

```kotlin
fun Application.module() {
  val personRepository by kodein.instance<PersonRepository>()
  // Route requests to handler functions
  routing { people(personRepository) }
}

// Extracted to a separate extension function to tidy up the code
fun Routing.people(personRepository: PersonRepository) {
  route("/people") {
    // Get a person
    get("/{id}") {
      val id = UUID.fromString(call.parameters["id"]!!)
      personRepository.find(id)?.let {
        call.respond(HttpStatusCode.OK, it)
      } ?: call.respondText(status = HttpStatusCode.NotFound) { "There is no record with id: $id" }
    }
    // Create a person
    post {
      val person = call.receive<Person>()
      val result = personRepository.save(person.copy(id = UUID.randomUUID()))
      call.respond(result)
    }
  }
}
```

I extracted the code to a separate function to decrease the contents of `Application.module`. When trying to write a more significant application, this will be a good idea. Whether the way I went about it is the _Ktor_ way or not is another question. From having a quick look at the Ktor docs, it looks like this is a decent solution. I believe I saw another way to do this, but I would need to spend more time with it.

### Contents of a request handler

The code that executes when a request is routed to a request handler is obviously pretty important. The function needs to do something after all...

Each handler function executes within the context of a coroutine. I did not really use this fact since each of the functions I have shown are fully synchronous.

For the remainder of this post, I will try not to mention coroutines too much since they are not particularly important for this simple REST API.

In this section, the `get` function will be examined a little closer:

```kotlin
get("/{id}") {
  val id = UUID.fromString(call.parameters["id"]!!)
  personRepository.find(id)?.let {
    call.respond(HttpStatusCode.OK, it)
  } ?: call.respondText(status = HttpStatusCode.NotFound) { "There is no record with id: $id" }
}
```

`{id}` indicates that a path variable is expected in the request, and its value will be stored as `id`. Multiple path variables can be included, but only one is needed for this example 👍. The value of `id` is retrieved from `call.parameters`, which takes in the name of the variable you want to access.

- `call` represents the context of the current request.
- `parameters` is a list of the request's parameters.

The database searches for the corresponding record using the `id` from the path variables. In this scenario, if it exists, the record is returned along with the appropriate `200 OK`. If it doesn't, an error response is returned. Both `respond` and `respondText` alter the underlying `response` of the current `call`. You could do this manually, for example, by using:

```kotlin
call.response.status(HttpStatusCode.OK)
call.response.pipeline.execute(call, it)
```

You could do that, but there isn't any need to since that is actually just the implementation of `respond`. `respondText` has some extra logic but delegates down to `response` to finalise everything. The final call to `execute` in this function represents the function's return value.

### Installing plugins

In Ktor, plugins can be installed when needed. For example, [Jackson JSON parsing](https://github.com/FasterXML/jackson) can be added to handle and return JSON from your application. 

Below are the plugins installed to the example application:

```kotlin
import io.ktor.http.HttpHeaders
import io.ktor.serialization.jackson.jackson
import io.ktor.server.application.install
import io.ktor.server.plugins.callloging.CallLogging
import io.ktor.server.plugins.contentnegotiation.ContentNegotiation
import io.ktor.server.plugins.defaultheaders.DefaultHeaders
import org.slf4j.event.Level

fun Application.module() {
  // Adds header to every response
  install(DefaultHeaders) { header(HttpHeaders.Server, "My ktor server") }
  // Controls what level the call logging is logged to
  install(CallLogging) { level = Level.INFO }
  // Setup jackson json serialisation
  install(ContentNegotiation) { jackson() }
}
```

- `DefaultHeaders` adds a header to every response with the server's name.
- `CallLogging` logs information about outgoing responses and specifies what level to log them at. A logging library needs to be included for this to work. The output will look something like this:
  
  ```log
  INFO  ktor.application.log - 200 OK: GET - /people/302a1a73-173b-491c-b306-4d95387a8e36
  ```

- `ContentNegotiation` tells the server to use Jackson for incoming and outbound requests. Remember this required including `ktor-serialization-jackson` as a dependency. You could also use [GSON](https://ktor.io/docs/serialization.html#add_json_dependency) if you prefer.

For a list of the other plugins that Ktor includes, you can go to [start.ktor.io](https://start.ktor.io), where you can view the existing plugins (by pretending to create a new application).

Installing plugins ties all the way back to the routing done earlier. `routing` delegates down to `install` inside its implementation. So you could write:

```kotlin
install(Routing) {
  route("/people") {
    get {
      // Implementation
    }
  }
}
```

Whatever floats your boat, but I'd just stick to using `routing`. Hopefully, that helped you understand what is going on under the hood, even if it was just a little bit.

### Brief mention for Kodein

I want to have a very brief look at [Kodein](https://kosi-libs.org/kodein/7.14.0/index.html/) since I used it in this post. Kodein is a dependency injection framework written in Kotlin, for Kotlin. Below is the super small amount of DI that I used for the example application:

```kotlin
val kodein = Kodein {
  bind<CqlSession>() with singleton { cassandraSession() }
  bind<PersonRepository>() with singleton { PersonRepository(instance()) }
}
val personRepository by kodein.instance<PersonRepository>()
```

Inside the `Kodein` block, instances of the application's classes are created. In this scenario, only one instance of each class is needed. Calling `singleton` denotes this. `instance` is a placeholder provided by Kodein to pass into a constructor instead of the actual object.

Outside of the `Kodein` block, an instance of `PersonRespository` is retrieved.

Yeah, I know; there isn't much point to using Kodein here since I could have replaced it with a single line...

```kotlin
val personRepository = PersonRepository(cassandraSession())
```

Instead, let's consider it a very concise example to understand 👍.

## Summary

In this post, we looked at initialising a web server using Ktor, routing requests to lambdas/handlers that generate responses and installing plugins to the server. We mainly stayed at the surface level in this post and focused on the foundational knowledge to get you up and running with Ktor. For more information, it is worth going to [ktor.io](https://ktor.io/) and viewing Ktor's documentation and samples.