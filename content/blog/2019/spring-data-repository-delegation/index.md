---
title: Augmenting a Spring Data repository through delegation
date: "2019-09-14"
published: true
tags: [spring, spring data, kotlin, java, r2dbc, spring data r2dbc, reactive, reactive streams, spring boot]
---

I have recently written several posts about Kotlin's delegation. In doing so, I realised a useful way to apply it to Spring Data repositories. Which would allow Spring Data to continue sprinkling some magic while providing a route for customisation. The code shown in this post is in Kotlin, but is still relevant to Java.

This post uses R2DBC, but the content is generic enough to be applicable to any Spring Data module.

Reading [Asynchronous RDBMS access with Spring Data R2DBC](https://lankydan.dev/2019/02/16/asynchronous-rdbms-access-with-spring-data-r2dbc) and [Class delegation in Kotlin](https://lankydan.dev/class-delegation-in-kotlin) would be beneficial here if you do not have much background knowledge in these areas.

As a recap. What is the magic that Spring Data provides?

Spring Data allows you to write an interface where you are only required to define the queries that you need. It will then do all the work of creating the implementation and injecting dependencies for you. This looks something like:

```kotlin
@Repository
interface PersonRepository : R2dbcRepository<Person, Int> {

  @Query("SELECT * FROM people WHERE age > $1")
  fun findAllByAgeGreaterThan(age: Int): Flux<Person>
}
```

> Since Spring Data R2DBC is being used, fully inferred queries are not yet fully supported. This is why the query is written out manually.

The downside to this is that it is creating an implementation based on an interface. Therefore, if you want to do any sort of customisation, you will need to create an instance of the interface yourself, inject in its dependencies and implement each query. For example:

```kotlin
class PersonRepositoryImpl(
  private val entity: RelationalEntityInformation<Person, Int>,
  private val databaseClient: DatabaseClient,
  converter: R2dbcConverter,
  private val accessStrategy: ReactiveDataAccessStrategy
) : SimpleR2dbcRepository<Person, Int>(entity, databaseClient, converter, accessStrategy),
  PersonRepository {

  override fun findAllByAgeGreaterThan(age: Int): Flux<Person> {

    val mapper: StatementMapper.TypedStatementMapper<Person> =
      accessStrategy.statementMapper.forType(entity.javaType)

    val selectSpec: StatementMapper.SelectSpec = mapper
      .createSelect(entity.tableName)
      .withProjection(accessStrategy.getAllColumns(entity.javaType))
      .withCriteria(Criteria.where("age").greaterThan(age))

    val operation: PreparedOperation<*> = mapper.getMappedObject(selectSpec)

    return databaseClient.execute().sql(operation).`as`(entity.javaType).fetch().all()
  }
}
```

> Yes, that query code is probably terrible, and I am sure you could do better. You get my point though.

The pain of creating this class can be removed by delegating to the repository Spring implemented based on your interface. You can then add all the customisations you need.

In Kotlin, this would look like:

```kotlin
@Repository
class DelegatingPersonRepository(private val delegate: PersonRepository) :
  PersonRepository by delegate {

  override fun <S : Person> save(objectToSave: S): Mono<S> {
    // override `save` implementation
  }

  // any other overrides (kotlin provides delegated implementations)
}
```

In Java, it is a bit more cumbersome but still easily achievable:

```java
@Repository
public class DelegatingPersonRepository implements PersonRepository {

  private final PersonRepository delegate;

  public DelegatingPersonRepository(PersonRepository delegate) {
    this.delegate = delegate;
  }

  @Override
  public Flux<Person> findAllByAgeGreaterThan(int age) {
    return delegate.findAllByAgeGreaterThan(age);
  }

  @Override
  public <S extends Person> Mono<S> save(S entity) {
    // override `save` implementation
  }

  // all other implementations of `PersonRepository` functions
}
```

> In both versions, `DelegatingPersonRepository` calls the implementation of `findAllByAgeGreaterThan` defined in `PersonRepository`. So far, no effort has been directly spent on writing a function to query a database.

When the `DelegatingPersonRepository` is used, all function calls that are not overridden will delegate to the implementation of `PersonRepository` that Spring created.

For someone like me, who doesn't really like putting together SQL queries and writing all the conversion code. Using delegation in this way really allows you to leverage the benefits of Spring Data while still giving you room to customise the outcome. The amount of code you save might not actually be that great. But, there is a considerable reduction in the effort required to put it together. Just let Spring do all the heavy lifting for you!

If you enjoyed this post or found it helpful (or both) then please feel free to follow me on Twitter at [@LankyDanDev](https://twitter.com/LankyDanDev) and remember to share with anyone else who might find this useful!
