---
title: Transaction savepoints in Spring JDBC
date: "2020-06-14"
published: true
tags: [spring, spring data, spring data jdbc, kotlin, java]
---

Savepoints allow you to create markers within a transaction which you can rollback to, without preventing the transaction from being committed at a later point. These can be treated like intermediate transactions within a single overarching transaction. At the end of the day, you either commit the transaction and persist all the changes to the database or rollback everything. Using savepoints, you can handle potential database errors and return to a safe point within the transaction and carry on.

This post will look at how you can use savepoints within Spring JDBC.

Spring provides a few options to manage savepoints within your transactions, we will look at the following choices:

- Using `JdbcTemplate`
- Using `TransactionTemplate`
- The `@Transactional` annotation

## Savepoints with JdbcTemplate

Let's start with the `JdbcTemplate`:

```kotlin
@Component
class PersonManager(private val jdbcTemplate: JdbcTemplate) {


  fun process() {
    jdbcTemplate.execute { connection: Connection ->
      connection.autoCommit = false

      connection.save(1, dan)
      connection.save(2, laura)

      val savepoint = connection.setSavepoint()
      try {
        connection.save(1, george)
      } catch (e: SQLException) {
        log.info("There was an exception, rolling back to savepoint: ${e.message}")
        connection.rollback(savepoint)
      } finally {
        connection.releaseSavepoint(savepoint)
      }
    }
  }

  private fun Connection.save(id: Int, person: Person) {
    prepareStatement("INSERT INTO people(id, name, age) VALUES (?, ?, ?)").apply {
      setInt(1, id)
      setString(2, person.name)
      setInt(3, person.age)
    }.executeUpdate()
  }
}
```

Which outputs the following (the same is output in all following sections of this post):

```
There was an exception, rolling back to savepoint: ERROR: duplicate key value violates unique constraint "people_pkey"
People => [Person(id=1, name=Dan, age=26), Person(id=2, name=Laura, age=25)]
```

Enabling savepoints using `JdbcTemplate` requires a bit of effort. You need to make sure that you disable the `Connection`'s `autoCommit` mode, otherwise you will see an error like the following:

```java
Caused by: org.springframework.jdbc.UncategorizedSQLException: ConnectionCallback; uncategorized SQLException; SQL state [25P01]; error code [0]; 
    Cannot establish a savepoint in auto-commit mode.; nested exception is org.postgresql.util.PSQLException: Cannot establish a savepoint in auto-commit mode.
    at org.springframework.jdbc.support.AbstractFallbackSQLExceptionTranslator.translate(AbstractFallbackSQLExceptionTranslator.java:89) ~[spring-jdbc-5.2.0.RELEASE.jar:5.2.0.RELEASE]
    at org.springframework.jdbc.support.AbstractFallbackSQLExceptionTranslator.translate(AbstractFallbackSQLExceptionTranslator.java:81) ~[spring-jdbc-5.2.0.RELEASE.jar:5.2.0.RELEASE]
    at org.springframework.jdbc.support.AbstractFallbackSQLExceptionTranslator.translate(AbstractFallbackSQLExceptionTranslator.java:81) ~[spring-jdbc-5.2.0.RELEASE.jar:5.2.0.RELEASE]
    at org.springframework.jdbc.core.JdbcTemplate.translateException(JdbcTemplate.java:1443) ~[spring-jdbc-5.2.0.RELEASE.jar:5.2.0.RELEASE]
    at org.springframework.jdbc.core.JdbcTemplate.execute(JdbcTemplate.java:336) ~[spring-jdbc-5.2.0.RELEASE.jar:5.2.0.RELEASE]
    at dev.lankydan.jdbc.PersonManager.processWithJdbcTemplate(Application.kt:73) ~[main/:na]
    at dev.lankydan.jdbc.PersonManager$$FastClassBySpringCGLIB$$56c95970.invoke(<generated>) ~[main/:na]
    at org.springframework.cglib.proxy.MethodProxy.invoke(MethodProxy.java:218) ~[spring-core-5.2.0.RELEASE.jar:5.2.0.RELEASE]
    at org.springframework.aop.framework.CglibAopProxy$DynamicAdvisedInterceptor.intercept(CglibAopProxy.java:685) ~[spring-aop-5.2.0.RELEASE.jar:5.2.0.RELEASE]
    at dev.lankydan.jdbc.PersonManager$$EnhancerBySpringCGLIB$$d54410c6.processWithJdbcTemplate(<generated>) ~[main/:na]
    at dev.lankydan.jdbc.Application.run(Application.kt:32) ~[main/:na]
    at org.springframework.boot.SpringApplication.callRunner(SpringApplication.java:784) [spring-boot-2.2.0.RELEASE.jar:2.2.0.RELEASE]
    ... 6 common frames omitted
```

After that is handled, you can create a savepoint using `Connection.setSavepoint`. 

SQL statements can then be executed as usual. Any pieces of code that you think are going to cause issues (but will only lead to soft failures) should be wrapped with a try/catch block. If any errors occur, they can then be handled within the catch. This is what the code example above demonstrates. 

An attempt to save a record with an ID that already exists is made thus, throwing an exception. Without the savepoint, this would put the transaction into a terminal state, preventing it from ever successfully committing. Instead, as long as the exception is caught, the transaction can be rolled back to the savepoint. This is achieved by calling `rollback` while referencing the savepoint. The transaction can then continue as usual and achieve its goal of committing its contents to the database.

Before committing the transaction, its worth releasing the savepoint using `releaseSavepont`. Saying that, not all the JDBC drivers actually support releasing savepoints. The Javadocs note that `SQLFeatureNotSupportedException` is thrown by drivers that do not support `releaseSavepoint`. So, you might need to keep your eye out for these potential errors.

## Savepoints with TransactionTemplate

`TransactionTemplate` works similarly to `JdbcTemplate` but with a greater focus on support for transactions, the name gives it away, right?

```kotlin
@Component
class PersonManager(
  private val jdbcTemplate: JdbcTemplate,
  private val transactionTemplate: TransactionTemplate
) {

  fun process() {
    transactionTemplate.execute { status: TransactionStatus ->
      jdbcTemplate.save(1, dan)
      jdbcTemplate.save(2, laura)

      val savepoint = status.createSavepoint()
      try {
        jdbcTemplate.save(1, george)
      } catch (e: DataAccessException) {
        // [DataAccessException] because spring converts the underlying [SQLException] inside of [update]
        log.info("There was an exception, rolling back to savepoint: ${e.message}")
        status.rollbackToSavepoint(savepoint)
      } finally {
        status.releaseSavepoint(savepoint)
      }
    }
  }

  private fun JdbcTemplate.save(id: Int, person: Person) {
    update("INSERT INTO people(id, name, age) VALUES (?, ?, ?)") { statement ->
      statement.setInt(1, id)
      statement.setString(2, person.name)
      statement.setInt(3, person.age)
    }
  }
}
```

This code is very similar to that shown in the `JdbcTemplate` example. The outcome is exactly the same, and with only a few differences between them. `TransactionTemplate` provides support for transactions which is not offered by `JdbcTemplate` without the code shown before.

To use savepoints with `TransactionTemplate`, you should interact with the `TransactionStatus` passed into the `execute` lambda. This allows you to create a savepoint using `createSavepoint`, rollback with `rollbackToSavepoint` and then release it by calling `releaseSavepoint`. Not much else to say really.

Note that `JdbcTemplate` is used within `TransactionTemplate.execute` and the underlying `Connection` is not being directly interacted with.

## Savepoints with @Transactional

This option is the one that stands out from the others. Focusing on creating and committing transactions through the use of an annotation:

```kotlin
@Component
class PersonManager(
  private val jdbcTemplate: JdbcTemplate,
  private val transactionalAnnotationManager: TransactionalAnnotationPersonManager
) {

  @Transactional
  fun process() {
    jdbcTemplate.save(1, dan)
    jdbcTemplate.save(2, laura)

    try {
      transactionalAnnotationManager.processWithTransactionalAnnotationSavepoint()
    } catch (e: DataAccessException) {
      log.info("There was an exception, rolling back to savepoint: ${e.message}")
    }
  }
}

@Component
class TransactionalAnnotationPersonManager(private val jdbcTemplate: JdbcTemplate) {

  // By default, auto rollbacks for runtime exceptions but not checked exceptions
  // [DataAccessException] is a runtime exception, hence the rollback
  @Transactional(propagation = Propagation.NESTED)
  fun processWithSavepoint() {
    jdbcTemplate.save(1, george)
  }
}

private fun JdbcTemplate.save(id: Int, person: Person) {
  update("INSERT INTO people(id, name, age) VALUES (?, ?, ?)") { statement ->
    statement.setInt(1, id)
    statement.setString(2, person.name)
    statement.setInt(3, person.age)
  }
}
```

This example looks nothing like the first two.

`@Transactional` enables transaction management starting from the first function called with the annotation. Subsequent calls to `JdbcTemplate` functions will be executed within a transaction created by the function annotated with `@Transactional`. This seems to be the recommended way of enabling transactions within Spring JDBC.

Enabling savepoints with `@Transactional` is a bit strange. To explain why, you first need a bit of background context. When a Spring component contains a function annotated with `@Transactional`, a proxy instance is generated that stands in front of the original class (`PersonManager` and `TransactionalAnnotationPersonManager` in the example above). Calls to these classes will instead communicate with the proxy, which wraps the original function calls in transactions. The proxy only intercepts calls from external classes. Any calls from other functions within the class will not apply the transaction wrapping that the proxy does.

This makes it harder to enable savepoints when using `@Transactional`. If there is a call to a function marked with `@Transactional(propagation = Propagation.NESTED)` (which is what denotes the use of a savepoint), it will not do anything unless called from an external class (outside the proxy). This is why there are two classes in the example. One creates the original, overarching transaction. The other will create an inner transaction (using a savepoint) when called from an existing transaction.

When you call functions in this particular way, savepoints and the overall transaction will be managed for you.

Despite there being two classes, the amount of code isn't particularly bad. That being said, its a bit confusing at first glance and it hides a lot behind a curtain while waving its hands and saying _"behold Spring's magic"_. I am generally okay with the Spring's magic, but this one was too much for me.

## Summary

Spring provides you with multiple ways to manage savepoints within transactions:

- Using `JdbcTemplate` and controlling the `Connection` gives you
- Leveraging `TransactionTemplate` and the abstraction it provides over the above
- Annotating functions with `@Transactional(propagation = Propagation.NESTED)` to have Spring sprinkle some magic for you

----

If you enjoyed this post or found it helpful (or both) then please feel free to follow me on Twitter at [@LankyDanDev](https://twitter.com/LankyDanDev) and remember to share with anyone else who might find this useful!