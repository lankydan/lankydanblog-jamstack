---
title: MongoDB Indexes with Spring Data
date: "2017-06-07"
published: true
tags: [spring, java, spring boot, spring data, mongo, mongodb, spring data mongodb]
include_date_in_url: true
cover_image: blog-card.png
---

When working with large amounts of data the use of indexes will greatly improve the time it takes for your queries to run by storing part of a collection's data in a form that is easy to traverse. To add some indexes to your collections you could run some functions directly via the Mongo Shell or Spring Data can be used to handle it for you. As the title suggests that it was we will be looking into in this post.

Lets start with some background information about why we should use indexes. As mentioned in the introduction indexes allows us to query vast amounts of data in a more efficient way which reduces the time taken to retrieve the results. This might seem negligible with smaller sets of data but as the size of documents and collections increase this time difference between having indexes or not is definitely recognisable.

Now lets get onto what this post is about, applying indexes to documents using Spring Data. This is done through the use of the the various index annotations that Spring Data provides for use with MongoDB, which include:

- `@Indexed` specifies a field that will be indexed by MongoDB.
- `@CompoundIndex` specifies a class that will use compound indexes.
- `@TextIndexed` specifies a field that will part of the text index.
- `@GeoSpacialIndexed` specifies a field that will be indexed using MongoDB's geospacial indexing feature.

This post will focus on the `@Indexed` and `@CompoundIndex` annotations.

A very important thing to mention before we go any further is that to use the index annotations within a document class the `@Document` annotation needs to be applied. Without this annotation the documents will be created and used correctly but no indexes will be created.

In this post I used Spring Boot to run and test the code although none of this code will be shown here, the required setup and foundation information needed for this post can be found in [Getting started with Spring Data and MongoDB](https://lankydan.dev/2017/05/20/getting-started-with-spring-data-and-mongodb/).

## @Indexed

This annotation is how we mark a single field as being indexed which is the equivalent to the following MongoDB command.

```js
db.COLLECTION_NAME.createIndex({FIELD_NAME: 1})
```

Where `COLLECTION_NAME` is obviously the name of the collection, which when using Spring Data will be the name of the class that is being used or the name specified in the `@Document` annotation that has been applied to the class. `FIELD_NAME` is the name of field that the `@Indexed` annotation has been applied to.

It also comes with various properties that allow us to control how the index is applied.

- `background` when set to true the index will be applied in the background allowing read and write operations to occur while the index is being built. The equivalent MongoDB command is

  ```js
  db.COLLECTION_NAME.createIndex({FIELD_NAME:1}, {background: BOOLEAN})
  ```

- `direction` specifies the sort order of the index which is ascending by default. The equivalent MongoDB command is

  ```js
  db.COLLECTION_NAME.createIndex({FIELD_NAME:SORT_ORDER})
  ```

  where `SORT_ORDER` is 1 for `IndexDirection.ASCENDING` and -1 for `IndexDirection.DESCENDING`.
- `dropDups` when set to true applies an unique index to the first occurrence of a key and removes all subsequent duplicated documents from the collection, although this command was deprecated in MongoDB 3.0.

- `expireAfterSeconds` specify the number of seconds that documents in the collection are retained for. When this property is used the index can be referred to as a TTL (Time-To-Live) index. This property can only be used on fields that represent a date. The equivalent MongoDB command is

  ```js
  db.COLLECTION_NAME.createIndex({FIELD_NAME:1}, {expireAfterSeconds: TIME})
  ```

- `name` provide a name for the index, otherwise the name will be automatically generated to the name of the field. The equivalent MongoDB command is

  ```js
  db.COLLECTION_NAME.createIndex({FIELD_NAME:1}, {name: INDEX_NAME})
  ```

- `sparse` when true the index only references documents that contain the indexed field. The equivalent MongoDB command is

  ```js
  db.COLLECTION_NAME.createIndex({FIELD_NAME:1}, {sparse: BOOLEAN})
  ```

- `unique` when set to true reject all documents that contain a duplicate value for the indexed field. The equivalent MongoDB command is

  ```js
  db.COLLECTION_NAME.createIndex({FIELD_NAME:1}, {unique: BOOLEAN})
  ```

- `useGeneratedName` when set to true it will ignore the given index name from the `name` property if provided and use the MongoDB generated name instead, which will look like `fieldName_1`.

There are some remaining options that are available via MongoDB directly but not through the Spring Data annotations which will need to be applied manually to the collection via the shell if you wish to use them. These include: `v` the index version number and `weights` which specifies the significance of an indexed field relative to other indexes.

An import piece of information to note, changing the properties in the annotation when the index has already been created for the collection will cause an exception to occur when Spring Data tries to create the new index. Therefore you might need to drop the original index or question if you are really meant to be changing it in the first place.

Now that we know the properties that are available lets see them in action. Below there are two code snippets that make up an example that use `@Indexed` on a few fields and makes use of some of the properties.

```java
@Document
public class Person {

  @Id private String id;

  @Indexed(name = "first_name_index", direction = IndexDirection.DESCENDING)
  private String firstName;

  private String secondName;

  @Indexed(name = "expire_after_seconds_index", expireAfterSeconds = 10)
  private LocalDateTime dateOfBirth;

  private Address address;
  private String profession;
  private int salary;

  // constructor
  
  // getters and setters
}
```

In the Person document each index has been given a name, the `first_name_index` is sorted in descending order and the `expire_after_seconds_index` will cause documents to be removed after being in the collection for 10 seconds (yes I know you probably wouldn't actually put this on a date of birth field!).

```java
@Document
public class Address {

  @Indexed(name = "address_line_one_index")
  private String addressLineOne;
  
  private String addressLineTwo;
  private String city;
  private String country;

  // constructor
  
  // getters and setters
}
```

In the Address document the index `address_line_one_index` has been created. This is an embedded document that has been used inside the `Person` document and will cause its index to be created slightly differently than the earlier piece of code. The index will be placed onto the field `address.addressLineOne` where `address` is a field in the `Person` document and `addressLineOne` is a field in the embedded Address document.

To test the use of the indexes I created "some" test data... 100,000 records to be exact so I could make the time difference between querying with and without indexes more significant. To check how long it took for the query to execute I ran a find query with the explain method added on the end.

```js
db.person.find({"firstName":"firstName_2500"}).explain("executionStats")
```

I don't personally know anyone called `firstName_2500` but it made creating the data much simpler. Anyway, the generated data contained documents that were duplicated 4 times, for example 4 documents called `firstName_2500` were created. By running the above query we know that we are looking for 4 documents in a collection of 100,000... that's a pretty small percentage of the total documents that we actually want.

When ran without an index on `firstName`

```json
{
  ... more stats ...
  "executionStats" : {
  "executionSuccess" : true,
  "nReturned" : 4,
  "executionTimeMillis" : 111,
  "totalKeysExamined" : 0,
  "totalDocsExamined" : 100000,
  ... more stats ...
}
```

From looking at the statistics we can see that all 100,000 documents were examined for the query results even though only 4 were returned. This caused it to take 111 milliseconds, which doesn't seem like much but as the collection size keeps increasing this time will only become greater. For consistency I ran this query multiple times with execution times varying from 60 to 200 milliseconds.

When ran with an index on `firstName`

```json
{
  ... more stats ...
  "executionStats" : {
  "executionSuccess" : true,
  "nReturned" : 4,
  "executionTimeMillis" : 0,
  "totalKeysExamined" : 4,
  "totalDocsExamined" : 4,
  ... more stats ...
}
```

These execution results look much better. Only 4 documents were examined compared to 100,000 which were read without the index and this leads to the execution time being much faster, in this example it was actually so small it couldn't display the actual time. I also ran this query multiple times and each time it returned an execution time of 0 milliseconds.

I also ran the query a bit later, some time after the 10 second time to live which was marked by the `expireAfterSeconds` property and no results were returned. So either I did something wrong and deleted the documents myself or the TTL index worked correctly.

That's probably enough time spent on the `@Indexed` annotation which provides a good basis moving forward, therefore some information will be skipped over while explaining the `@CompoundIndex` annotation.

## @CompoundIndex

This annotation is placed onto a class that represents a document. The equivalent MongoDB command is

```js
db.COLLECTION_NAME.createIndex({FIELD_NAME_1: 1, FIELD_NAME_2: 1})
```

The format follows the same as the command for creating a singular index but instead takes in multiple fields, in this example I have only used two fields but more could be added.

The annotation shares all of the properties that the `@Indexed` annotation had available although direction has been deprecated as the sort order is specified in a different property as explained below.

```java
@Document
@CompoundIndex(def = "{'firstName':1, 'salary':-1}", name = "compound_index")
public class Person {

  @Id private String id;
  private String firstName;
  private String secondName;
  private LocalDateTime dateOfBirth;
  private Address address;
  private String profession;
  private int salary;

  // constructor

  // getters and setters
}
```

As demonstrated by this example the fields that are added to the compound index are specified by the `def` property inside the annotation. If you compare this to the equivalent MongoDB command to add the index manually you can see that it is virtually the same. As mentioned earlier the direction property has been deprecated from this annotation since the sort orders are specified within the `def` property.

The order that the fields are specified within the `def` property are important and represent the order that the index will sort the fields. In the example above documents are ordered in ascending order of `firstName` values and then `salary` values in descending order. Another important piece of information is that when manually applying a sort the fields in the sort method must appear in the same order as the index and can only sort on the original sort order or it's inverse, if these conditions are violated the sort order on the index will not be efficiently used or not used at all.

Therefore the index in the example could be sorted by the following Mongo queries

```js
db.person.find({$and: [{"firstName":"firstName_2500"}, {"salary":{$gt:0}}]}).sort({"firstName":1, "salary":-1})
```

and

```js
db.person.find({$and: [{"firstName":"firstName_2500"}, {"salary":{$gt:0}}]}).sort({"firstName":-1, "salary":1})
```

But not by

```js
db.person.find({$and: [{"firstName":"firstName_2500"}, {"salary":{$gt:0}}]}).sort({"firstName":1, "salary":1})
```

or

```js
db.person.find({$and: [{"firstName":"firstName_2500"}, {"salary":{$gt:0}}]}).sort({"salary":-1, "firstName":1})
```

More information about sorting compound indexes can be found in the [MongoDB docs](https://docs.mongodb.com/manual/tutorial/sort-results-with-indexes/).

If you wanted to add multiple compound indexes to your document class you will quickly realise that we need to go about it in a different way (can't have multiple annotations of the same type applied to the class). Thankfully there is a way around this with the aptly named `@CompoundIndexes` annotation which simply contains a collection of `@CompoundIndex` annotations which work as explained earlier.

There is not much to say about the `@CompoundIndexes` annotation so the example below shows it being added to a document class which will create the indexes when inserted.

```java
@Document
@CompoundIndexes({
  @CompoundIndex(def = "{'firstName':1, 'salary':-1}", name = "compound_index_1"),
  @CompoundIndex(def = "{'secondName':1, 'profession':1}", name = "compound_index_2")
})
public class Person {

  @Id private String id;
  private String firstName;
  private String secondName;
  private LocalDateTime dateOfBirth;
  private Address address;
  private String profession;
  private int salary;

  // constructor

  // getters and setters
}
```

I think it's about time to wrap this post up. In this post we looked at the `@Indexed` and `@CompoundIndex` annotations that can be applied to a class that is marked with `@Document` which when inserted will create the indexes that have been specified within the class. We have also looked briefly at what indexes actually do and how they can decrease query times by a significant amount.

If you found this post helpful, please share it and if you want to keep up with my latest posts then you can follow me on Twitter at [@LankyDanDev](https://twitter.com/LankyDanDev).