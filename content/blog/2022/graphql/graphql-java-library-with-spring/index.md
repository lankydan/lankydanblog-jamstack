---
title: Using GraphQL Java with Spring
date: "2021-09-26"
published: true
tags: [graphql, graphql-java, spring, java, kotlin]
cover_image: blog-card.png
github_url: https://github.com/lankydan/spring-kotlin-graphql
---

[GraphQL Java](https://github.com/graphql-java/graphql-java) is one of the most popular GraphQL server side implementations for Java that I've found with over 5k stars (at the time of writing). If you're planning to expose a GraphQL API from a Java or JVM application, then this is a good library to start using.

In this blog post I will cover how to use GraphQL Java within a Spring application. GraphQL Java does have their own [official documentation covering this subject](https://www.graphql-java.com/tutorials/getting-started-with-spring-boot/), however I found it a bit too simplistic which made it harder for me to wrap my head around it. I hope that you don't think the same about the content of this post, although I guess you could write your own that is even more complicated than my examples!

I'll also give you a heads up to the fact that I have written my examples in Kotlin, although I tried to keep it friendly for Java readers.

I will also be writing this from the assumption that your understand some of the basics of GraphQL. I won't be covering anything extremely complicated so the basics will give you a good base for the content of this blog post. Knowing how to create a schema type and a query that does nothing fancy will be all you need. You can find this information from the official [graphql.org](https://graphql.org/learn/) site.

## The schema we'll use

Below is the schema that we'll use throughout this post:

```
type Query {
    people: [Person]
    peopleByFirstName(firstName: String): [Person]
    personById(id: ID): Person
}

type Person {
    id: ID,
    firstName: String,
    lastName: String
    relationships: [Relationship]
}

type Relationship {
    relation: Person,
    relationship: String
}
```

I'll cover how we register the schema later on, for now knowing the shape of the types in the schema will set up the following sections.

## Writing `DataFetcher`s to reply to queries

GraphQL Java uses `DataFetcher`s to define the code that executes when an incoming query is processed.

In simple terms, `DataFetcher` fetch data to include in the result of a query.

I've included the interface below:

```java
/**
 * A data fetcher is responsible for returning a data value back for a given graphql field.  The graphql engine
 * uses data fetchers to resolve / fetch a logical field into a runtime object that will be sent back as part
 * of the overall graphql {@link graphql.ExecutionResult}
 *
 * In other implementations, these are sometimes called "Resolvers" or "Field Resolvers", because that is there function,
 * they resolve a logical graphql field into an actual data value.
 *
 * @param <T> the type of object returned. May also be wrapped in a {@link graphql.execution.DataFetcherResult}
 */
@PublicSpi
public interface DataFetcher<T> {

    /**
     * This is called by the graphql engine to fetch the value.  The {@link graphql.schema.DataFetchingEnvironment} is a composite
     * context object that tells you all you need to know about how to fetch a data value in graphql type terms.
     *
     * @param environment this is the data fetching environment which contains all the context you need to fetch a value
     *
     * @return a value of type T. May be wrapped in a {@link graphql.execution.DataFetcherResult}
     *
     * @throws Exception to relieve the implementations from having to wrap checked exceptions. Any exception thrown
     *                   from a {@code DataFetcher} will eventually be handled by the registered {@link graphql.execution.DataFetcherExceptionHandler}
     *                   and the related field will have a value of {@code null} in the result.
     */
    T get(DataFetchingEnvironment environment) throws Exception;


}
```

There are two ways that implementations of `DataFetcher` can be used.

- To respond directly to a query.
- To return data for a specific field in a schema type.

How a `DataFetcher` is registered determines which path it goes down:

- Respond directly to a query - Registered with the name of the query.
- Return data for a specific field in a schema type - Registered with the schema type name and the name of the field.

Trying to write this out in a way that makes sense has been challenging, I believe the following code snippets should be easier to understand.

To simplify the process of registering `DataFetcher`s I added my own custom interface, `TypedDataFetcher`:

```kotlin
/**
 * [TypedDataFetcher] is a instance of a [DataFetcher] that specifies schema types and fields it processes.
 *
 * Instances of [TypedDataFetcher] are registered into an instance of [RuntimeWiring] after being picked up by Spring (the instances must be
 * annotated with @[Component] or a similar annotated to be injected).
 */
interface TypedDataFetcher<T> : DataFetcher<T> {

  /**
   * The type that the [TypedDataFetcher] handles.
   *
   * Use `Query` if the [TypedDataFetcher] responds to incoming queries.
   *
   * Use a schema type name if the [TypedDataFetcher] fetches data for a single field in the specified type.
   */
  val typeName: String

  /**
   * The field that the [TypedDataFetcher] should apply to.
   *
   * If the [typeName] is `Query`, then [fieldName] will be the name of the query the [TypedDataFetcher] handles.
   *
   * If the [typeName] is a schema type, then [fieldName] should be the name of a single field in [typeName].
   */
  val fieldName: String
}
```

The two properties on this interface allow an implementation to specify how they should be used.

To respond directly to a query:

```kotlin
class PeopleByFirstNameDataFetcher : TypedDataFetcher<List<PersonDTO>> {

  override val typeName = "Query"
  override val fieldName = "peopleByFirstName"

  override fun get(environment: DataFetchingEnvironment): List<PersonDTO> { /* Implementation */ }
}
```

The `DataFetcher`'s `typeName` should be set to `"Query"` and `fieldName` should be the name of the query to tie it to.

To link a `DataFetcher` to a specific field of a type:

```kotlin
class PersonRelationshipsDataFetcher : TypedDataFetcher<List<RelationshipDTO>> {

  override val typeName = "Person"
  override val fieldName = "relationships"

  override fun get(environment: DataFetchingEnvironment): List<RelationshipDTO> { /* Implementation */ }
}
```

The `DataFetcher`'s `typeName` should be set to the name of the schema type an `fieldName` should be the field found in that type.

Now that we've covered how to link `DataFetcher` to queries or type fields, what are the _real_ contents of a `DataFetcher` implementation; there's no use knowing how to register a `DataFetcher` if you don't know how to return something useful from one.

So let's fix that and expand on the `PeopleByFirstNameDataFetcher` shown a minute ago:

```kotlin
@Component
class PeopleByFirstNameDataFetcher(private val personRepository: PersonRepository) : TypedDataFetcher<List<PersonDTO>> {

  override val typeName = "Query"
  override val fieldName = "peopleByFirstName"

  override fun get(environment: DataFetchingEnvironment): List<PersonDTO> {
		// The argument is extracted from the GraphQL query
    return personRepository.findAllByFirstName(environment.getArgument("firstName"))
      .map { PersonDTO(it.id, it.firstName, it.lastName, emptyList()) }
  }
}
```

To help with the example, remember the `peopleByFirstName` query looks like:

```graphql
type Query {
    peopleByFirstName(firstName: String): [Person]
}
```

The query takes in `firstName` as an argument and returns an array of `Person`s. The `PeopleByFirstNameDataFetcher` will need to implement this behaviour.

To extract the `firstName` argument specified in the incoming query, `DataFetchingEnvironment.getArgument` is used:

```kotlin
environment.getArgument("firstName")
```

> `DataFetchingEnvironment` can get further information from the query but this is enough for this scenario.

Using the `firstName` from the GraphQL query, a SQL query is executed (abstracted away in `PersonRepository`). The returned data is then mapped to `PersonDTO`.

The conversion to `PersonDTO` is important, because its fields should resemble those of the `Person` GraphQL schema type.

I've include them both below:

```graphql
type Person {
    id: ID,
    firstName: String,
    lastName: String
    relationships: [Relationship]
}
```

```kotlin
data class PersonDTO(
  val id: UUID,
  val firstName: String,
  val lastName: String,
  val relationships: List<RelationshipDTO>
)
```




We will cover the code of registering `DataFetcher`s later on.

The GraphQL Java library code will 

Implementations of `DataFetcher` can do do one of the fo

Implementation of `DataFetcher` must be registered to a `RuntimeWiring` instance to be used, which we will cover later on.

When registering a `DataFetcher` i

- A query - The name of the query is registered