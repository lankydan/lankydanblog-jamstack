---
title: Spring Data R2DBC for Microsoft SQL Server
date: "2019-05-07"
published: true
tags: [spring, r2dbc, spring data, spring boot, java, kotlin, spring data r2dbc, mssql, sql server, reactive, reactive streams]
cover_image: ./spring-data-r2dbc-road.png
github_url: https://github.com/lankydan/spring-data-r2dbc/tree/mssql_r2dbc
---

This post is the sibling of another blog post I wrote that focused on [Spring Data R2DBC and Postgres](https://lankydan.dev/2019/02/16/asynchronous-rdbms-access-with-spring-data-r2dbc). Hopefully, you read the title before traversing to this page. So, you should know that I will be writing about Spring Data R2DBC's integration with Microsoft SQL Server. As Spring provides a lot of magic 🧙‍♀️, most of the code from my previous [Postgres post](https://lankydan.dev/2019/02/16/asynchronous-rdbms-access-with-spring-data-r2dbc) will still work and only requires a few changes to get up and running with MSSQL.

For more background information, I do recommend reading the [Postgres version](https://lankydan.dev/2019/02/16/asynchronous-rdbms-access-with-spring-data-r2dbc) of this post as I do not want to repeat myself too much. That being said, below is its introduction which should provide enough context for us to continue. I will keep this post short by providing brief notes alongside the implementation for MSSQL.

> Not too long ago, a reactive variant of the JDBC driver was released. Known as R2DBC. It allows data to be streamed asynchronously to any endpoints that have subscribed to it. Using a reactive driver like R2DBC together with Spring WebFlux allows you to write a full application that handles receiving and sending of data asynchronously. In this post, we will focus on the database. From connecting to the database and then finally saving and retrieving data. To do this, we will be using Spring Data. As with all Spring Data modules, it provides us with out of the box configuration. Decreasing the amount of boilerplate code that we need to write to get our application setup. On top of that, it provides a layer upon the database driver that makes doing the simple tasks easier and the more difficult tasks a little less painful.

## Dependencies

```xml
<parent>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-parent</artifactId>
  <version>2.2.0.M3</version>
</parent>
<dependencies>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter</artifactId>
  </dependency>
  <dependency>
    <groupId>org.springframework.data</groupId>
    <artifactId>spring-data-r2dbc</artifactId>
    <version>1.0.0.M2</version>
  </dependency>
  <dependency>
    <groupId>io.r2dbc</groupId>
    <artifactId>r2dbc-mssql</artifactId>
    <version>0.8.0.M8</version>
  </dependency>
  <dependency>
    <groupId>io.projectreactor</groupId>
    <artifactId>reactor-core</artifactId>
  </dependency>
</dependencies>

<repositories>
  <repository>
    <id>repository.spring.milestone</id>
    <name>Spring Milestone Repository</name>
    <url>http://repo.spring.io/milestone</url>
  </repository>
</repositories>
```

These dependencies are the bare minimum you need for this post. With `spring-data-r2dbc` and `r2dbc-mssql` doing all the heavy lifting. Depending on which database you want to use `r2dbc-mssql` can be switched out for another database that has a R2DBC driver (for example `r2dbc-postgresql`).

## Connecting to the database

Spring has your back here 🦸‍♀️. It allows you to get all the basic setup by only extending `AbstractR2dbcConfiguration` and implementing a `ConnectionFactory` bean:

```kotlin
@Configuration
@EnableR2dbcRepositories
class DatabaseConfiguration(
  @Value("\${spring.data.mssql.host}") private val host: String,
  @Value("\${spring.data.mssql.port}") private val port: Int,
  @Value("\${spring.data.mssql.database}") private val database: String,
  @Value("\${spring.data.mssql.username}") private val username: String,
  @Value("\${spring.data.mssql.password}") private val password: String
) : AbstractR2dbcConfiguration() {

  override fun connectionFactory(): ConnectionFactory {
    return MssqlConnectionFactory(
      MssqlConnectionConfiguration.builder()
        .host(host)
        .port(port)
        .database(database)
        .username(username)
        .password(password).build()
    )
  }
}
```

The only bean that you need to implement is the `ConnectionFactory` that contains (as the name suggests) details about the connection to the database. This bean is one component of the `DatabaseClient`. This is an important class, as it is central to the execution of SQL within the Spring Data R2DBC module. The rest of the beans the `DatabaseClient` is built from are created inside of `AbstractR2dbcConfiguration` and fed into the client. Let Spring take the wheel 🙌🚗 and you will be alright. In all seriousness extending `AbstractR2dbcConfiguration` and implementing `connectionFactory` will get your application up and running very quickly.

Finally, the `@EnableR2dbcRepositories` annotation instructs Spring to find any repository interfaces that extend Spring’s Repository interface. This is used as the base interface for instrumenting Spring Data repositories. We will look at this a little closer in the next section.

## Creating a Spring Data Repository

R2DBC does not currently support the inferring of queries, which is one of the handy features that I am used to Spring Data giving me. Although it is missing, life can continue but this time it will need a tiny bit more code to get it done:

```kotlin
@Repository
interface PersonRepository : R2dbcRepository<Person, Int> {

  @Query("SELECT * FROM people WHERE name = @name")
  fun findAllByName(name: String): Flux<Person>

  @Query("SELECT * FROM people WHERE age = @age")
  fun findAllByAge(age: Int): Flux<Person>
}
```

By extending `R2DBCRepository`, Spring will pick up these queries and instrument them as well as providing some typical queries for you, such as `findByAllId`. This is where the `@EnableR2dbcRepositories` annotation added earlier comes into play. Without this annotation then this repository will not do anything for you and would instead require a completely manual implementation.

`@Query` is used to define the query a function will provide, with Spring providing the implementation itself. The inputs passed into the query are defined using the format of `@<parameter_name>`.

The `Flux` objects returned from these functions are basically the reactive version of a `List`. In other words, they return multiple values. These values will be returned and processed as they arrive as long as you have subscribed to the `Flux` once it has been created.

## The entity

Although Spring Data R2DBC does not aim to be a fully fledged ORM, it does still provide entity mapping. Below is an entity class that doesn't really need much explanation:

```kotlin
@Table("people")
data class Person(
  @Id val id: Int? = null,
  val name: String,
  val age: Int
)
```

I said it doesn't need much explanation, so let me make this one point. `id` has been made nullable and has a default value of `null` to allow Postgres to generate the next suitable value itself. If this is not nullable and an `id` value is provided, Spring will actually try to run an update instead of an insert upon saving. There are other ways around this, but I think this is good enough. To be honest, this is a Kotlin specific problem. If you are using Java, then relax, you won't need to worry about this. That being said, come to the light side and program in Kotlin, all your dreams will be fulfilled if you do (I cannot guarantee that will actually happen 🤦‍♂️).

This entity will map to the `people` table defined below:

```sql
CREATE TABLE people (
  id INT NOT NULL IDENTITY PRIMARY KEY,
  name VARCHAR(75) NOT NULL,
  age INTEGER NOT NULL
)
```

## Seeing it all in action

All the setup has been done, the `Application` class below makes use of the queries written earlier as well as some that Spring Data provides out of the box.

```kotlin
@SpringBootApplication
class Application : CommandLineRunner {

  @Autowired
  private lateinit var personRepository: PersonRepository

  override fun run(vararg args: String?) {
    personRepository.saveAll(
      listOf(
        Person(name = "Dan Newton", age = 25),
        Person(name = "Laura So", age = 23)
      )
    ).log().subscribe()
    personRepository.findAll().subscribe { log.info("findAll - $it") }
    personRepository.findAllById(Mono.just(1)).subscribe { log.info("findAllById - $it") }
    personRepository.findAllByName("Laura So").subscribe { log.info("findAllByName - $it") }
    personRepository.findAllByAge(25).subscribe { log.info("findAllByAge - $it") }
  }
}
```

In the real implementation of this code, some `sleep`s have been added to ensure that the reactive code has a chance to work. Reactive applications are meant to do things asynchronously and therefore this application will process the function calls in different threads. Without blocking the main thread, these asynchronous processes might never fully execute. To keep everything tidy, I have removed the `sleep`s from the example.

The output for running the code above would look something like the below:

```java
2019-05-06 18:05:04.766  INFO 23225 --- [           main] reactor.Flux.ConcatMap.1                 : onSubscribe(FluxConcatMap.ConcatMapImmediate)
2019-05-06 18:05:04.767  INFO 23225 --- [           main] reactor.Flux.ConcatMap.1                 : request(unbounded)
2019-05-06 18:05:15.451  INFO 23225 --- [actor-tcp-nio-1] reactor.Flux.ConcatMap.1                 : onNext(Person(id=1, name=Dan Newton, age=25))
2019-05-06 18:05:20.533  INFO 23225 --- [actor-tcp-nio-1] reactor.Flux.ConcatMap.1                 : onNext(Person(id=2, name=Laura So, age=23))
2019-05-06 18:05:20.533  INFO 23225 --- [actor-tcp-nio-1] reactor.Flux.ConcatMap.1                 : onComplete()
2019-05-06 18:05:25.550  INFO 23225 --- [actor-tcp-nio-2] com.lankydanblog.tutorial.Application    : findAll - Person(id=1, name=Dan Newton, age=25)
2019-05-06 18:05:25.550  INFO 23225 --- [actor-tcp-nio-2] com.lankydanblog.tutorial.Application    : findAll - Person(id=2, name=Laura So, age=23)
2019-05-06 18:05:30.554  INFO 23225 --- [actor-tcp-nio-3] com.lankydanblog.tutorial.Application    : findAllById - Person(id=1, name=Dan Newton, age=25)
2019-05-06 18:05:35.582  INFO 23225 --- [actor-tcp-nio-4] com.lankydanblog.tutorial.Application    : findAllByName - Person(id=2, name=Laura So, age=23)
2019-05-06 18:05:40.587  INFO 23225 --- [actor-tcp-nio-5] com.lankydanblog.tutorial.Application    : findAllByAge - Person(id=1, name=Dan Newton, age=25)
```

A few things to take away here:

- `onSubscribe` and `request` occur on the main thread where the `Flux` was called from. Only `saveAll` outputs this since it has included the `log` function. Adding this to the other calls would have lead to the same result of logging to the main thread.
- The execution contained within the `subscribe` function and the internal steps of the `Flux` are ran on separate threads.

This is not anywhere close to a real representation of how you would use Reactive Streams in a production application but hopefully demonstrates how to use them and gives a bit of insight into how they execute.

## doOnComplete()

Yes, that is a smart pun using the name of a `Flux` function 🤣😒🤦‍♀️.

We have come to the close of this shortish post. I haven't explained too much because my [Postgres](https://lankydan.dev/2019/02/16/asynchronous-rdbms-access-with-spring-data-r2dbc) version did all that and I am a too lazy to rewrite it. But, this is also because Spring Data provides a generic interface that will lay most of the paving for you. Leaving you with only a few steps that you need to do yourself. Firstly, deciding which database to use, whether this is Postgres, H2, Microsoft SQL Server (as shown in this post) or other databases that have R2DBC drivers in the future. Finally, on the code side, setting up the `ConnectionFactory` and repository queries which will slightly differ between databases. I should probably mention the fact that R2DBC enables you to move towards more reactive applications. I mean this, this post is about R2DBC after all 🤷‍♀️. Utilising databases with R2DBC drivers and Spring modules will allow you to build a fully reactive application. Starting from the core of your application (the database) to the edges and endpoints exposed to external clients. Spring's push for reactive applications as well as the improvements in the R2DBC drivers that are yet to come, will make this sort of transition (if appropriate to your business) less painful and faster to implement.

The code used in this post can be found on my [GitHub](https://github.com/lankydan/spring-data-r2dbc/tree/mssql_r2dbc).

If you found this post helpful, you can follow me on Twitter at [@LankyDanDev](https://twitter.com/LankyDanDev) to keep up with my new posts.