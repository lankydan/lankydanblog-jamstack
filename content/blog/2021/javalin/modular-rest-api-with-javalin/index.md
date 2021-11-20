---
title: Building a modular REST API with Javalin
date: "2021-11-21"
published: true
tags: [javalin, kodein, kotlin]
cover_image: blog-card.png
github_url: https://github.com/lankydan/javalin-modular-rest-api
---

[Javalin](https://javalin.io/) is a simple and lightweight web framework for Java and Kotlin (and technically any JVM language). I recently had to dig into Javalin a bit for work, and I even made a few contributions to the codebase once I started to understand it. Now I want to write down what I've learnt while using it so future me can remember what I know now but will inevitably forget.

In this post, I will write about building a modular REST API using Javalin. I will also leverage a few other technologies to create an example, using [Kodein](https://kodein.org/di/) for dependency injection and [Exposed](https://github.com/JetBrains/Exposed) for database access (although I will omit all database code from this post).

## Dependencies

For Javalin you'll need:

```xml
<dependency>
  <groupId>io.javalin</groupId>
  <artifactId>javalin</artifactId>
  <version>4.1.0</version>
</dependency>

<!-- You must set up your own logging when using Javalin -->
<dependency>
  <groupId>ch.qos.logback</groupId>
  <artifactId>logback-classic</artifactId>
  <version>1.2.6</version>
</dependency>
<dependency>
  <groupId>org.apache.logging.log4j</groupId>
  <artifactId>log4j-to-slf4j</artifactId>
  <version>2.14.1</version>
</dependency>
<dependency>
  <groupId>org.slf4j</groupId>
  <artifactId>jul-to-slf4j</artifactId>
  <version>1.7.32</version>
</dependency>

<!-- You must set up your own JSON serialization/deserialization when using Javlin -->
<dependency>
  <groupId>com.fasterxml.jackson.module</groupId>
  <artifactId>jackson-module-kotlin</artifactId>
  <version>2.13.0</version>
</dependency>
```

For dependency injection:

```xml
<dependency>
  <groupId>org.kodein.di</groupId>
  <artifactId>kodein-di-jvm</artifactId>
  <version>7.8.0</version>
</dependency>
```

## Starting the Javalin server

Starting the Javalin server is nice and easy:

```kotlin
Javalin.create { config ->
  // Apply your configuration or use the [create] overload that takes no arguments
}.routes {
  // Register endpoints within [route] block
}.start(8080)
```

The amount of code here is small as most of the logic revolves around the functionality of the HTTP endpoints. We'll see how to register endpoints in the next section.

> See the [Javalin documentation](https://javalin.io/documentation#getting-started) for a different explanation.

## Registering HTTP endpoints with Javalin

Below is how I've been registering endpoints within my code (which is slightly different from what you'd see in the [Javalin documentation](https://javalin.io/documentation#handlers)):

```kotlin
import io.javalin.apibuilder.ApiBuilder.delete
import io.javalin.apibuilder.ApiBuilder.get
import io.javalin.apibuilder.ApiBuilder.path
import io.javalin.apibuilder.ApiBuilder.post
import io.javalin.apibuilder.ApiBuilder.put
import io.javalin.http.Context

fun register() {
  // Routes the nested registration methods under the "/people" path
  path("/people") {
    // I use method references but you could put the callback/lambda/function here directly instead
    get("/", ::all)
    // {id} represents a Path Variable named "id" that can be accessed by the endpoint
    get("/{id}", ::get)
    post("/", ::post)
    put("/{id}", ::put)
    delete("/{id}", ::delete)
  }
}

// Every endpoint function must take a [Context] as an argument
private fun all(ctx: Context) {
  // implementation
}

private fun get(ctx: Context) {
  // implementation
}

// Other endpoints
```

The registration above uses Javalin's `ApiBuilder` for static builder functions. It is important to note that these functions will only work within a `routes` block, as shown in the previous section.

Calling `path("/people")` first makes it convenient to register multiple endpoints with the sane path prefix. If this was not done, then the registration code would look like:

```kotlin
fun register() {
  get("/people", ::all)
  get("/people/{id}", ::get)
  post("/people", ::post)
  put("/people/{id}", ::put)
  delete("/people/{id}", ::delete)
}
```

It's not exactly the biggest issue in the world, but I'd personally prefer to not have to write "people" so many times.

After the `path` call is done, you register the endpoints that will process incoming requests by providing a string path and a callback function. In the example, method references specify the callback function, but these could be switched out, and the function could be written directly inside the builder methods when registering the endpoint. For example, the following are equivalent:

```kotlin
// Method reference
get("/", ::all)
// Function
get("/") { ctx: Context ->
  // Implementation
}
```

At the end of the day, choose the method that suits you and your code's styling.

Finally, a few of the routes contain `{id}`, which denotes that a path variable with the name `id` exists. This `id` can then be accessed within the endpoint's callback using `Context.pathParam` and passing `"id"` as the input. You'll see examples of this later on in the post.

> Other examples of registering endpoints can be found in the [Javalin documentation](https://javalin.io/documentation#endpoint-handlers).

## Writing an HTTP endpoint

We've covered how to register endpoints, now onto implementing them.

I'll break down a few examples for implementing a REST API in this section.

Before we look at any code, I want to point out the importance of the `Context` class. You'll use this class for any request or response related functionality. For example:

- Retrieving a path variable using `Context.pathParam`.
- Accessing a query parameter using `Context.queryParam`.
- Returning JSON using `Context.json`.
- Setting a response's status with `Context.status`.

> A complete list of `Context`'s methods can be found in [Javalin's documentation](https://javalin.io/documentation#context).

Now that you know the importance of the `Context` class let's look at some examples.

Starting with the simplest endpoint:

```kotlin
private fun all(ctx: Context) {
  val people: List<Person> = personRepository.findAll().map { entity -> entity.toPerson() }
  ctx.json(people)
}
```

The only Javalin related part of this implementation is the call to `Context.json`. This function delegates to Jackson and converts the input object into JSON, taking the output and setting it as the response to the caller. 

It's worth pointing out that the call to `Context.json` doesn't instantly return a response to the caller; the sending of the response only happens once the endpoint's function has finished. However, I imagine a lot of the time it is probably the last thing you'd do.

The next snippet includes a few more of Javalin's features:

```kotlin
private fun get(ctx: Context) {
  val id: UUID = UUID.fromString(ctx.pathParam("id"))
  val person: Person = personRepository.find(id)?.toPerson() ?: throw NotFoundResponse()
  ctx.json(person)
}
```

The implementation starts by retrieving the `id` path variable using `Context.pathParam` to find a record. 

If the record doesn't exist, it throws a `NotFoundResponse` exception to tell Javalin to return a `404 Not Found` code. Technically, you could mimic this behaviour by manually setting the status, but using an exception allows you to exit the function straight away.

Finally, if the record exists, it returns it using `Context.json` (the same way as before).

This last snippet does 2 things differently from what's above:

```kotlin
private fun post(ctx: Context) {
  val person: Person = ctx.bodyAsClass()
  val persisted: Person = personRepository.persist {
      firstName = person.firstName
      lastName = person.lastName
  }.toPerson()
  ctx.json(persisted)
  ctx.status(HttpCode.CREATED)
}
```

This endpoint extracts the request's JSON body and converts it to a `Person` object (or whatever object you specify), persists the person and returns the persisted person (which has the `Person`'s `id` set in this case). To better represent the fact that this endpoint creates a new record, it calls `Context.status` to set the response code to `204 Created`.

## Modular registration of endpoints

Breaking up your code into modules allows you to separate concerns and make your code easier to manage and understand. This section will show how I set the groundwork in my example application to follow a modular structure.

I chose to achieve this using dependency injection with [Kodein](https://kodein.org/di/), allowing code to be split into modules that handle their own registration with a central module to initialise everything.

Kodein has a mechanism that allows `Module`s to be created that can be imported into the main `DI` block. In other words, modules can define `Module`s. I mean, the wording suggests that it's a perfect fit for this scenario.

To define a `Module`, you need to call `DI.Module` and specify that module's services:

```kotlin
object People {
  val module = DI.Module("People module") {
    bindSingleton { PersonRepository() }
    bindSingleton { PersonController(instance()) }
  }
}
```

> In relation to this post, this `Module` is found in the `:people` module.

To import a `Moudle` into a `DI` block:

```kotlin
val di: DI = DI {
  import(People.module)
}
```

> In relation to this post, this `DI` block is called within the `:application` module. 

The snippets above will handle initialising instances of the classes referenced in the `DI.Module` function. 

> Note, there are ways we could achieve similar functionality without using dependency injection.

We've initialised some classes, but there's still no mention of endpoints anywhere; let's fix that.

The endpoints are contained within the `PersonController` class, which you've already seen above in the DI code. We need to access them and register them inside `Javalin`'s `route` block.

Below is the relevant code from `PersonController`:

```kotlin
class PersonController(private val personRepository: PersonRepository) : Controller {

  override val path = "/people"

  override val endpoints = EndpointGroup {
    get("/", ::all)
    get("/{id}", ::get)
    post("/", ::post)
    put("/{id}", ::put)
    delete("/{id}", ::delete)
  }

  // Endpoints (you've seen them throughout this post)
}
```

This is similar to the code in the [Registering HTTP endpoints with Javalin](#Registering-HTTP-endpoints-with-Javalin) section. However, I decided to change the code a bit because I found it slightly more descriptive.

An `EndpointGroup` is defined that contains the `PersonController`'s endpoints along with its base `path`.

The `Controller` interface is what requires these two `val`s:

```kotlin
interface Controller {

  val path: String

  val endpoints: EndpointGroup
}
```

> In relation to this post, this interface is found in the `:web` module.

There's nothing fancy about this interface; its job is to define some structure to classes containing endpoints and make them discoverable for registration.

The last piece of the puzzle is shown below:

```kotlin
val di: DI = DI {
  import(People.module)
}

Javalin.create().routes {
  val controllers: List<Controller> by di.allInstances()
  controllers.forEach { path(it.path, it.endpoints) }
}.start(8080)
```

This code creates a `Javalin` server instance and calls its `routes` method. Inside the block, the `DI` instance finds all classes implementing the `Controller` interface. This was the primary reason for this interface, as it provides a handy way to access classes when used in conjunction with the dependency injection mechanism. With the `Controller` instances retrieved, each instance's base `path` and `endpoints` are registered using `ApiBuilder.path`.

After running this code, the `Javalin` server is up and running with fully functional endpoints without any business logic found within the module that started it.

## Summary

You can use Javalin to build modular REST APIs, allowing you to split out your code by functionality while still bringing it all together when you start your webserver.

The code below condenses the snippets and examples used through this post:

```kotlin
// In the `web` module
interface Controller {

  val path: String

  val endpoints: EndpointGroup
}

// In the `people` module
class PersonController(private val personRepository: PersonRepository) : Controller {

  override val path = "/people"

  override val endpoints = EndpointGroup {
    get("/", ::all)
    get("/{id}", ::get)
    post("/", ::post)
    put("/{id}", ::put)
    delete("/{id}", ::delete)
  }

  private fun all(ctx: Context) {
    val people: List<Person> = personRepository.findAll().map { entity -> entity.toPerson() }
    ctx.json(people)
  }

  private fun get(ctx: Context) {
    val id: UUID = UUID.fromString(ctx.pathParam("id"))
    val person: Person = personRepository.find(id)?.toPerson() ?: throw NotFoundResponse()
    ctx.json(person)
  }

  // POST, PUT and DELETE endpoints
}

// In the `:application` module
fun main() {

  val di = DI {
    import(People.module)
  }

  Javalin.create().routes {
    val controllers: List<Controller> by di.allInstances()
    controllers.forEach { path(it.path, it.endpoints) }
  }.start(8080)
}
```

> You can view all the code on [Github](https://github.com/lankydan/javalin-modular-rest-api).