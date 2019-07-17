---
title: Embedded documents with Spring Data and MongoDB
date: "2017-05-29"
published: true
tags: [spring, java, spring boot, spring data, mongo, mongodb, spring data mongodb]
cover_image: ./spring-forest.jpeg
include_date_in_url: true
github_url: https://github.com/lankydan/mongodb-relationships-with-spring
---

Continuing on from [Getting started with Spring Data and MongoDB](https://lankydan.dev/2017/05/20/getting-started-with-spring-data-and-mongodb/) we will look at implementing embedded documents. This allows one to one and one to many relationships to be modelled within a document and allows data to be retrieved in a singular query. Although as more relationships are modelled through extra embedded documents the write performance onto it the parent document will decrease and cause fragmentation of the data.

That's just a little introduction into embedded documents. In practice they are very straight forward to implement when using Spring Data as they are simply relations between objects where the document is the object and the embedded documents are fields within it.

In this post we will be using Spring Boot, the required setup and foundation information required for this post can be found in [Getting started with Spring Data and MongoDB](https://lankydan.dev/2017/05/20/getting-started-with-spring-data-and-mongodb/).

The main document object

```java
@Getter
@Setter
@ToString(exclude = {"id", "dateOfBirth"})
@Document(collection = "people")
public class Person {

  @Id private String id;
  private String firstName;
  private String secondName;
  private LocalDateTime dateOfBirth;
  private Address address;
  private String profession;
  private int salary;
  private List<Hobby> hobbies;

  public Person(
      final String firstName,
      final String secondName,
      final LocalDateTime dateOfBirth,
      final Address address,
      final String profession,
      final int salary,
      final List<Hobby> hobbies) {
    this.firstName = firstName;
    this.secondName = secondName;
    this.dateOfBirth = dateOfBirth;
    this.address = address;
    this.profession = profession;
    this.salary = salary;
    this.hobbies = hobbies;
  }
}
```

The embedded documents

```java
@Getter
@Setter
@ToString
public class Address {

  private String addressLineOne;
  private String addressLineTwo;
  private String city;
  private String country;

  public Address(
      final String addressLineOne,
      final String addressLineTwo,
      final String city,
      final String country) {
    this.addressLineOne = addressLineOne;
    this.addressLineTwo = addressLineTwo;
    this.city = city;
    this.country = country;
  }
}
```

```java
@Getter
@Setter
@ToString
public class Hobby {

  private String name;

  public Hobby(final String name) {
    this.name = name;
  }
}
```

The only Spring Data specific annotations in these classes are the `@Id` and `@Document` annotations. These are only included in the `Person` class as this is the document that is persisted to the database whereas the `Address` and `Hobby` classes are embedded within it.

The next thing that we need to do is create an interface that extends `MongoRepository<Person, String>` which allows CRUD operations and our own defined methods to be used. As mentioned in my earlier post the `MongoRepository` infers the implementation of the method from the name on the interface allowing it be used without writing your own implementation. Although this not fully true for queries with relationships as a `@Query` annotation is required on the method definition that describes what the query does, but you still don't need to write the method yourself!

```java
public interface PersonRepository extends MongoRepository<Person, String> {

  List<Person> findByFirstName(final String firstName);

  @Query("{'address.country': ?0}")
  List<Person> findByCountry(final String country);
}
```

Now all we need to do is create a class that has the `@SpringBootApplication` and `@EnableMongoRepositories` annotations and we are ready to see it in action.

```java
@SpringBootApplication
@EnableMongoRepositories(basePackageClasses = PersonRepository.class)
public class Application implements CommandLineRunner {

  @Autowired private PersonRepository personRepository;

  public static void main(final String args[]) {
    SpringApplication.run(Application.class, args);
  }

  @Override
  public void run(String... strings) throws Exception {
    personRepository.deleteAll();

    final Address address = new Address("19 Imaginary Road", "Imaginary Place", "Imaginary City", "UK");

    final Hobby badminton = new Hobby("Badminton");
    final Hobby tv = new Hobby("TV");
    final List<Hobby> hobbies = Arrays.asList(badminton, tv);

    final Person john = new Person("John", "Doe", LocalDateTime.now(), address, "Winner", 100, hobbies);
    personRepository.save(john);

    System.out.println("Find by first name");
    personRepository.findByFirstName("John").forEach(System.out::println);

    System.out.println("Find by country (UK)");
    personRepository.findByCountry("UK").forEach(System.out::println);

    address.setCountry("US");
    personRepository.save(john);
    System.out.println("Find by country (US)");
    personRepository.findByCountry("US").forEach(System.out::println);
  }
}
```

Which when ran produces the following output

```java
Find by first name
Person(firstName=John, secondName=Doe, address=Address(addressLineOne=19 Imaginary Road, addressLineTwo=Imaginary Place, city=Imaginary City, country=UK), 
profession=Winner, salary=100, hobbies=[Hobby(name=Badminton), Hobby(name=TV)])

Find by country (UK)
Person(firstName=John, secondName=Doe, address=Address(addressLineOne=19 Imaginary Road, addressLineTwo=Imaginary Place, city=Imaginary City, country=UK), 
profession=Winner, salary=100, hobbies=[Hobby(name=Badminton), Hobby(name=TV)])

Find by country (US)
Person(firstName=John, secondName=Doe, address=Address(addressLineOne=19 Imaginary Road, addressLineTwo=Imaginary Place, city=Imaginary City, country=US), 
profession=Winner, salary=100, hobbies=[Hobby(name=Badminton), Hobby(name=TV)])
```

As you can see both the queries that are defined on the interface have successfully retrieved the specified data and the change to the `address` was saved to the database via the saving of the `Person` object. When the original call to `save` is made the person collection is created which houses the single document that was produced. No such collections have been made for the embedded documents as they only reside inside the person documents.

Below is what the created document looks like

```json
{
  "_id" : ObjectId("592c7029aafef820f432c5f3"),
  "_class" : "lankydan.tutorial.mongodb.documents.Person",
  "firstName" : "John",
  "secondName" : "Doe",
  "dateOfBirth" : ISODate("2017-05-29T20:02:01.636+01:00"),
  "address" : {
    "addressLineOne" : "19 Imaginary Road",
    "addressLineTwo" : "Imaginary Place",
    "city" : "Imaginary City",
    "country" : "US"
  },
  "profession" : "Winner",
  "salary" : 100,
  "hobbies" : [ 
    {
      "name" : "Badminton"
    }, 
    {
      "name" : "TV"
    }
  ]
}
```

You have now reached the end of this quick tutorial into Embedded documents with Spring Data and MongoDB where we have modelled relationships between data that are expressed as documents embedded within others.

If you want to play around with the code it can be found on my [GitHub](https://github.com/lankydan/mongodb-relationships-with-spring).

If you found this post helpful, please share it and if you want to keep up with my latest posts then you can follow me on Twitter at [@LankyDanDev](https://twitter.com/LankyDanDev).