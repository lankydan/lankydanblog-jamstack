---
title: Missing DataSource in Quarkus
date: "2020-10-15"
published: true
tags: [java, quarkus]
cover_image: blog-card.png
---

If you see an error like this while developing a Quarkus application that uses Agroal as its `DataSource`:

```javastacktrace
ERROR [io.qua.dep.dev.IsolatedDevModeMain] (main) Failed to start quarkus: java.lang.RuntimeException: io.quarkus.builder.BuildException: Build failure: Build failed due to errors
    [error]: Build step io.quarkus.arc.deployment.ArcProcessor#validate threw an exception: javax.enterprise.inject.spi.DeploymentException: javax.enterprise.inject.UnsatisfiedResolutionException: Unsatisfied dependency for type javax.sql.DataSource and qualifiers [@Default]
    - java member: dev.lankydan.people.db.PersonRepository#<init>()
    - declared on CLASS bean [types=[dev.lankydan.people.db.PersonRepository, java.lang.Object], qualifiers=[@Default, @Any], target=dev.lankydan.people.db.PersonRepository]
    at io.quarkus.arc.processor.BeanDeployment.processErrors(BeanDeployment.java:990)
    at io.quarkus.arc.processor.BeanDeployment.init(BeanDeployment.java:234)
    at io.quarkus.arc.processor.BeanProcessor.initialize(BeanProcessor.java:122)
    at io.quarkus.arc.deployment.ArcProcessor.validate(ArcProcessor.java:391)
    at java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
    at java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62)
    at java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)
    at java.base/java.lang.reflect.Method.invoke(Method.java:566)
    at io.quarkus.deployment.ExtensionLoader$2.execute(ExtensionLoader.java:932)
    at io.quarkus.builder.BuildContext.run(BuildContext.java:277)
    at org.jboss.threads.ContextClassLoaderSavingRunnable.run(ContextClassLoaderSavingRunnable.java:35)
    at org.jboss.threads.EnhancedQueueExecutor.safeRun(EnhancedQueueExecutor.java:2046)
    at org.jboss.threads.EnhancedQueueExecutor$ThreadBody.doRunTask(EnhancedQueueExecutor.java:1578)
    at org.jboss.threads.EnhancedQueueExecutor$ThreadBody.run(EnhancedQueueExecutor.java:1452)
    at java.base/java.lang.Thread.run(Thread.java:834)
    at org.jboss.threads.JBossThread.run(JBossThread.java:479)
```

Please scroll up 1 line in your logs (or somewhere near this amount), and you'll see:

```
WARN  [io.qua.agr.dep.AgroalProcessor] (build-20) The Agroal dependency is present but no JDBC datasources have been defined.
```

As the error suggests, no `DataSource` has been defined. In my case, I needed to add the following to my `application.properties`:

```properties
quarkus.datasource.db-kind=postgresql
```

You'll need to add this even if you have the `url` specified. All together you will want your properties to look something like:

```properties
quarkus.datasource.db-kind=postgresql
# Whatever the url to your database is
quarkus.datasource.jdbc.url=jdbc:postgresql://localhost:5432/my_test_db
# Whatever your permissions are
quarkus.datasource.username=admin
quarkus.datasource.password=admin
```

The error I showed is not related to Postgres, since the code never gets that far. So it could still happen with other databases.

Hopefully, this will save you some time, as I personally failed to read that log line and spent way too long trying to resolve this error 🤦‍♂️...