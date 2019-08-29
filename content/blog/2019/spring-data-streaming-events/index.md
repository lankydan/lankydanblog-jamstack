---
title: Streaming live updates from a reactive Spring Data repository
date: "2019-08-29"
published: true
tags: [spring, spring data, kotlin, java, r2dbc, spring data r2dbc, reactive, reactive streams]
cover_image: ./title-card.png
---

This post details a naive implementation of _streaming_ updates from a database to any other components that are interested in that data. More precisely, how to alter a Spring Data R2DBC repository to emit events to relevant subscribers.

A little bit of background knowledge of R2DBC and Spring will be helpful for this post. My previous writings, [Asynchronous RDBMS access with Spring Data R2DBC](https://lankydan.dev/2019/02/16/asynchronous-rdbms-access-with-spring-data-r2dbc) and [Spring Data R2DBC for Microsoft SQL Server](https://lankydan.dev/spring-data-r2dbc-for-microsoft-sql-server) should help in that regard.

As I mentioned, this will be a naive implementation. Therefore, the code will not be anything fancy.

To do this, I hijacked a `SimpleR2dbcRepository` to create a repository implementation that emits an event every time a new record is persisted. New events are added to a `DirectProcessor` and sent to any `Publisher`s subscribed to it. This looks like:

```kotlin
class PersonRepository(
  entity: RelationalEntityInformation<Person, Int>,
  databaseClient: DatabaseClient,
  converter: R2dbcConverter,
  accessStrategy: ReactiveDataAccessStrategy
) : SimpleR2dbcRepository<Person, Int>(entity, databaseClient, converter, accessStrategy) {

  private val source: DirectProcessor<Person> = DirectProcessor.create<Person>()
  val events: Flux<Person> = source

  override fun <S : Person> save(objectToSave: S): Mono<S> {
    return super.save(objectToSave).doOnNext(source::onNext)
  }
}
```

The only function from `SimpleR2dbcRepository` that needs to be overridden is `save` (`saveAll` delegates to `save`). `doOnNext` is added to the original save call, which pushes a new event to the `source` (the `DirectorProcessor`) by calling `onNext`.

The `source` is cast to a `Flux` to prevent classes from outside of the repository from adding new events. Technically they can still add events, but they will need to cast it themselves.

As you might have noticed, the repository is taking a load of parameters and passing them into `SimpleR2dbcRepository`. An instance of the repository needs to be created manually as some of its dependencies cannot be injected in automatically:

```kotlin
@Configuration
class RepositoryConfiguration {

  @Bean
  fun personRepository(
    databaseClient: DatabaseClient,
    dataAccessStrategy: ReactiveDataAccessStrategy
  ): PersonRepository {
    val entity: RelationalPersistentEntity<Person> = dataAccessStrategy
      .converter
      .mappingContext
      .getRequiredPersistentEntity(Person::class.java) as RelationalPersistentEntity<Person>
    val relationEntityInformation: MappingRelationalEntityInformation<Person, Int> =
      MappingRelationalEntityInformation(entity, Int::class.java)
    return PersonRepository(
      relationEntityInformation,
      databaseClient,
      dataAccessStrategy.converter,
      dataAccessStrategy
    )
  }
}
```

At this point, everything is set up and ready to use. Below is an example of it working:

```kotlin
personRepository.events
  .doOnComplete { log.info("Events flux has closed") }
  .subscribe { log.info("From events stream - $it") }
// insert people records over time
MARVEL_CHARACTERS
  .toFlux()
  .delayElements(Duration.of(1, SECONDS))
  .concatMap { personRepository.save(it) }
  .subscribe()
```

Which outputs:

```java
29-08-2019 09:08:27.674 [reactor-tcp-nio-1]  From events stream - Person(id=481, name=Spiderman, age=18)
29-08-2019 09:08:28.550 [reactor-tcp-nio-2]  From events stream - Person(id=482, name=Ironman, age=48)
29-08-2019 09:08:29.555 [reactor-tcp-nio-3]  From events stream - Person(id=483, name=Thor, age=1000)
29-08-2019 09:08:30.561 [reactor-tcp-nio-4]  From events stream - Person(id=484, name=Hulk, age=49)
29-08-2019 09:08:31.568 [reactor-tcp-nio-5]  From events stream - Person(id=485, name=Antman, age=49)
29-08-2019 09:08:32.571 [reactor-tcp-nio-6]  From events stream - Person(id=486, name=Blackwidow, age=34)
29-08-2019 09:08:33.576 [reactor-tcp-nio-7]  From events stream - Person(id=487, name=Starlord, age=38)
29-08-2019 09:08:34.581 [reactor-tcp-nio-8]  From events stream - Person(id=488, name=Captain America, age=100)
29-08-2019 09:08:35.585 [reactor-tcp-nio-9]  From events stream - Person(id=489, name=Warmachine, age=50)
29-08-2019 09:08:36.589 [reactor-tcp-nio-10] From events stream - Person(id=490, name=Wasp, age=26)
29-08-2019 09:08:37.596 [reactor-tcp-nio-11] From events stream - Person(id=491, name=Winter Soldier, age=101)
29-08-2019 09:08:38.597 [reactor-tcp-nio-12] From events stream - Person(id=492, name=Black Panther, age=42)
29-08-2019 09:08:39.604 [reactor-tcp-nio-1]  From events stream - Person(id=493, name=Doctor Strange, age=42)
29-08-2019 09:08:40.609 [reactor-tcp-nio-2]  From events stream - Person(id=494, name=Gamora, age=29)
29-08-2019 09:08:41.611 [reactor-tcp-nio-3]  From events stream - Person(id=495, name=Groot, age=4)
29-08-2019 09:08:42.618 [reactor-tcp-nio-4]  From events stream - Person(id=496, name=Hawkeye, age=47)
29-08-2019 09:08:43.620 [reactor-tcp-nio-5]  From events stream - Person(id=497, name=Pepper Potts, age=44)
29-08-2019 09:08:44.627 [reactor-tcp-nio-6]  From events stream - Person(id=498, name=Captain Marvel, age=59)
29-08-2019 09:08:45.631 [reactor-tcp-nio-7]  From events stream - Person(id=499, name=Rocket Raccoon, age=30)
29-08-2019 09:08:46.637 [reactor-tcp-nio-8]  From events stream - Person(id=500, name=Drax, age=49)
29-08-2019 09:08:47.639 [reactor-tcp-nio-9]  From events stream - Person(id=501, name=Nebula, age=30)
```

A record is saved every second which matches up to the events coming out of the repository.

That's all there is to it, at least for this basic implementation. I am sure there is a lot more that could be done, but I would need to figure out how to do that first... To summarise, with a few additions, you can stream data inserted into your database to components that are interested in the records being added.

If you enjoyed this post or found it helpful (or both) then please feel free to follow me on Twitter at [@LankyDanDev](https://twitter.com/LankyDanDev) and remember to share with anyone else who might find this useful!
