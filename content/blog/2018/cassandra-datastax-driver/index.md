---
title: Interacting with Cassandra using the Datastax Java driver
date: "2018-04-15"
published: true
tags: [java, cassandra, datastax, spring, spring boot]
cover_image: ./datastax.jpg
include_date_in_url: true
github_url: https://github.com/lankydan/datastax-java-driver
---

I'm back with more Cassandra and Java integration today this time focusing on using the Datastax Java driver rather than Spring Data Cassandra which I have already written about quite a lot. The Datastax driver is actually used by Spring Data to interact with Cassandra but comes with some extra goodies built on top of it. But we don't want any of these today! We are going to use the Datastax driver directly and at the end of the post once we have seen how use it we will compare it against Spring Data.

This post makes the assumption that you are already familiar with Cassandra and possibly Spring Data Cassandra. Since I have already written quite a few posts around this subject I have only brushed over how Cassandra works where context is required. If you do not have this background information I recommend reading [Getting started with Spring Data Cassandra](https://lankydanblog.com/2017/10/12/getting-started-with-spring-data-cassandra/) where I obviously talked about using Spring Data Cassandra but also went into more thorough explanations of how Cassandra works than I do in this post. There is also the [Datastax Academy](https://academy.datastax.com/courses) which provide some very useful resources for learning how to use Cassandra yourself.

First things first, dependencies.

```xml
<dependencies>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter</artifactId>
  </dependency>

  <dependency>
    <groupId>com.datastax.cassandra</groupId>
    <artifactId>cassandra-driver-core</artifactId>
    <version>3.4.0</version>
  </dependency>

  <dependency>
    <groupId>com.datastax.cassandra</groupId>
    <artifactId>cassandra-driver-mapping</artifactId>
    <version>3.4.0</version>
  </dependency>

  <dependency>
    <groupId>commons-io</groupId>
    <artifactId>commons-io</artifactId>
    <version>2.4</version>
  </dependency>

  <dependency>
    <groupId>org.apache.commons</groupId>
    <artifactId>commons-lang3</artifactId>
    <version>3.7</version>
  </dependency>
</dependencies>
```

As always I am using Spring Boot, just because we are depriving ourselves of Spring Data doesn't mean we need to go completely cold turkey from all Spring libraries. The Datastax related dependencies here are `cassandra-driver-core` and `cassandra-driver-mapping`. `cassandra-driver-core`, as the name suggests provides the core functionality to interact with Cassandra such as setting up a session and writing queries. `cassandra-driver-mapping` is not required to query Cassandra but does provide some object mapping, in conjunction with the core driver it will now serve as an ORM rather than only allowing us execute CQL statements.

We now have our dependencies sorted, the next step is to get connected to Cassandra so that we can actually start querying it.

```java
@Configuration
public class CassandraConfig {

  @Bean
  public Cluster cluster(
      @Value("${cassandra.host:127.0.0.1}") String host,
      @Value("${cassandra.cluster.name:cluster}") String clusterName,
      @Value("${cassandra.port:9042}") int port) {
    return Cluster.builder()
        .addContactPoint(host)
        .withPort(port)
        .withClusterName(clusterName)
        .build();
  }
  
  @Bean
  public Session session(Cluster cluster, @Value("${cassandra.keyspace}") String keyspace)
      throws IOException {
    final Session session = cluster.connect();
    setupKeyspace(session, keyspace);
    return session;
  }

  private void setupKeyspace(Session session, String keyspace) throws IOException {
    final Map<String, Object> replication = new HashMap<>();
    replication.put("class", "SimpleStrategy");
    replication.put("replication_factor", 1);
    session.execute(createKeyspace(keyspace).ifNotExists().with().replication(replication));
    session.execute("USE " + keyspace);
    //    String[] statements = split(IOUtils.toString(getClass().getResourceAsStream("/cql/setup.cql")), ";");
    //    Arrays.stream(statements).map(statement -> normalizeSpace(statement) + ";").forEach(session::execute);
  }

  @Bean
  public MappingManager mappingManager(Session session) {
    final PropertyMapper propertyMapper =
        new DefaultPropertyMapper()
            .setNamingStrategy(new DefaultNamingStrategy(LOWER_CAMEL_CASE, LOWER_SNAKE_CASE));
    final MappingConfiguration configuration =
        MappingConfiguration.builder().withPropertyMapper(propertyMapper).build();
    return new MappingManager(session, configuration);
  }
}
```

There is a bit more core here when compared to a similar setup using Spring Data (this class isn't even needed when combined with Spring Boot's auto-configuration) but the class itself is pretty simple. The basic setup of the `Cluster` and `Session` beans shown here is the bare minimum required for the application to work and will likely remain the same for any application you write. More methods are provided so you can add any additional configuration to make them suitable for your use-case.

By using values from `application.properties` we set the host address, cluster name and port of the `Cluster`. The `Cluster` is then used to create a `Session`. There are two options to choose from when doing this, setting the default keyspace or not. If you want to set the default keyspace then all you need to do is use the below code instead.

```java
@Bean
public Session session(Cluster cluster, @Value("${cassandra.keyspace}") String keyspace) throws IOException {
  final Session session = cluster.connect(keyspace);
  // any other setup
  return session;
}
```

The keyspace is passed into the `connect` method which will create a `Session` and then execute `USE <keyspace>` thus setting the default keyspace. This relies on the keyspace existing before creating the session, if it does not it will fail when executing the `USE` statement.

If you do not know if the keyspace exists at startup or know that you definitely want to create it dynamically based on the keyspace value from the properties file, then you will need to call `connect` without specifying the keyspace. You will then need to create it yourself so you actually have something to use. To do this use of the `createKeyspace` method provided by `SchemaBuilder`. Below is the CQL statement to create the keyspace.

```sql
CREATE KEYSPACE IF NOT EXISTS <keyspace> WITH REPLICATION = { 'class':'SimpleStrategy', 'replication_factor':1 };
```

I have also added the keyspace code below again as its a bit far away now.

```java
private void setupKeyspace(Session session, String keyspace) throws IOException {
  final Map<String, Object> replication = new HashMap<>();
  replication.put("class", "SimpleStrategy");
  replication.put("replication_factor", 1);
  session.execute(createKeyspace(keyspace).ifNotExists().with().replication(replication));
  session.execute("USE " + keyspace);
}
```

The `SchemaBuilder` is nice and easy to use and looks very similar to the CQL as you go through it. We add a `ifNotExists` clause and set the replication factor by first calling `with` and then passing a `Map<String, Object>` into the `replicationMethod`. This map needs to contain the class and replication factor, basically use the keys shown here but change the mapped values to whatever you need them to be. Don't forget to `execute` the statement and then tell the session to use the keyspace that was just created. Unfortunately there isn't a nicer way to set the default keyspace manually and executing a `USE` statement is the only option.

Following on from the two previous options regarding setting the default keyspace. If we choose to not set the default keyspace at all, then we need to prepend a keyspace onto each table we create and for every query that is executed. It isn't too hard to do as Datastax provides ways to add keyspace names to queries as well as onto entities for mapping. I won't go into this subject any further, but know that not setting the keyspace will not prevent your application from working if you have setup everything else correctly.

Once the keyspace is set we can get around to creating the tables. There are two possible ways to do this. One, execute some CQL statements, whether they are strings in your Java code or read from a external CQL script. Two, use the `SchemaBuilder` to create them.

Let's look at executing CQL statements first, or more precisely executing them from a CQL file. You might have noticed that I left some commented out code in the original example, when uncommented that code will find a file named `setup.cql`, read out a single CQL statement, execute it and then move onto the next statement. Here it is again.

```java
String[] statements = split(IOUtils.toString(getClass().getResourceAsStream("/cql/setup.cql")), ";");
Arrays.stream(statements).map(statement -> normalizeSpace(statement) + ";").forEach(session::execute);
```

Below is the CQL contained in the file to create the Cassandra table.

```sql
CREATE TABLE IF NOT EXISTS people_by_country(
  country TEXT,
  first_name TEXT,
  last_name TEXT,
  id UUID,
  age INT,
  profession TEXT,
  salary INT,
  PRIMARY KEY((country), first_name, last_name, id)
);
```

The primary key consists of the `country`, `first_name`, `last_name` and `id` field. The partition key consists of just the `country` field and the clustering columns are the remaining keys in the key, `id` is only included for uniqueness as you can obviously have people with the same names. I go into the topic of primary keys in much more depth in my earlier post, [Getting started with Spring Data Cassandra](https://lankydanblog.com/2017/10/12/getting-started-with-spring-data-cassandra/).

This code makes use of the `commons-io` and `commons-lang3` dependencies. If we are not executing CQL in this way, then these dependencies can be removed (within the context of this post).

What about using the `SchemaBuilder`? I haven't included any code to create a table in the original snippet because I was playing around and trying to figure out the nicest place to put it, for now I have stuck it in the repository but I'm still not convinced thats the perfect place for it. Anyway, I will paste the code here so we can look at it now and then we can skip over it later when it reappears.

```java
private void createTable(Session session) {
  session.execute(
      SchemaBuilder.createTable(TABLE)
          .ifNotExists()
          .addPartitionKey("country", text())
          .addClusteringColumn("first_name", text())
          .addClusteringColumn("last_name", text())
          .addClusteringColumn("id", uuid())
          .addColumn("age", cint())
          .addColumn("profession", text())
          .addColumn("salary", cint()));
}
```

This matches up quite nicely with the CQL shown above. We are able to define the different column types using `addPartitionKey` and `addClusteringColumn` to create our primary key and `addColumn` for the standard fields. There are plenty of other methods, such as `addStaticColumn` and `withOptions` allowing you to then call `clusteringOrder` to define the sorting direction of your clustering columns. The order that you call these methods is very important as the partition key and clustering columns will be created in the order which their respective methods are called. Datastax also provide the `DataType` class to make defining the column types easier, for example `text` matches to `TEXT` and `cint` matches to `INT`. As with the last time we use `SchemaBuilder`, once we are happy with the table design we need to `execute` it.

Onto the `MappingManager`, the snippet to create the bean is below.

```java
@Bean
public MappingManager mappingManager(Session session) {
  final PropertyMapper propertyMapper =
      new DefaultPropertyMapper()
          .setNamingStrategy(new DefaultNamingStrategy(LOWER_CAMEL_CASE, LOWER_SNAKE_CASE));
  final MappingConfiguration configuration =
      MappingConfiguration.builder().withPropertyMapper(propertyMapper).build();
  return new MappingManager(session, configuration);
}
```

The `MappingManager` bean comes from the `cassandra-driver-mapping` dependency and will map a `ResultSet` to an entity (which we will look at later). For now we just need to create the bean. If we aren't happy with the default naming strategy of converting Java camel case to all lowercase with no separators in Cassandra we will need to set our own. To do this we can pass in a `DefaultNamingStrategy` to define the case that we are using within our Java classes and what we are using in Cassandra. Since in Java it is typical to use camel case we pass in `LOWER_CAMEL_CASE` and since I like to use snake case in Cassandra we can use `LOWER_SNAKE_CASE` (these are found in the `NamingConventions` class). The reference to lower specifies the case of the first character in a string, so `LOWER_CAMEL_CASE` represents `firstName` and `UPPER_CAMEL_CASE` represents `FirstName`. `DefaultPropertyMapper` comes with extra methods for more specific configuration but `MappingConfiguration` only has one job of taking in a `PropertyMapper` to be passed to a `MappingManager`.

The next thing we should look at is the entity that will be persisted to and retrieved from Cassandra, saving us the effort of manually setting values for inserts and converting results from reads. The Datastax driver provides us with a relatively simple way to do just that by using annotations to mark properties like the name of the table it is mapping to, which field matches to what Cassandra columns and which fields the primary key consists of.

```java
@Table(name = "people_by_country")
public class Person {

  @PartitionKey
  private String country;

  @ClusteringColumn
  private String firstName;

  @ClusteringColumn(1)
  private String lastName;

  @ClusteringColumn(2)
  private UUID id;

  private int age;
  private String profession;
  private int salary;

  private Person() {

  }

  public Person(String country, String firstName, String lastName, UUID id, int age, String profession, int salary) {
    this.country = country;
    this.firstName = firstName;
    this.lastName = lastName;
    this.id = id;
    this.age = age;
    this.profession = profession;
    this.salary = salary;
  }

  // getters and setters for each property

  // equals, hashCode, toString
}
```

This entity represents the `people_by_country` table as denoted by the `@Table`. I have put the CQL of the table below again for reference.

```sql
CREATE TABLE IF NOT EXISTS people_by_country(
  country TEXT,
  first_name TEXT,
  last_name TEXT,
  id UUID,
  age INT,
  profession TEXT,
  salary INT,
  PRIMARY KEY((country), first_name, last_name, id)
);
```

The `@Table` annotation must specify the name of the table the entity represents, it also comes with various other options depending on your requirements, such as `keyspace` if you don't want to use the default keyspace the `Session` bean is configured to use and `caseSensitiveTable` which is self explanatory.

What about the primary key? As touched on above, a primary key consists of a partition key that itself contains one or more columns and/or clustering columns(s). To match up to the Cassandra table defined above we added the `@PartitionKey` and `@ClusteringColumn` annotations to the required fields. Both of the annotations have one property, `value` which specifies the order which the column appears in the primary key. The default value is `0` which is why some annotations do not include a value.

The last requirements to get this entity to work are getters, setters and a default constructor so that the mapper can do it's thing. The default constructor can be private if you don't want anyone accessing it as the mapper uses reflection to retrieve it. You might not want to have setters on your entity since you would like the object to be immutable, unfortunately, there isn't anything you can really do about this and you'll just have to concede this fight. Although I personally think this is fine as you could (and maybe should) convert the entity into another object that can be passed around your application without any of the entity annotations and thus no knowledge of the database itself. The entity can then be left as mutable and the other object that you are passing around can work exactly as you wish.

One last thing I want to mention before we move on. Remember the `DefaultNamingConvention` we defined earlier? This means that our fields are being matched to the correct columns without any extra work in the entity. If you didn't do this or wanted to provide a different field name to your column name then you could use the `@Column` annotation and specify it there.

We nearly have all the components we need to build our example application. The penultimate component is creating a repository that will contain all the logic for persisting and reading data to and from Cassandra. We will make use of the `MappingManager` bean that we created earlier and the annotations that we put onto the entity to convert a `ResultSet` into an entity without needing to do anything else ourselves.

```java
@Repository
public class PersonRepository {

  private Mapper<Person> mapper;
  private Session session;

  private static final String TABLE = "people_by_country";

  public PersonRepository(MappingManager mappingManager) {
    createTable(mappingManager.getSession());
    this.mapper = mappingManager.mapper(Person.class);
    this.session = mappingManager.getSession();
  }

  private void createTable(Session session) {
    // use SchemaBuilder to create table
  }

  public Person find(String country, String firstName, String secondName, UUID id) {
    return mapper.get(country, firstName, secondName, id);
  }

  public List<Person> findAll() {
    final ResultSet result = session.execute(select().all().from(TABLE));
    return mapper.map(result).all();
  }

  public List<Person> findAllByCountry(String country) {
    final ResultSet result = session.execute(select().all().from(TABLE).where(eq("country", country)));
    return mapper.map(result).all();
  }

  public void delete(String country, String firstName, String secondName, UUID id) {
    mapper.delete(country, firstName, secondName, id);
  }

  public Person save(Person person) {
    mapper.save(person);
    return person;
  }
}
```

By injecting the `MappingManager` in via the constructor and calling the `mapper` method for the `Person` class, we are returned with a `Mapper<Person>` that will personally handle all of our mapping needs. We also need to retrieve the `Session` to be able to execute queries which is nicely contained within the `MappingManager` we injected.

For three of the queries we are directly relying on the mapper to interact with Cassandra but this only works for a single record. `get`, `save` and `delete` each work by accepting in the values that make up the `Person` entity's primary key and they must be entered in the correct order or you will experience unexpected results or exceptions will be thrown.

The other situations require a query to be executed before the mapper can be called to convert the returned `ResultSet` into an entity or collection of entities. I have made use of `QueryBuilder` to write queries and I have also chosen for this post to not write prepared statements. Although in most cases you should be using prepared statements I thought I would cover these in a separate post in the future, although they are similar enough and `QueryBuilder` can still be used so I am confident you could figure it out on your own if needed.

`QueryBuilder` provides static methods to create `select`, `insert`, `update` and `delete` statements which can then be chained together to (I know this sounds obvious) build the query. The `QueryBuilder` used here is also the same one that you can use in Spring Data Cassandra when you need to manually create your own queries and not rely on the inferred queries coming from the Cassandra repositories.

The final step to creating this little application, is actually running it. Since we are using Spring Boot we just add the standard `@SpringBootApplication` and run the class. I have done just that below, as well as using `CommandLineRunner` to execute the methods within the repository so we can check that they are doing what we expect.

```java
@SpringBootApplication
public class Application implements CommandLineRunner {

  @Autowired
  private PersonRepository personRepository;

  public static void main(String args[]) {
    SpringApplication.run(Application.class);
  }

  @Override
  public void run(String... args) {

    final Person bob = new Person("UK", "Bob", "Bobbington", UUID.randomUUID(), 50, "Software Developer", 50000);

    final Person john = new Person("UK", "John", "Doe", UUID.randomUUID(), 30, "Doctor", 100000);

    personRepository.save(bob);
    personRepository.save(john);

    System.out.println("Find all");
    personRepository.findAll().forEach(System.out::println);

    System.out.println("Find one record");
    System.out.println(personRepository.find(john.getCountry(), john.getFirstName(), john.getLastName(), john.getId()));

    System.out.println("Find all by country");
    personRepository.findAllByCountry("UK").forEach(System.out::println);

    john.setProfession("Unemployed");
    john.setSalary(0);
    personRepository.save(john);
    System.out.println("Demonstrating updating a record");
    System.out.println(personRepository.find(john.getCountry(), john.getFirstName(), john.getLastName(), john.getId()));

    personRepository.delete(john.getCountry(), john.getFirstName(), john.getLastName(), john.getId());
    System.out.println("Demonstrating deleting a record");
    System.out.println(personRepository.find(john.getCountry(), john.getFirstName(), john.getLastName(), john.getId()));
  }
}
```

The `run` method contains some print lines so we can see whats happening, below is what they output.

```
Find all
Person{country='US', firstName='Alice', lastName='Cooper', id=e113b6c2-5041-4575-9b0b-a0726710e82d, age=45, profession='Engineer', salary=1000000}
Person{country='UK', firstName='Bob', lastName='Bobbington', id=d6af6b9a-341c-4023-acb5-8c22e0174da7, age=50, profession='Software Developer', salary=50000}
Person{country='UK', firstName='John', lastName='Doe', id=f7015e45-34d7-4f25-ab25-ca3727df7759, age=30, profession='Doctor', salary=100000}

Find one record
Person{country='UK', firstName='John', lastName='Doe', id=f7015e45-34d7-4f25-ab25-ca3727df7759, age=30, profession='Doctor', salary=100000}

Find all by country
Person{country='UK', firstName='Bob', lastName='Bobbington', id=d6af6b9a-341c-4023-acb5-8c22e0174da7, age=50, profession='Software Developer', salary=50000}
Person{country='UK', firstName='John', lastName='Doe', id=f7015e45-34d7-4f25-ab25-ca3727df7759, age=30, profession='Doctor', salary=100000}

Demonstrating updating a record
Person{country='UK', firstName='John', lastName='Doe', id=f7015e45-34d7-4f25-ab25-ca3727df7759, age=30, profession='Unemployed', salary=0}

Demonstrating deleting a record
null
```

We can see that `findAll` has returned all records and `find` has only retrieved the record that matches the input primary key values. `findAllByCountry` has excluded Alice and only found the records from the UK. Calling `save` again on an existing record will update the record rather than inserting. Finally `delete` will delete the person's data from the database.

And thats a wrap.

I will try to write some follow up posts to this in the future as there are a few more interesting things that we can do with the Datastax driver that we haven't gone through in this post. What we have covered here should be enough to make your first steps in using the driver and start querying Cassandra from your application.

Before we go I would like to make a few comparisons between the Datastax driver and Spring Data Cassandra.

Support for creating tables is lacking in the Datastax driver (in my opinion) compared to Spring Data Cassandra. The fact that Spring Data is able to create your tables solely based on your entities removes all this extra effort to basically rewrite what you have already written. Obviously if you don't want to use entity annotations then the difference goes away as you will need to manually create the tables in both Datastax and Spring Data.

The way the entities are designed and the annotations used are also quite different. This point is tied closely to the previous point I made. Because Spring Data can create your tables for you, it has a greater need for more precise annotations that allow you to specify the design of your tables, such as the sorting order of clustering columns. This obviously can clutter up the class with a load of annotations which is normally frowned upon.

Spring Data also provides better support for standard queries such as `findAll` and the inserting of a collection of entities. Obviously this is not exactly the end of the world and implementing these will take very little effort but this pretty much sums up the main difference between the Datastax driver and Spring Data Cassandra.

Spring Data is just easier to use. I don't think there is really anything else to say on the subject. Since Spring Data Cassandra is built upon the Datastax driver it can obviously do everything the driver can and if anything that you require is missing, then you can just access the Datastax classes directly and do what you need. But the convenience that Spring Data provides shouldn't be looked over and I don't think I have even covered some of the more helpful parts that it provides since this post is only covering the basics. Don't even get me started on how much easier it is once you make use of Spring Boot's auto-configuration and the inferred queries that Cassandra repositories generate for you.

I should stop... This is turning into a rant.

In conclusion using the Datastax driver to connect and query a Cassandra database is relatively straight forward. Establish a connection to Cassandra, create the entities that you need and write the repositories that make use of the former, then you have everything that you need to get going. We also compared the Datastax driver to Spring Data Cassandra which pretty much comes down to, Datastax will do what you need but Spring Data makes it easier.

The code used in this post can be found on my [GitHub](https://github.com/lankydan/datastax-java-driver).

If you found this post helpful and want to keep up to date with my latest posts, then you can follow me on twitter at [@LankyDanDev](https://twitter.com/LankyDanDev).