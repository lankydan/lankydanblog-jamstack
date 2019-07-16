---
title: Getting started with Spring Data and MongoDB
date: "2017-05-20"
published: true
tags: [spring, java, spring boot, spring data, mongo, mongodb, spring data mongodb]
cover_image: ./spring-forest.jpeg
include_date_in_url: true
github_url: https://github.com/lankydan/spring-data-mongodb-basic
---

In this post we will have a look at some of the basics of using Spring Data and MongoDB. Firstly what is MongoDB? It is a NoSQL database that uses JSON-like documents which allows fields to vary between documents and have the data structure change over time. A document model maps to an object that is defined within our code (we will be using Spring Data to do this). That is only a very short and minimalist view of what MongoDB is but for the scope of this post it should be enough information as we will focus on implementation rather than it's definition.

What is Spring Data? It is a project that encompasses many sub-projects that are implemented to work with specific databases. As mentioned earlier we will be using MongoDB and therefore will want to use the MongoDB specific sub-project.

In this post we will be using Spring Boot to get everything up and running nice and quickly and therefore we will require the following dependency (assuming you are using Maven) which contains the `spring-boot-starter` and `spring-data-mongodb` dependencies among other things.

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-data-mongodb</artifactId>
</dependency>
```

If you do not want to use Spring Boot or `spring-boot-starter-data-mongodb` then you will require the `spring-data-mongodb` dependency at the very least.

```xml
<dependency>
  <groupId>org.springframework.data</groupId>
  <artifactId>spring-data-mongodb</artifactId>
  <version>1.10.3.RELEASE</version>
</dependency>
```

The full `pom.xml` file can be found [here](https://github.com/lankydan/spring-data-mongodb-basic/blob/master/pom.xml) and have a look at Spring Boot's [guide](https://spring.io/guides/gs/spring-boot/) on setting up a Spring Boot application from scratch.

A little bit more configuration is required if you haven't used MongoDB before as you will need to setup a local database, which after following the instructions on the MongoDB website did not take long to do and was pretty straight forward. Follow this [link](https://docs.mongodb.com/manual/installation/) for more information.

Now that all the configuration is complete we can actually begin implementing a very basic Spring application so we can focus on how to use Spring Data with MongoDB.

The first thing we will need is a object that will represent some data that we want to keep inside a database. This required very little code and I was very surprised how few annotations were actually required to get this working. Also I used Lombok in this class to save me writing some extra code, see my previous post [Being lazy with Lombok](https://lankydanblog.com/2017/04/29/being-lazy-with-lombok/) for more information.

```java
@Getter
@Setter
@ToString(exclude = {"id", "dateOfBirth"})
public class Person {

  @Id private String id;

  // not annotated as it is assumed that they will be mapped
  // onto db fields that have the same name as the properties
  private String firstName;
  private String secondName;
  private LocalDateTime dateOfBirth;
  private String profession;
  private int salary;

  public Person(
      final String firstName,
      final String secondName,
      final LocalDateTime dateOfBirth,
      final String profession,
      final int salary) {
    this.firstName = firstName;
    this.secondName = secondName;
    this.dateOfBirth = dateOfBirth;
    this.profession = profession;
    this.salary = salary;
  }

  // Lombok adds the getters, setters and toString
}
```

The only actual Spring Data annotation in this class is the `@Id` annotation that represents the unique Id of the object which maps to `_id` and is generated when it is persisted to the database. The annotation can also be left off if the field is named `id` or `_id`, therefore in the example above the annotation is not necessary. If the annotation or a correctly named property is not included when persisted an `_id` field will be created when saved as MongoDB requires the field to be populated. The other properties are left without annotations and when persisting or saving to the database it is assumed that they will map to fields that share the same name within the database.

The next step is creating a repository that will perform all the database operations to do with the `Person` object. Spring Data injects some magic into this step leaving barely anything for us to actually do.

```java
public interface PersonRepository extends MongoRepository<Person, String> {

  List<Person> findBySalary(final int salary);
}
```

The interface extends the `MongoRepository` which provides plenty of CRUD methods and a few extras to get us going quickly. On this interface only one actual definition has been added but obviously more could be added when required. So where does this magic that I mentioned earlier come in? Well normally we would need to create a implementation of the interface that was just created but instead Spring will create this for us when the application is started. Ok, but what about the method that we just defined on the interface surely that needs to know what it's doing? By using the name of the definition Spring infers the implementation, therefore `findBySalary` will find `Person` objects stored in the database by `salary`, `getBySalary` could also be used. To execute these queries Spring Data uses the `MongoTemplate`.

Now to tie all the code together and to show it in action we need to create the main application that has the `@SpringBootApplication` annotation. In this example the class has implemented `CommandLineRunner` as a convenient way to quickly show the output of some of the repositories methods.

```java
@SpringBootApplication
// needed because the repository is not in the same package or a sub package of the SpringBootApplication
@EnableMongoRepositories(basePackageClasses = PersonRepository.class)
public class Application implements CommandLineRunner {

  @Autowired private PersonRepository personRepository;

  public static void main(final String args[]) {
    SpringApplication.run(Application.class, args);
  }

  @Override
  public void run(String... strings) throws Exception {
    personRepository.deleteAll();

    final Person john = new Person("John", "Doe", LocalDateTime.now(), "Winner", 100);
    final Person joe = new Person("Joe", "Blogs", LocalDateTime.now(), "Loser", 50);

    personRepository.save(john);
    personRepository.save(joe);

    System.out.println("Find all");
    personRepository.findAll().forEach(System.out::println);

    System.out.println("Find by findBySalary");
    personRepository.findBySalary(100).forEach(System.out::println);

    System.out.println("Making John a loser");
    john.setProfession("Loser");
    personRepository.save(john);

    System.out.println("Find all");
    personRepository.findAll().forEach(System.out::println);
  }
}
```

There isn't actually very much to explain here as it is really just a way to show some of the repository methods in action. But one important thing to notice is the `@EnableMongoRepositories` annotation, which is required as the `PersonRepository` is not found in the same package or sub-package as the `@SpringBootApplication` class. Therefore the annotation is necessary to specify that the repository should be injected into the application. If the repository was moved into the same package as the application then the `basePackageClasses` property could be removed from the `@EnableMongoRepositories` annotation or it could even be taken out all together.

When the application is ran the following output is produced (I ignored the `id` and `dateOfBirth` properties as they were long and messy).

```java
Find all
Person(firstName=John, secondName=Doe, profession=Winner, salary=100)
Person(firstName=Joe, secondName=Blogs, profession=Loser, salary=50)
Find by getBySalary
Person(firstName=John, secondName=Doe, profession=Winner, salary=100)
Making John a loser
Find all
Person(firstName=John, secondName=Doe, profession=Loser, salary=100)
Person(firstName=Joe, secondName=Blogs, profession=Loser, salary=50)
```

Which leaves the following data persisted in the database.

```json
{
 "_id" : ObjectId("592071e667c5852be43d20e8"),
 "_class" : "lankydan.tutorial.mongodb.entities.Person",
 "firstName" : "John",
 "secondName" : "Doe",
 "dateOfBirth" : ISODate("2017-05-20T17:42:14.629+01:00"),
 "profession" : "Loser",
 "salary" : 100
}

{
 "_id" : ObjectId("592071e667c5852be43d20e9"),
 "_class" : "lankydan.tutorial.mongodb.entities.Person",
 "firstName" : "Joe",
 "secondName" : "Blogs",
 "dateOfBirth" : ISODate("2017-05-20T17:42:14.632+01:00"),
 "profession" : "Loser",
 "salary" : 50
}
```

So there we have it, a quick tutorial on using Spring Data and MongoDB which allows us to easily implement some basic functionality that can perform CRUD operations without really writing any proper code.

If you want to play around with the code it can be found on my [GitHub](https://github.com/lankydan/spring-data-mongodb-basic).

If you found this post helpful, please share it and if you want to keep up with my latest posts then you can follow me on Twitter at [@LankyDanDev](https://twitter.com/LankyDanDev).