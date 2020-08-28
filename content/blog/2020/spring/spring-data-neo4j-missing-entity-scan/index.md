---
title: Missing @EntityScan annotation in Spring Data Neo4j
date: "2020-07-20"
published: true
tags: [spring, spring data, spring data neo4j, neo4j, java]
github_url: https://github.com/lankydan/spring-data-neo4j
cover_image: blog-card.png
---

Not including the `@EntityScan` annotation and specifying the correct packages in your Spring Data Neo4j application can cause the following error:

```javastacktrace
java.lang.ArrayIndexOutOfBoundsException: Index 0 out of bounds for length 0
	at org.neo4j.ogm.context.EntityRowModelMapper.extractColumnValue(EntityRowModelMapper.java:75) ~[neo4j-ogm-core-3.2.12.jar:3.2.12]
	at org.neo4j.ogm.context.EntityRowModelMapper.map(EntityRowModelMapper.java:64) ~[neo4j-ogm-core-3.2.12.jar:3.2.12]
	at org.neo4j.ogm.session.delegates.ExecuteQueriesDelegate.lambda$executeAndMap$1(ExecuteQueriesDelegate.java:151) ~[neo4j-ogm-core-3.2.12.jar:3.2.12]
	at org.neo4j.ogm.session.Neo4jSession.doInTransaction(Neo4jSession.java:590) ~[neo4j-ogm-core-3.2.12.jar:3.2.12]
	at org.neo4j.ogm.session.Neo4jSession.doInTransaction(Neo4jSession.java:564) ~[neo4j-ogm-core-3.2.12.jar:3.2.12]
	at org.neo4j.ogm.session.delegates.ExecuteQueriesDelegate.executeAndMap(ExecuteQueriesDelegate.java:138) ~[neo4j-ogm-core-3.2.12.jar:3.2.12]
	at org.neo4j.ogm.session.delegates.ExecuteQueriesDelegate.query(ExecuteQueriesDelegate.java:111) ~[neo4j-ogm-core-3.2.12.jar:3.2.12]
	at org.neo4j.ogm.session.Neo4jSession.query(Neo4jSession.java:425) ~[neo4j-ogm-core-3.2.12.jar:3.2.12]
	at java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method) ~[na:na]
	at java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62) ~[na:na]
	at java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43) ~[na:na]
	at java.base/java.lang.reflect.Method.invoke(Method.java:566) ~[na:na]
	at org.springframework.util.ReflectionUtils.invokeMethod(ReflectionUtils.java:282) ~[spring-core-5.2.7.RELEASE.jar:5.2.7.RELEASE]
	at org.springframework.data.neo4j.transaction.SharedSessionCreator$SharedSessionInvocationHandler.lambda$invoke$1(SharedSessionCreator.java:121) ~[spring-data-neo4j-5.3.1.RELEASE.jar:5.3.1.RELEASE]
	at org.springframework.data.neo4j.transaction.SharedSessionCreator$SharedSessionInvocationHandler.invokeInTransaction(SharedSessionCreator.java:159) ~[spring-data-neo4j-5.3.1.RELEASE.jar:5.3.1.RELEASE]
	at org.springframework.data.neo4j.transaction.SharedSessionCreator$SharedSessionInvocationHandler.invoke(SharedSessionCreator.java:123) ~[spring-data-neo4j-5.3.1.RELEASE.jar:5.3.1.RELEASE]
	at com.sun.proxy.$Proxy62.query(Unknown Source) ~[na:na]
	at org.springframework.data.neo4j.repository.query.GraphQueryExecution$CollectionExecution.execute(GraphQueryExecution.java:97) ~[spring-data-neo4j-5.3.1.RELEASE.jar:5.3.1.RELEASE]
	at org.springframework.data.neo4j.repository.query.GraphRepositoryQuery.doExecute(GraphRepositoryQuery.java:76) ~[spring-data-neo4j-5.3.1.RELEASE.jar:5.3.1.RELEASE]
	at org.springframework.data.neo4j.repository.query.AbstractGraphRepositoryQuery.execute(AbstractGraphRepositoryQuery.java:57) ~[spring-data-neo4j-5.3.1.RELEASE.jar:5.3.1.RELEASE]
	at org.springframework.data.repository.core.support.QueryExecutorMethodInterceptor$QueryMethodInvoker.invoke(QueryExecutorMethodInterceptor.java:195) ~[spring-data-commons-2.3.1.RELEASE.jar:2.3.1.RELEASE]
	at org.springframework.data.repository.core.support.QueryExecutorMethodInterceptor.doInvoke(QueryExecutorMethodInterceptor.java:152) ~[spring-data-commons-2.3.1.RELEASE.jar:2.3.1.RELEASE]
	at org.springframework.data.repository.core.support.QueryExecutorMethodInterceptor.invoke(QueryExecutorMethodInterceptor.java:130) ~[spring-data-commons-2.3.1.RELEASE.jar:2.3.1.RELEASE]
	at org.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:186) ~[spring-aop-5.2.7.RELEASE.jar:5.2.7.RELEASE]
	at org.springframework.transaction.interceptor.TransactionAspectSupport.invokeWithinTransaction(TransactionAspectSupport.java:367) ~[spring-tx-5.2.7.RELEASE.jar:5.2.7.RELEASE]
	at org.springframework.transaction.interceptor.TransactionInterceptor.invoke(TransactionInterceptor.java:118) ~[spring-tx-5.2.7.RELEASE.jar:5.2.7.RELEASE]
	at org.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:186) ~[spring-aop-5.2.7.RELEASE.jar:5.2.7.RELEASE]
	at org.springframework.dao.support.PersistenceExceptionTranslationInterceptor.invoke(PersistenceExceptionTranslationInterceptor.java:139) ~[spring-tx-5.2.7.RELEASE.jar:5.2.7.RELEASE]
	at org.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:186) ~[spring-aop-5.2.7.RELEASE.jar:5.2.7.RELEASE]
	at org.springframework.aop.interceptor.ExposeInvocationInterceptor.invoke(ExposeInvocationInterceptor.java:95) ~[spring-aop-5.2.7.RELEASE.jar:5.2.7.RELEASE]
	at org.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:186) ~[spring-aop-5.2.7.RELEASE.jar:5.2.7.RELEASE]
	at org.springframework.aop.framework.JdkDynamicAopProxy.invoke(JdkDynamicAopProxy.java:212) ~[spring-aop-5.2.7.RELEASE.jar:5.2.7.RELEASE]
	at com.sun.proxy.$Proxy76.findAll(Unknown Source) ~[na:na]
```

Yes, there is a lot there, and you will need to scroll across to see it. The primary information to extract is that there is an `ArrayIndexOutOfBoundsException` when trying to map a query's result to an object, as denoted by `EntityRowModelMapper.map` and `EntityRowModelMapper.extractColumnValue`.

The error doesn't really tell you much.

Thankfully, there is a high probability that you are missing the `@EntityScan` annotation. Adding this to one of your configuration files or your main class (if you're using Spring Boot, its likely to be the class you annotated with `@SpringBootApplication`) and specifying the `basePackages` or `basePackageClasses` should tell Spring where to find your entity and relationship classes.

You are more likely to see the error above if you are using Spring Boot and do not have your `@SpringBootApplication` class in one of the root packages of your application's code. If this is the case, and you are using Spring Data's inferred queries, you will also need to include the `@EnableNeo4jRepositories` annotation. It will face the same style of problem as the missing `@EntityScan`.

For clarity below is a quick example:

```java
package dev.lankydan.neo4j.application;

// Already needed to specify packages for other parts of the application
@SpringBootApplication(scanBasePackages = "dev.lankydan.neo4j")
@EnableNeo4jRepositories(basePackages = "dev.lankydan.neo4j")
public class Application implements CommandLineRunner {

  public static void main(String[] args) {
    SpringApplication.run(Application.class);
  }
}
```

This is the main class of the application, note that the `Application` class is located in `dev.lankydan.neo4j.application`.

Now for the entity itself:

```java
package dev.lankydan.neo4j.entity;

@NodeEntity(value = "City")
public class City {
  // contents of the class
}
```

The entity has been placed in `dev.lankydan.neo4j.entity`, which is not a sub-package of `dev.lankydan.neo4j.application`. Therefore, `Application` needs to be adjusted, giving the final iteration:

```java
package dev.lankydan.neo4j.application;

// Already needed to specify packages for other parts of the application
@SpringBootApplication(scanBasePackages = "dev.lankydan.neo4j")
@EnableNeo4jRepositories(basePackages = "dev.lankydan.neo4j")
// The [basePackages] could be specific like the one below or more general like the declarations above
@EntityScan(basePackages = "dev.lankydan.neo4j.entity")
public class Application implements CommandLineRunner {

  public static void main(String[] args) {
    SpringApplication.run(Application.class);
  }
}
```

Spring can now detect the entity classes and allow the application to run smoothly. A second option would be to move `Application` to a different package, closer to the root of the project. In this scenario, moving it to `dev.lankydan.neo4j` would do the trick.

Hopefully, this will help you remedy your code's issue.

----

If you enjoyed this post or found it helpful (or both) then please feel free to follow me on Twitter at [@LankyDanDev](https://twitter.com/LankyDanDev) and remember to share with anyone else who might find this useful!