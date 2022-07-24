---
title: Ktor - A Kotlin web framework (Ktor 1.2.2)
slug: ktor-a-kotlin-web-framework
date: "2019-07-24"
published: true
tags: [kotlin, ktor]
github_url: https://github.com/lankydan/ktor-with-kodein-di/tree/ktor-1.2.2
cover_image: blog-card.png
---

> For an updated post using the more recent Ktor `2.0.3` see ["Ktor - a Kotlin web framework updated"](/ktor-a-kotlin-web-framework-2).

[Ktor](https://ktor.io/) is an asynchronous web framework written in and designed for Kotlin. Allowing the more impressive features of Kotlin, such as coroutines, to not only be used but supported as a first-class citizen. Typically, Spring is my go-to general framework and usually what I use when I need to put a REST API together. But, after recently attending a London Kotlin meetup where there was a presentation on Ktor, I decided I'd try something new for once. That is how I ended up here, writing a blog post about Ktor. So, this post is a learning experience for both you and me. The content of this post will lack experienced advice but will instead document my journey as I play around with Ktor for the first time.

Here is a bit more background information on Ktor. It is backed by [Jetbrains](https://www.jetbrains.com/) who are also the creators of Kotlin itself. Who better to make a Kotlin web framework than the men and women that work on the language.

## Implementation

### Dependencies

```groovy
buildscript {
  ext.kotlin_version = '1.3.41'
  ext.ktor_version = '1.2.2'

  repositories {
    mavenCentral()
  }
  dependencies {
    classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlin_version"
  }
}

apply plugin: 'java'
apply plugin: 'kotlin'

// might not be needed but my build kept defaulting to Java 12
java {
  disableAutoTargetJvm()
}

// Ktor uses coroutines
kotlin {
  experimental {
    coroutines "enable"
  }
}

compileKotlin {
  kotlinOptions.jvmTarget = "1.8"
}
compileTestKotlin {
  kotlinOptions.jvmTarget = "1.8"
}

dependencies {
  // Kotlin stdlib + test dependencies

  // ktor dependencies
  compile "io.ktor:ktor-server-netty:$ktor_version"
  compile "io.ktor:ktor-jackson:$ktor_version"
  // logback for logging
  compile group: 'ch.qos.logback', name: 'logback-classic', version: '1.2.3'
  // kodein for dependency injection
  compile group: 'org.kodein.di', name: 'kodein-di-generic-jvm', version: '6.3.0'
}
```

A few things are going on here.

- Ktor requires a minimum version of Kotlin `1.3`, so that coroutines can be leveraged. 

- Dependencies on `ktor-server-netty` and `ktor-jackson` are brought in. As the name suggests, this means [Netty](https://netty.io/) will be used for this post. Different underlying web servers can be used depending on which you choose to import. Currently, the remaining options are [Jetty](https://www.eclipse.org/jetty/) and [Tomcat](http://tomcat.apache.org/).

- [Logback](https://logback.qos.ch/) is brought in to handle logging. This is not included in the Ktor dependencies and is needed if you plan on doing any sort of logging.

- [Kodein](https://kosi-libs.org/kodein/7.14.0/index.html) is a dependency injection framework written in Kotlin. I have used it loosely in this post, and due to the size of the code examples, I could probably remove it altogether. The main reason it is there is to provide me with another chance to use something other than Spring. Remember this is also one of the reasons that I am trying out Ktor.

### Starting the web server

With the boring stuff out of the way, I can now run you through implementing a simple web server. The code below is all you need:

```kotlin
fun main() {
  embeddedServer(Netty, port = 8080, module = Application::module).start()
}

fun Application.module() {
  // code that does stuff which is covered later
}
```

Bam. There you have it. A simple web server running with Ktor and Netty. Ok, yes, it doesn't really do anything, but we'll expand on this in the following sections. The code is pretty self-explanatory. The only piece worth highlighting is the `Application.module` function. The `module` parameter of `embeddedServer` requires an extension function for `Application`. This is going to be the _main_ function that makes the server do stuff.

In the following sections, we will expand the contents of `Application.module` so that your web server actually does something worthwhile.

### Routing

At the moment, all incoming requests will be rejected since there are no endpoints to handle them. By setting up the routing, you can specify valid paths that requests can travel along and the functions that will process the requests when they reach their destinations.

This is done inside of a `Routing` block (or multiple `Routing` blocks). Inside of a block, routes to different endpoints are set up:

```kotlin
routing {
  // all routes defined inside are prefixed with "/people"
  route("/people") {
    // get a person
    get("/{id}") {
      val id = UUID.fromString(call.parameters["id"]!!)
      personRepository.find(id)?.let {
        call.respond(HttpStatusCode.OK, it)
      } ?: call.respondText(status = HttpStatusCode.NotFound) { "There is no record with id: $id" }
    }
    // create a person
    post {
      val person = call.receive<Person>()
      val result = personRepository.save(person.copy(id = UUID.randomUUID()))
      call.respond(result)
    }
  }
}
```

`routing` is a little convenience function to make the code flow a little smoother. The context (a.k.a `this`) inside of `routing` is of type `Routing`. Furthermore, the functions `route`, `get` and `post` are all extension functions of `Routing`.

`route` sets a base path to all its following endpoints. In this scenario, `/people`. `get` and `post` do not specify a path themselves since the base path is suffice for their needs. If desired, a path could be added to each one, for example:

```kotlin
routing {
  // get a person
    get("/people/{id}") {
      val id = UUID.fromString(call.parameters["id"]!!)
      personRepository.find(id)?.let {
        call.respond(HttpStatusCode.OK, it)
      } ?: call.respondText(status = HttpStatusCode.NotFound) { "There is no record with id: $id" }
    }
  // create a person
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
  // route requests to handler functions
  routing { people(personRepository) }
}

// extracted to a separate extension function to tidy up the code
fun Routing.people(personRepository: PersonRepository) {
  route("/people") {
    // get a person
    get("/{id}") {
      val id = UUID.fromString(call.parameters["id"]!!)
      personRepository.find(id)?.let {
        call.respond(HttpStatusCode.OK, it)
      } ?: call.respondText(status = HttpStatusCode.NotFound) { "There is no record with id: $id" }
    }
    // create a person
    post {
      val person = call.receive<Person>()
      val result = personRepository.save(person.copy(id = UUID.randomUUID()))
      call.respond(result)
    }
  }
}
```

I extracted the code to a separate function to decrease the contents of `Application.module`. This is going to be a good idea when you are trying to write a more significant application. Whether how I went about it is the _Ktor_ way or not, is another question. From having a quick look at the Ktor docs, it looks like this is a decent solution. I believe I saw another way to do this, but I would need to spend more time with it.

### Contents of a request handler

The code that executes when a request is routed to a request handler is obviously pretty important. The function needs to do something after all...

Each handler function executes within the context of a coroutine. I did not really make any use of this fact since each of the functions I have shown are fully synchronous. For a bit more information on this, the [Ktor docs](https://ktor.io/samples/feature/async.html) have an async example.

For the remainder of this post, I am going to try and not mention coroutines too much since they are not particularly important for this simple REST API.

In this section, the `get` function will be examined a little closer:

```kotlin
get("/{id}") {
  val id = UUID.fromString(call.parameters["id"]!!)
  personRepository.find(id)?.let {
    call.respond(HttpStatusCode.OK, it)
  } ?: call.respondText(status = HttpStatusCode.NotFound) { "There is no record with id: $id" }
}
```

`{id}` indicates that a path variable is expected in the request and its value will be stored as `id`. Multiple path variables can be included, but only one is needed for this example 👍. The value of `id` is retrieved from `call.parameters` which takes in the name of the variable you want to access.

- `call` represents the context of the current request.
- `parameters` is a list of the request's parameters.

Using the `id` from the path variables, the database searches for the corresponding record. In this scenario, if it exists, the record is returned along with the appropriate `200 OK`. If it doesn't, an error response is returned. Both `respond` and `respondText` alter the underlying `response` of the current `call`. You could do this manually, for example, by using:

```kotlin
call.response.status(HttpStatusCode.OK)
call.response.pipeline.execute(call, it)
```

You could do that, but there isn't any need to since that is actually just the implementation of `respond`. `respondText` has some extra logic but delegates down to `response` to finalise everything. The final call to `execute` in this function represents the _return_ value of the function.

### Installing extra features

In Ktor, extra _features_ can be plugged in when needed. For example, [Jackson JSON parsing](https://github.com/FasterXML/jackson) can be added to handle and return JSON from your application. Below are the features installed to the example application:

```kotlin
fun Application.module() {
  install(DefaultHeaders) { header(HttpHeaders.Server, "My ktor server") }
  // controls what level the call logging is logged to
  install(CallLogging) { level = Level.INFO }
  // setup jackson json serialisation
  install(ContentNegotiation) { jackson() }
}
```

- `DefaultHeaders` adds a header to every response with the name of the server.
- `CallLogging` logs information about outgoing responses and specifies what level to log them at. A logging library needs to be included for this to work. The output will look something like:
  
  ```log
  INFO  ktor.application.log - 200 OK: GET - /people/302a1a73-173b-491c-b306-4d95387a8e36
  ```

- `ContentNegotiation` tells the server to use Jackson for incoming and outbound requests. Remember this required including `ktor-jackson` as a dependency. You could also use [GSON](https://ktor.io/docs/serialization.html#add_json_dependency) if you prefer.

For a long list of the other features that Ktor includes, here is a handy link to their [docs](https://ktor.io/servers/features.html).

Installing features ties all the way back to the routing done earlier. `routing` delegates down to `install` inside its implementation. So you could write:

```kotlin
install(Routing) {
  route("/people") {
    get {
      // implementation
    }
  }
}
```

Whatever floats your boat, but I'd just stick to using `routing`. Hopefully that helped you understand what is going on under the hood, even if it was just a little bit.

### Brief mention for Kodein

I want to have a very brief look at [Kodein](https://kosi-libs.org/kodein/7.14.0/index.html) since I used it in this post. Kodein is a dependency injection framework written in Kotlin, for Kotlin. Below is the super small amount of DI that I used for the example application:

```kotlin
val kodein = Kodein {
  bind<CqlSession>() with singleton { cassandraSession() }
  bind<PersonRepository>() with singleton { PersonRepository(instance()) }
}
val personRepository by kodein.instance<PersonRepository>()
```

Inside of the `Kodein` block, instances of the application's classes are created. In this scenario, only one instance of each class is needed. Calling `singleton` denotes this. `instance` is a placeholder provided by Kodein to pass into a constructor instead of the actual object.

Outside of the `Kodein` block, an instance of `PersonRespository` is retrieved.

Yeah, I know, there isn't really much point to the use of Kodein here since I could have replaced it with a single line...

```kotlin
val personRepository = PersonRepository(cassandraSession())
```

Instead, let's think about it as a very concise example to understand 👍.

## Closing thoughts

As someone that is extremely biased towards Spring, I found working with Ktor very different from what I am used to. It took me a bit longer than usual to work towards some sample code that I was happy with. That being said, I think the outcome looks ok, and I will need to spend some more time with Ktor to better understand precisely how to get the best out of it. At the moment, I am confident there is a lot more to squeeze out of Ktor. For more information on Ktor, I'll have to refer you again to their [documentation](https://ktor.io/) where they have plenty of samples and tutorials.

If you found this post helpful, you can follow me on Twitter at [@LankyDanDev](https://twitter.com/LankyDanDev) to keep up with my new posts.