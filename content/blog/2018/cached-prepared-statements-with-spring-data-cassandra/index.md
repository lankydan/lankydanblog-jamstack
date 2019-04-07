---
title: Cached Prepared Statements with Spring Data Cassandra
date: "2018-10-23"
published: true
tags: [spring, spring data, spring boot, spring data cassandra, cassandra, java]
canonical_url: https://lankydanblog.com/2018/10/23/cached-prepared-statements-with-spring-data-cassandra/
cover_image: ./spring-data-city.png
include_date_in_url: true
github_url: https://github.com/lankydan/spring-data-cassandra-prepared-statements
---

Today I have a short post on using Prepared Statements in Spring Data Cassandra. Spring provides you with some utilities to make using Prepared Statements easier rather than relying on registering queries manually yourself with the Datastax Java Driver. The Spring code provides a cache to store prepared statements that are frequently used. Allowing you to execute your queries via the cache which either retrieves the prepared query from the cache or adds a new one before executing it.

To keep this short we should probably start looking at some code.

### Dependencies

```xml
<parent>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-parent</artifactId>
  <version>2.0.5.RELEASE</version>
</parent>

<dependencies>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-cassandra</artifactId>
  </dependency>
</dependencies>
```

Using Spring Boot `2.0.5.RELEASE` will pull in `2.0.10.RELEASE` of Spring Data Cassandra.

### Using Prepared Statements

Let's go straight in:

```java
@Repository
public class PersonRepository extends SimpleCassandraRepository<Person, PersonKey> {

  private final Session session;
  private final CassandraOperations cassandraTemplate;
  private final PreparedStatementCache cache = PreparedStatementCache.create();

  public PersonRepository(
      Session session,
      CassandraEntityInformation entityInformation,
      CassandraOperations cassandraTemplate) {
    super(entityInformation, cassandraTemplate);
    this.session = session;
    this.cassandraTemplate = cassandraTemplate;
  }

  // using ORM
  public List<Person> findByFirstNameAndDateOfBirth(String firstName, LocalDate dateOfBirth) {
    return cassandraTemplate
        .getCqlOperations()
        .query(
            findByFirstNameAndDateOfBirthQuery(firstName, dateOfBirth),
            (row, rowNum) -> cassandraTemplate.getConverter().read(Person.class, row));
  }

  private BoundStatement findByFirstNameAndDateOfBirthQuery(
      String firstName, LocalDate dateOfBirth) {
    return CachedPreparedStatementCreator.of(
            cache,
            select()
                .all()
                .from("people_by_first_name")
                .where(eq("first_name", bindMarker("first_name")))
                .and(eq("date_of_birth", bindMarker("date_of_birth"))))
        .createPreparedStatement(session)
        .bind()
        .setString("first_name", firstName)
        .setDate("date_of_birth", toCqlDate(dateOfBirth));
  }

  private com.datastax.driver.core.LocalDate toCqlDate(LocalDate date) {
    return com.datastax.driver.core.LocalDate.fromYearMonthDay(
        date.getYear(), date.getMonth().getValue(), date.getDayOfMonth());
  }

  // without ORM
  public List<Person> findByFirstNameAndDateOfBirthWithoutORM(
      String firstName, LocalDate dateOfBirth) {
    return cassandraTemplate
        .getCqlOperations()
        .query(
            findByFirstNameAndDateOfBirthQuery(firstName, dateOfBirth),
            (row, rowNum) -> convert(row));
  }

  private Person convert(Row row) {
    return new Person(
        new PersonKey(
            row.getString("first_name"),
            toLocalDate(row.getDate("date_of_birth")),
            row.getUUID("person_id")),
        row.getString("last_name"),
        row.getDouble("salary"));
  }

  private LocalDate toLocalDate(com.datastax.driver.core.LocalDate date) {
    return LocalDate.of(date.getYear(), date.getMonth(), date.getDay());
  }
}
```

There is a reasonable amount of boilerplate code here so we can gain access to Spring Data's ORM. I have also provided code to demonstrate how to achieve the same goal without using the ORM (well mapping straight from query to an object manually anyway).

Let's look at one of the methods more closely:

```java
public List<Person> findByFirstNameAndDateOfBirth(String firstName, LocalDate dateOfBirth) {
  return cassandraTemplate
      .getCqlOperations()
      .query(
          findByFirstNameAndDateOfBirthQuery(firstName, dateOfBirth),
          (row, rowNum) -> cassandraTemplate.getConverter().read(Person.class, row));
}

private BoundStatement findByFirstNameAndDateOfBirthQuery(
    String firstName, LocalDate dateOfBirth) {
  return CachedPreparedStatementCreator.of(
          cache,
          select()
              .all()
              .from("people_by_first_name")
              .where(eq("first_name", bindMarker("first_name")))
              .and(eq("date_of_birth", bindMarker("date_of_birth"))))
      .createPreparedStatement(session)
      .bind()
      .setString("first_name", firstName)
      .setDate("date_of_birth", toCqlDate(dateOfBirth));
}
```

`CachedPreparedStatementCreator` does exactly what it says... It creates cached Prepared Statements. The `of` method takes in the `cache` defined when the bean is instantiated and creates a new query as defined by the second parameter. If the query is one that has already been registered recently, i.e it is in the cache already. Then the query is pulled from there rather than going through the whole process of registering a new statement.

The query passed in is a `RegularStatement` which is converted to a `PreparedStatement` by calling `createPreparedStatement` (duh I guess). We are now able to bind values to query so it actually does something useful.

In terms of caching Prepared Statements, that is all you have to do. There are other ways to do it, for example, you could use the `PreparedStatementCache` manually or define your own cache implementation. Whatever floats your boat.

You have now reached the end of this short post, hopefully, it actually contained enough information to be useful...

In this post, we covered how to use the `CachedPreparedStatementCreator` to create and put Prepared Statements into a cache for faster execution at a later time. Using the classes Spring Data provides us, we can reduce the amount of code that we need to write.

The code used in this post can be found on my [GitHub](https://github.com/lankydan/spring-data-cassandra-prepared-statements).

If you found this post helpful, you can follow me on Twitter at [@LankyDanDev](http://www.twitter.com/LankyDanDev) to keep up with my new posts.
