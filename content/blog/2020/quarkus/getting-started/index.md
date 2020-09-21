---
title: Building a REST API with Quarkus
date: "2020-09-21"
published: true
tags: [java, quarkus]
cover_image: blog-card.png
github_url: https://github.com/lankydan/learning-quarkus
# series: Quarkus
---

Quarkus is a Java framework designed to run within containers. Focusing on fast start-up times and low memory usage making it more suitable to run within container orchestration platforms like Kubernetes.

I wanted to write about Quarkus for a while now, and have finally found the time to do so.

The content of this post will focus on writing a simple REST API using Quarkus. I will not explain how Quarkus works, because, well, I haven't put the time in yet to do so correctly. Hopefully, I can rectify this in future posts. Therefore, if you want more information about Quarkus, I suggest you browse their [docs](https://quarkus.io/get-started/). So far, I have found them detailed, well written, and I will personally continue using them while I explore Quarkus further.

## Creating a project

Quarkus provides a maven command to bootstrap your projects, for example (the below works for Linux and MacOS, see the [Quarkus - Getting started guide](https://quarkus.io/guides/getting-started#bootstrapping-the-project) for more information):

```sh
mvn io.quarkus:quarkus-maven-plugin:1.7.2.Final:create \
    -DprojectGroupId=dev.lankydan \
    -DprojectArtifactId=quarkus \
    -DclassName="dev.lankydan.web.people.PersonResource" \
    -Dpath="/hello"
```

This generates a basic project with a HTTP endpoint in `PersonResource` with the path `hello`, along with several resources to build and run your application. In fact, you should have enough at this point to run the generated code, both locally and inside a container.

A `pom.xml` is included that contains the required dependencies. You will need to add to this if you want to write anything past a hello world example.

By running (from inside your project):

```sh
./mvnw quarkus:list-extensions
```

You can see the Quarkus dependencies/extensions available to your project. 

Then you can add an extension using a command like the one below:

```sh
./mvnw quarkus:add-extension -Dextensions="hibernate-validator"
```

The other option is to add it manually as I would typically do when sorting out my dependencies. Just thought I'd mention the `add-extension` command as I hadn't actually come across this method of dependency management when using Maven.

> I keep mentioning Maven, but there is no reason you can't using something else, such as Gradle.

## Quarkus uses JAX-RS for its REST capabilities

Quarkus follows the [JAX-RS](https://www.baeldung.com/jax-rs-spec-and-implementations) specification with [Resteasy](https://resteasy.github.io/) providing its implementation. If you have worked with Java for a reasonable time, you have probably seen or written code that follows the JAX-RS spec. And if you haven't, you probably will at some point. I haven't needed to use it before myself (I tend to use Spring when in Java land) so it is reasonably new to me. Anyway, in general, you can implement most of a simple REST API by relying on a few annotations.

## Quarkus uses CDI beans for dependency injection

Quarkus' dependency solution is based on the [CDI](https://docs.jboss.org/cdi/spec/2.0/cdi-spec.html) (Context and Dependency injection) specification. It should be noted that Quarkus does not provide a full CDI implementation, meaning that there will be limitations compared to other frameworks that you might have used. More information can be found in [Quarkus' CDI reference](https://quarkus.io/guides/cdi-reference) and their [Introduction to CDI](https://quarkus.io/guides/cdi).

## Implementing a REST API

I have put together an example REST API that manages people. I mean, the purpose of the API doesn't really matter, it's just an example after all. Here comes a long chunk of code:

```java
@Path("/people")
public class PersonResource {

  private final PersonRepository personRepository;

  public PersonResource(PersonRepository personRepository) {
    this.personRepository = personRepository;
  }

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  public List<Person> all() {
    return personRepository.findAll();
  }

  @GET
  @Path("/{id}")
  @Produces(MediaType.APPLICATION_JSON)
  public Person get(@PathParam("id") UUID id) {
    return personRepository.findById(id);
  }

  @POST
  @Produces(MediaType.APPLICATION_JSON)
  public Person post(Person person) {
    return personRepository.insert(
        new Person(UUID.randomUUID(), person.getName(), person.getAge())
    );
  }

  @PUT
  @Path("/{id}")
  @Produces(MediaType.APPLICATION_JSON)
  public Person put(@PathParam("id") UUID id, Person person) {
    if (personRepository.findById(id) == null) {
      throw new PersonNotFoundException(id);
    }
    return personRepository.update(new Person(id, person.getName(), person.getAge()));
  }

  @DELETE
  @Path("/{id}")
  @Produces(MediaType.APPLICATION_JSON)
  public void delete(@PathParam("id") UUID id) {
    if (personRepository.findById(id) == null) {
      throw new PersonNotFoundException(id);
    }
    personRepository.deleteById(id);
  }
}
```

As I mentioned earlier, Quarkus uses Resteasy as its JAX-RS implementation. All of the annotations in this class are related to JAX-RS. Let's have a quick look at one of the functions:

```java
@GET
@Path("/{id}")
@Produces(MediaType.APPLICATION_JSON)
public Person get(@PathParam("id") UUID id) {
  return personRepository.findById(id);
}
```

- `@GET` specifies that the method handles GET HTTP requests.
- `@Path("/{id}")` and `@PathParam` work together to take the HTTP path variable `id` and use it as the endpoint's input
- `@Produces(MediaType.APPLICATION_JSON)` denotes the type of data that the endpoint returns as JSON

That's enough about annotations. The rest of the method consists of finding the `Person` matching the input `id` and returning it to whatever called the endpoint. Instead of returning a `Person` directly, you could use a `Response` object, but I wanted to keep it simple and easier to read.

### JSON serialization

You have a choice between using [JSON-B](http://json-b.net/) or [Jackson](https://github.com/FasterXML/jackson) for your serialization. Personally, I tend to use Jackson so I went ahead and plugged it in. You will need to add the extension for whichever you choose:

```xml
<dependency>
  <groupId>io.quarkus</groupId>
  <artifactId>quarkus-resteasy-jackson</artifactId>
</dependency>
```

Or via the command:

```sh
./mvnw quarkus:add-extension -Dextensions="resteasy-jackson"
```

> Replace "jackson" with "jsonb" to switch over to JSON-B

## Connecting to a database using JDBC

This API is not going to do anything useful if it isn't persisting data somewhere.

Quarkus provides JDBC implementations for connecting to databases. I chose to use Postgres for this project's database, but you can obviously use whatever suits your needs. More information can be found in [Quarkus' data source documentation](https://quarkus.io/guides/datasource#jdbc-datasource-2).

The first thing you need to add to connect to a database, is a JDBC driver dependency:

```xml
<dependency>
  <groupId>io.quarkus</groupId>
  <artifactId>quarkus-jdbc-postgresql</artifactId>
</dependency>
```

You could also run:


```sh
./mvnw quarkus:add-extension -Dextensions="jdbc-postgresql"
```

Then add properties specifying the connection type and the details (to your `application.properties`):

```properties
quarkus.datasource.db-kind=postgresql
# Change this part to match your connection details!
quarkus.datasource.jdbc.url=jdbc:postgresql://localhost:5432/mytestdb
quarkus.datasource.username=admin
quarkus.datasource.password=admin
```

### Connection pooling

You don't want to directly manage the database connections yourself (I assume so anyway). 

Quarkus' _preferred_ JDBC data source and connection pooling library is [Agroal](https://agroal.github.io/). Below is a quote from the [Quarkus data source documentation](https://quarkus.io/guides/datasource#jdbc-datasource-2).

> Agroal is a modern, light weight connection pool implementation designed for very high performance and scalability, and features first class integration with the other components in Quarkus, such as security, transaction management components, health metrics.

What this means for you:

- Add the Agroal extension to your dependencies:

    ```xml
    <dependency>
      <groupId>io.quarkus</groupId>
      <artifactId>quarkus-agroal</artifactId>
    </dependency>
    ```

  Or run:

    ```sh
    ./mvnw quarkus:add-extension -Dextensions="agroal"
    ```

- Inject the `DataSource` that it initialises into your code (either directly via `AgroalDataSource` or using the `DataSource` interface).

### Creating a repository

Once you have sorted out the data source connection and have enabled connection pooling, you can now start writing queries. Below is a slimmed-down version of the `PersonRepository` since its using raw JDBC meaning that the code is quite lengthy and duplicated between functions:

```java
@ApplicationScoped
public class PersonRepository {

  private static final String FIND_BY_ID = "SELECT * FROM people WHERE id = ?";

  private final DataSource dataSource;

  public PersonRepository(DataSource dataSource) {
    this.dataSource = dataSource;
  }

  public Person findById(UUID id) {
    try (Connection connection = dataSource.getConnection();
        PreparedStatement statement = connection.prepareStatement(FIND_BY_ID)) {
      statement.setObject(1, id);
      try (ResultSet resultSet = statement.executeQuery()) {
        if (resultSet.next()) {
          return new Person(
              UUID.fromString(resultSet.getString("id")),
              resultSet.getString("name"),
              resultSet.getInt("age"));
        }
      }
    } catch (SQLException e) {
      throw new PersistenceException(e);
    }
    return null;
  }
}
```

The main take away of this snippet is the usage of the `DataSource` which Agroal provided the implementation for. You can inject it into your components after only needing to include the dependencies for a JDBC driver and Agroal itself. In regards to the JDBC code, more information on general JDBC usage can be found [here](https://www.baeldung.com/java-jdbc).

## Running the application

To run a Quarkus application, execute:

```sh
./mvnw compile quarkus:dev
```

This runs the application in _dev_ mode, which enables hot-reloading. Making your development experience a bit smoother. Although, I did find it hard to break the habit of restarting my application after every code change...

To run your application for real, or _non dev_ mode, you need to build the application's jar and run it. You can do this using:

```sh
./mvnw package
java -jar target/quarkus-1.0-SNAPSHOT-runner.jar
```

> `./mvnw package` places the generated jar in the target directory

If you used the command I showed at the beginning of this post to generate your project, you would have a `README.md` containing all this information. Including how to construct a native executable and running your Quarkus application within a container. I will cover some of this in future blog posts.

## Summary

You should now have a good idea on how to write a REST API using Quarkus. Like most other frameworks, you can leverage dependencies to quickly and effectively build your applications. Quarkus allows you to do the same. That can be seen by the number of times I told you to add a new dependency! 

Bringing the focus back onto what Quarkus provides you, remember it's a framework specialising on fast start-up times and low memory usage. I purposely left further discussion on these factors out to allow the post to focus on building an application using Quarkus, which is pretty much the same as building any REST application that uses JAX-RS. So when developers/engineers, like you, search for how to build a REST API using Quarkus, they can see that it is nothing alien. I will cover the benefits of using Quarkus in future content

I have left parts out to not distract from the main content, but you can find all of the code I used to create the example in my [GitHub repository](https://github.com/lankydan/learning-quarkus).

----

If you enjoyed this post or found it helpful (or both) then please feel free to follow me on Twitter at [@LankyDanDev](https://twitter.com/LankyDanDev) and remember to share with anyone else who might find this useful!