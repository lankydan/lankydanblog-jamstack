---
title: Using GraphQL Java with Spring
date: "2022-01-10"
published: true
tags: [graphql, graphql-java, spring, java, kotlin]
cover_image: blog-card.png
github_url: https://github.com/lankydan/spring-kotlin-graphql
---

[GraphQL Java](https://github.com/graphql-java/graphql-java) is one of the most popular GraphQL server side implementations for Java that I've found with over 5k stars (at the time of writing). If you're planning to expose a GraphQL API from a Java or JVM application, then this is a good library to start using.

In this blog post I will cover how to use GraphQL Java within a Spring application that exposes an endpoint for clients to send queries to. GraphQL Java does have their own [official documentation covering this subject](https://www.graphql-java.com/tutorials/getting-started-with-spring-boot/), however I found it a bit too simplistic which made it harder for me to wrap my head around it. I hope that you don't think the same about the content of this post, although I guess you could write your own that is even more complicated than my examples!

I will be writing this from the assumption that your understand some of the basics of GraphQL. I won't be covering anything extremely complicated so the basics will give you a good base for the content of this blog post. Knowing how to create a schema type and a query that does nothing fancy will be all you need. You can find this information from the official [graphql.org](https://graphql.org/learn/) site.

Also, here's a heads up to the fact that I have written my examples in Kotlin, although I tried to keep it friendly for Java readers.

## Dependencies

Below are the Spring and GraphQL related dependencies used in this post:

```xml
<parent>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-parent</artifactId>
  <version>2.6.1</version>
</parent>

<dependencies>
  <dependency>
    <groupId>com.graphql-java</groupId>
    <artifactId>graphql-java</artifactId>
    <version>16.2</version>
  </dependency>
  <dependency>
    <groupId>com.graphql-java</groupId>
    <artifactId>graphql-java-spring-boot-starter-webmvc</artifactId>
    <version>2.0</version>
  </dependency>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <version>2.6.1</version>
  </dependency>
</dependencies>
```

## The schema we'll use

Below is the schema that we'll use throughout this post:

```graphql
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

## Fetching data with `DataFetcher`s

GraphQL Java uses `DataFetcher`s to fetch data to include in the result of a query. More specifically, a `DataFetcher` retrieves the data for a single field when a query is executed.

Every field has an assigned `DataFetcher`. When an incoming GraphQL query is received, the library will call the registered `DataFetcher` for each field in the query.

> The official `DataFetcher` documentation can be found [here](https://www.graphql-java.com/documentation/data-fetching).

It is worth pointing out now, as it personally caused me a lot of confusion to begin with, that a "field" can mean two things:

- The name of a query.
- The field of a schema type.

This is important as it means that a `DataFetcher` can be linked to a query. In fact, every query __must__ have an associated `DataFetcher`. Not doing this will cause GraphQL query requests to fail as there is no entry point to begin processing the query.

I keep mentioning `DataFetcher`s, but what are they really in terms of code? Below is the `DataFetcher` interface:

```java
public interface DataFetcher<T> {

  T get(DataFetchingEnvironment environment) throws Exception;
}
```

So when I say `DataFetcher` I'm really talking about implementations of the `DataFetcher` interface.

Lets look at an example `DataFetcher` that will respond to the `people` query:

```graphql
type Query {
    people: [Person]
}
```

The `DataFetcher` for this query:

```kotlin
@Component
class PeopleDataFetcher(private val personRepository: PersonRepository) : DataFetcher<List<PersonDTO>> {

  override fun get(environment: DataFetchingEnvironment): List<PersonDTO> {
    return personRepository.findAll().map { PersonDTO(it.id, it.firstName, it.lastName) }
  }
}
```

The `PeopleDataFetcher` returns a `List<PersonDTO>` to correspond to the `[Person]` specified as the turn type of the GraphQL query. The `PersonDTO` contains fields found in the `Person` GraphQL type.

When `DataFetcher.get` is executed it queries the database, maps the results to `PersonDTO`s and returns them.

When an incoming GraphQL query, like the following is received:

```graphql
query {
    people {
        firstName
        lastName
        id
    }
}
```

The following is returned after GraphQL Java has called the `PeopleDataFetcher`:

```json
{
  "data": {
    "people": [
      {
        "firstName": "John",
        "lastName": "Doe",
        "id": "00a0d4f2-637f-469c-9ecf-ba8839307996"
      },
      {
        "firstName": "Dan",
        "lastName": "Newton",
        "id": "27a08c14-d0ad-476c-ba09-9edad3e4c8f9"
      }
    ]
  }
}
```

That covers a first look at what `DataFetcher`s do, in following sections we'll expand on them to improve your understanding of GraphQL Java.

## The default `PropertyDataFatcher`

As mentioned in the previous section, every field must have an assigned `DataFetcher`. That means for the `Person` type:

```graphql
type Person {
  id: ID,
  firstName: String,
  lastName: String
  relationships: [Relationship]
}
```

You would need to associate `DataFetchers` to:

- `Person.id`
- `Person.firstName`
- `Person.lastName`
- `Person.relationships`

That seems a bit onerous, especially when you might be able to retrieve all of this data in one go. For example, if data was being retrieve from a database, then this could be the difference between 1 SQL query vs 4.

To resolve this, any field without an assigned `DataFetcher` uses the `PropertyDataFetcher` by default. The `PropertyDataFetcher` uses various methods (e.g. getters or keys in a map) to extract field values from the parent field (could be a query or schema type).

To provide a concrete example, previously the `PeopleDataFetcher` was used to respond to the `people` GraphQL query:

```graphql
type Query {
  people: [Person]
}

type Person {
  id: ID,
  firstName: String,
  lastName: String
  relationships: [Relationship]
}
```

```kotlin
@Component
class PeopleDataFetcher(private val personRepository: PersonRepository) : DataFetcher<List<PersonDTO>> {

  override fun get(environment: DataFetchingEnvironment): List<PersonDTO> {
    return personRepository.findAll().map { PersonDTO(it.id, it.firstName, it.lastName) }
  }
}
```

The `PeopleDataFetcher` returns a `PersonDTO` for each `Person` it finds as its response to the top level query. This can be thought of as the "parent field".

The GraphQL library will then move down to fetch values for each queried field in `Person`, for example `firstName` and `lastName`. By using the `PropertyDataFetcher`, it accesses each `PersonDTO` returned by the parent field's `DataFetcher` (`PeopleDataFetcher`) and extracts the values using each instances' getters.

The same process would occur when querying `Person.relationships`. The `DataFetcher` assigned to `Person.relationships` is called and then the `DataFetcher`s linked to `Relationship`s fields. If these are `PropertyDataFetcher`s then whatever object was returned when evaluating `Person.relationships` has values extracted from it that match the queried fields.

You might need to run that through your head a few times so it makes sense. I only properly understood this after debugging the library a little bit when my code wasn't working correctly.

## Writing a `DataFetcher` for a schema type's field

The `PeopleDataFetcher` we've seen throughout this post responds to a query. Now let's look at a custom `DataFetcher` that should be associated to a schema type's field.

The `PersonRelationshipsDataFetcher` fetches data for the `Person.relationships` field:

```kotlin
@Component
class PersonRelationshipsDataFetcher(
  private val relationshipRepository: RelationshipRepository
) : DataFetcher<List<RelationshipDTO>> {

  override fun get(environment: DataFetchingEnvironment): List<RelationshipDTO> {
    // Gets the object wrapping the [relationships] field
    // In this case a [PersonDTO] object.
    val source = environment.getSource<PersonDTO>()
    return relationshipRepository.findAllByPersonId(source.id).map {
      RelationshipDTO(
        relation = it.relatedPerson.toDTO(),
        relationship = it.relationship
      )
    }
  }
}
```

It looks similar to the `PeopleDataFetcher` we look at previously, except for the call to `DataFetchingEnvironment.getSource`. This method is what allows a `DataFetcher` to access the object returned by the `DataFetcher` associated to the parent field. After accessing this object, information is extracted from it (the person's id) to be used in the SQL query executed by the `PersonRelationshipsDataFetcher`.

## Writing a `DataFetcher` for a query containing an argument

Queries become far more useful when you can pass arguments into them.

Take the query:

```graphql
type Query {
  peopleByFirstName(firstName: String): [Person]
}
```

To handle this you'd want a `DataFetcher` like the one below:

```kotlin
@Component
class PeopleByFirstNameDataFetcher(private val personRepository: PersonRepository) : DataFetcher<List<PersonDTO>> {

  override fun get(environment: DataFetchingEnvironment): List<PersonDTO> {
		// The argument is extracted from the GraphQL query
    val argument = environment.getArgument<String>("firstName")
    return personRepository.findAllByFirstName(firstName)
      .map { PersonDTO(it.id, it.firstName, it.lastName, emptyList()) }
  }
}
```

The important method call here is to `DataFetchingEnvironment.getArgument`, which does as it says and extracts an argument from the incoming GraphQL query. Handily, `getArgument` allows you to specify the type the argument should be (so you don't have to convert it yourself). 

> `DataFetchingEnvironment` also contains a few other methods revolving around arguments, e.g. `getArguments` and `containsArgument`.

## Setting up a GraphQL instance

You've seen how to write a few `DataFetcher`s by this point, we now need to tie everything together by creating a `GraphQL` instance and registering an application's `DataFetcher`s.

The `@Configuration` code below does just that:

```kotlin
@Configuration
class GraphQLConfiguration(
  private val peopleByFirstNameDataFetcher: PeopleByFirstNameDataFetcher,
  private val peopleDataFetcher: PeopleDataFetcher,
  private val personByIdDataFetcher: PersonByIdDataFetcher,
  private val personRelationshipsDataFetcher: PersonRelationshipsDataFetcher
) {

  @Bean
  fun graphQL(): GraphQL {
    val typeRegistry: TypeDefinitionRegistry = SchemaParser().parse(readSchema())
    val runtimeWiring: RuntimeWiring = buildWiring()
    val graphQLSchema: GraphQLSchema =  SchemaGenerator().makeExecutableSchema(typeRegistry, runtimeWiring)
    return GraphQL.newGraphQL(graphQLSchema).build()
  }

  private fun schemaFile(): File {
    return this::class.java.classLoader.getResource("schema.graphqls")
      ?.let { url -> File(url.toURI()) }
      ?: throw IllegalStateException("The resource does not exist")
  }

  private fun buildWiring(): RuntimeWiring {
    return RuntimeWiring.newRuntimeWiring()
      .type(newTypeWiring("Query").dataFetcher("peopleByFirstName", peopleByFirstNameDataFetcher))
      .type(newTypeWiring("Query").dataFetcher("people", peopleDataFetcher))
      .type(newTypeWiring("Query").dataFetcher("personById", personByIdDataFetcher))
      .type(newTypeWiring("Person").dataFetcher("relationships", personRelationshipsDataFetcher))
      .build()
  }
}
```

The purpose of this `@Configuration` class is to create a `GraphQL` instance to that GraphQL Java uses. Further set up is not required as it will be picked up by Spring Boot's auto-configuration.

The first step of creating the `GraphQL` instance requires reading the application's GraphQL schema. `SchemaParser.parse` can take in `File`s, `InputStream`s, `Reader`s or `String`s which it parses (as the class name suggests) and returns a `TypeDefinitionRegistry` to be used later. In this application, the schema is defined in a resource file which gets fed into `SchemaParser.parse`. This is what allows the GraphQL library to understand incoming queries and what can or cannot be handled.

The `DataFetcher`s are then registered with a `RuntimeWiring` instance (through a `RuntimeWiring.Builder` returned by `RuntimeWiring.newRuntimeWiring`). Every time I mentioned "gets the `DataFetcher` associated to the field", this is where the association actually happens. I can stop hand waving all the time now since you've seen the code. 

Each `DataFetcher` in this example application is injected into the configuration class and linked to the `RuntimeWiring` instance through its `type` method. Each `TypeRuntimeWiring.Builder` instance (returned by `newTypeWiring`) requires 3 fundamental inputs:

- The name of the schema type (`"Query"` or a type name).
- The name of the field (query name or schema type field).
- The `DataFetcher` to wire calls to the type and field to.

After registering each `DataFetcher`, the `RuntimeWiring` instance is finalised using `build`.

Finally the `TypeDefinitionRegistry` and `RuntimeWiring` created previously are passed through a `SchemaGenerator` and then into `GraphQL.newGraphQL` to retrieve a fully functional `GraphQL` instance.

## Sending a GraphQL query to the application

With the setup complete the application now exposes a `/graphql` endpoint provided by the auto-configured code in `graphql-java-spring-boot-starter-webmvc`. This endpoint is where clients will send GraphQL queries to.

In this section, we'll look at how to send a query using cURL and Postman (which has GraphQL functionality) and view the data that is returned.

Tzhe query we are trying to send:

```graphql
query {
    peopleByFirstName(firstName: "Dan") {
        firstName
        lastName
        id
        relationships {
            relation {
                firstName
                lastName
            }
            relationship
        }
    }
}
```

- cURL:

  ```shell
  curl 'localhost:8080/graphql/' \
  -X POST \
  -H 'content-type: application/json' \
  --data '{ "query": "query { peopleByFirstName(firstName: \"Dan\") { firstName lastName id relationships { relation { firstName lastName } relationship }}}"}'
  ```

- Postman:

![GraphQL call using Postman](./postman-graphql-call.png)


Both of these methods return the same data (I would be worried if they didn't):

```json
{
  "data": {
    "peopleByFirstName": [
      {
        "firstName": "Dan",
        "lastName": "Newton",
        "id": "27a08c14-d0ad-476c-ba09-9edad3e4c8f9",
        "relationships": [
          {
            "relation": {
              "firstName": "Laura",
              "lastName": "So"
            },
            "relationship": "Wife"
          },
          {
            "relation": {
              "firstName": "Random",
              "lastName": "Person"
            },
            "relationship": "Friend"
          }
        ]
      },
      {
        "firstName": "Dan",
        "lastName": "Doe",
        "id": "3c07b717-8b9c-4d88-926f-c892be38ee85",
        "relationships": []
      },
    ]
  }
}
```

The most important factor here is that a `POST` request is used. It seems to be common place for GraphQL API to use `POST` requests for fetching and mutating data. This through me off for a while as the error I received from the `/graphql` endpoint added by the library didn't cause me to believe it was due to using the wrong HTTP verb. 

For clarity, using the wrong HTTP verb (e.g. a `GET`) leads to the following response and log line:

```json
{
    "timestamp": "2022-01-03T16:50:58.376+00:00",
    "status": 400,
    "error": "Bad Request",
    "path": "/graphql"
}
```

```log
Resolved [org.springframework.web.bind.MissingServletRequestParameterException: Required request parameter 'query' for method parameter type String is not present]
```

## Improving the registration of `DataFetcher`s

## Summary

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