---
title: A quick look into Reactive Streams with Spring Data and MongoDB
date: "2017-07-16"
published: true
tags: [spring, java, spring boot, spring data, mongo, mongodb, spring data mongodb]
canonical_url: https://lankydanblog.com/2017/07/16/a-quick-look-into-reactive-streams-with-spring-data-and-mongodb/
cover_image: ./spring-forest.jpeg
include_date_in_url: true
github_url: https://github.com/lankydan/spring-data-reactive-mongodb
---

This is a short post looking into Reactive Streams and how they can be used with MongoDB and Spring Data. This post won't go into the depths of what Reactive Programming and Reactive Streams are as there have been plenty of posts covering that recently, such as [What are Reactive Streams in Java](https://dzone.com/articles/what-are-reactive-streams-in-java) and [Reactive Spring 5 and Application Design Impact](https://dzone.com/articles/reactive-spring-5-and-application-design-impact). Instead it will simply demonstrate how to use the newer versions (at the time of writing) of Spring Data which come equipped with the features necessary to use Reactive Streams. In this post we will be using MongoDB due to it being one of the few currently available databases with a reactive implementation with Spring Data, the others include (at the time of writing) [Cassandra](https://github.com/spring-projects/spring-data-examples/tree/master/cassandra/reactive) and [Redis](https://github.com/spring-projects/spring-data-examples/tree/master/redis/reactive).

In terms of getting everything setup not much is different to using the non reactive version of MongoDB with Spring Data. The main differences that you will see is the word "reactive" popup into loads of class names such as `ReactiveMongoRepository` instead of `MongoRepository`, hopefully... helping you distinguish between them. The other main difference is that instead of returning a document or a list of documents you will now receive a some slightly different objects. In this post we will use [Reactor](https://projectreactor.io/) as our Reactive Streaming library meaning that the returned objects are `Mono<T>` for a singular document and a `Flux<T>` when multiple documents are being returned. For more information on `Flux` and `Mono` from Project Reactor have a look at [Intro into Reactor Core](http://www.baeldung.com/reactor-core).

So lets get started. First things first are the including the relevant projects as dependencies in our code. Below are the maven dependencies required.

```xml
<parent>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-parent</artifactId>
  <version>2.0.0.BUILD-SNAPSHOT</version>
</parent>

<dependencies>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-mongodb-reactive</artifactId>
  </dependency>
</dependencies>

<repositories>
  <repository>
    <id>spring-libs-snapshot</id>
    <name>Spring Snapshot Repository</name>
    <url>http://repo.spring.io/libs-snapshot</url>
  </repository>
</repositories>
```

For this tutorial Spring was kind enough to have the `spring-boot-starter-data-mongodb-reactive` dependency ready made for us that contains everything we need to get going. This includes dependencies such as `spring-data-mongodb` and `reactor-core` at the correct versions to allow us to use Reactive Streams. While we're talking about versioning it is also important to use the newer version of `spring-boot-starter-parent` which needs to be `2.0.0` or above to include the reactive libraries. As the dependency for this is currently a snapshot the repository need to be defined to retrieve it.

```java
@Configuration
@EnableReactiveMongoRepositories(basePackageClasses = PersonRepository.class)
public class MongoConfig extends AbstractReactiveMongoConfiguration {

  @Bean
  public MongoClient mongoClient() {
    return MongoClients.create();
  }

  @Override
  protected String getDatabaseName() {
    return "test";
  }

  @Bean
  public ReactiveMongoTemplate reactiveMongoTemplate() {
    return new ReactiveMongoTemplate(mongoClient(), getDatabaseName());
  }
}
```

Here we have a `@Configuration` class that extends `AbsractReactiveMongoConfiguration` to provide some beans to setup the application to use reactive MongoDB. This class is not required if non reactive `spring-data-mongodb` code was being used. `@EnableReactiveMongoRepositories` goes back to what I said earlier in the post, it has taken an existing annotation `@EnableMongoRepositories` and added the word "reactive" into it. Through the use of this annotation implementations of `ReactiveCrudRepository` can be used, the above example specifies the `PersonRepository` (which we will look at later) as it is found in a different package to this configuration class. If you wish to still use a mix and match of reactive and non-reactive repositories you will still need to include the `@EnableMongoRepositories` annotation. The bean `mongoClient` calls `MongoClients.create()` to instantiate a `MongoClient` with the default connection of `mongodb://localhost`, settings or a different connection string could be passed in if desired. This client is used along with the database name to create the `ReactiveMongoTemplate` bean.

```java
public interface PersonRepository extends ReactiveMongoRepository<Person, String> {

  Flux<Person> findByFirstName(final String firstName);

  Mono<Person> findOneByFirstName(final String firstName);
}
```

As described in one of my earlier posts [Getting started with Spring Data and MongoDB](https://lankydanblog.com/2017/05/20/getting-started-with-spring-data-and-mongodb/) the implementation of `PersonRepository` is not required as the executed code is inferred from the name of the methods specified on the interface. Again this another example of where the reactive version closely resembles it's original (`MongoRepository` in case your wondering). `ReactiveMongoRepository` inherits from `ReactiveCrudRepository` allowing the `@EnableReactiveMongoRepositories` to include it when setting up. As mentioned earlier in this post `Mono<Person>` and `Flux<Person>` are returned instead of `Person` and `List<Person>` respectively.

Finally to put it all together we need to create the main application and using the `CommandLineRunner` we can give the code a quick trial run.

```java

@SpringBootApplication
public class Application implements CommandLineRunner {

  @Autowired private PersonRepository personRepository;

  public static void main(String args[]) {
    SpringApplication.run(Application.class);
  }

  @Override
  public void run(String args[]) {

    final Person johnAoe = new Person("john", "aoe", LocalDateTime.now(), "loser", 0);
    final Person johnBoe = new Person("john", "boe", LocalDateTime.now(), "a bit of a loser", 10);
    final Person johnCoe = new Person("john", "coe", LocalDateTime.now(), "average", 100);
    final Person johnDoe = new Person("john", "doe", LocalDateTime.now(), "winner", 1000);

    personRepository.saveAll(Flux.just(johnAoe, johnBoe, johnCoe, johnDoe)).subscribe();

    personRepository
        .findByFirstName("john")
        .log()
        .map(Person::getSecondName)
        .subscribe(System.out::println);

    personRepository
        .findOneByFirstName("john")
        .log()
        .map(Person::getId)
        .subscribe(System.out::println);
  }
}
```

Running this piece of code creates some initial data and then retrieves it. `log` is called to demonstrate what is going on inside the reactive streams and the output of the streams are printed to the console using the `subscribe` method along with the Method Reference of `System.out::println`.

```java
2017-07-16 16:44:09.201 INFO 13476 --- [ main] reactor.Flux.OnErrorResume.1 : onSubscribe(FluxOnErrorResume.ResumeSubscriber)
2017-07-16 16:44:09.208 INFO 13476 --- [ main] reactor.Flux.OnErrorResume.1 : request(unbounded)
2017-07-16 16:44:09.242 INFO 13476 --- [ Thread-4] reactor.Flux.OnErrorResume.1 : onNext(Person(firstName=john, secondName=aoe, profession=loser, salary=0))
aoe
2017-07-16 16:44:09.243 INFO 13476 --- [ Thread-4] reactor.Flux.OnErrorResume.1 : onNext(Person(firstName=john, secondName=boe, profession=a bit of a loser, salary=10))
boe
2017-07-16 16:44:09.244 INFO 13476 --- [ Thread-4] reactor.Flux.OnErrorResume.1 : onNext(Person(firstName=john, secondName=coe, profession=average, salary=100))
coe
2017-07-16 16:44:09.245 INFO 13476 --- [ Thread-4] reactor.Flux.OnErrorResume.1 : onNext(Person(firstName=john, secondName=doe, profession=winner, salary=1000))
doe
2017-07-16 16:44:09.247 INFO 13476 --- [ Thread-4] reactor.Flux.OnErrorResume.1 : onComplete()
2017-07-16 16:44:09.254 INFO 13476 --- [ main] reactor.Mono.OnErrorResume.2 : onSubscribe(FluxOnErrorResume.ResumeSubscriber)
2017-07-16 16:44:09.255 INFO 13476 --- [ main] reactor.Mono.OnErrorResume.2 : request(unbounded)
2017-07-16 16:44:09.260 INFO 13476 --- [ Thread-4] reactor.Mono.OnErrorResume.2 : onNext(Person(firstName=john, secondName=aoe, profession=loser, salary=0))
596b89c97ab38934a404a80c
2017-07-16 16:44:09.260 INFO 13476 --- [ Thread-4] reactor.Mono.OnErrorResume.2 : onComplete()
```

Hopefully you can get the gist of what is going on by looking in the console output, although if you reading this from my personal blog it might look like gibberish and I cannot for the life of me get it to display properly... In case you cannot read it or simply want clarification, `onSubscribe` is output due to calling `subscribe` onto one of the Reactive Streams triggering a `request` to retrieve elements from the stream and for each element `onNext` is called, finally after the last element is received `onComplete` is called. Stuck in between these log messages are the print lines that were output from the `subscribe` method.

In conclusion getting up a running using Reactive Streams with Spring Data and MongoDB is no harder than using their non reactive counterparts. All we need to do is add a small amount of extra configuration and insert the word "reactive" into a few class and interface names and use the `Flux` and `Mono` types (from Reactor) instead of directly returning a list or object.

The code used in this post can be found on my [GitHub](https://github.com/lankydan/spring-data-reactive-mongodb).

If you found this post helpful, please share it and if you want to keep up with my latest posts then you can follow me on Twitter at [@LankyDanDev](https://twitter.com/LankyDanDev).