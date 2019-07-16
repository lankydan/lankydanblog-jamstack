---
title: Java 8 Streams
date: "2017-01-22"
published: true
tags: [java, java 8, java streams]
cover_image: ./title-card.png
include_date_in_url: true
---

Streams are another feature that were added with Java 8. It provides a different way of performing operations on a `Collection`. Rather than implementing how to perform an operation on a `Collection` you instead define what you want to come out of it, which follows the Functional Programming paradigm that was made available with Java 8. This is similar to how SQL queries work, you define what you want it to select, pass it some criteria to meet, press run and out pops the result of the query. You didn't need to tell it how to go through all the records in the table, it just does it. That's basically what using a `Stream` does in Java 8.

Before using streams you will need to know about [Lambda expressions](https://lankydanblog.wordpress.com/2017/01/14/a-little-lambda-tutorial/) and [Method references](https://lankydanblog.wordpress.com/2017/01/18/methodreference/), you could read mine if you want!

Lets start with a simple example.

```java
// Stream
List<Person> people = Arrays.asList(new Person("Dan", 23), new Person
                ("Laura", 22), new Person("Billy", 50), new Person("George", 21));
List<String> namesSortedByAge =
        people.stream()
                .filter(p -> p.getAge() > 22)
                .sorted(comparing(Person::getAge).reversed())
                .map(Person::getName)
                .collect(toList());
System.out.println("stream : " + namesSortedByAge);

// forEach equivalent
List<Person> filteredPeople = new ArrayList<Person>();
people.forEach(p -> {
    if (p.getAge() > 22) {
        filteredPeople.add(p);
    }
});
Collections.sort(filteredPeople, (a, b) -> b.getAge().compareTo(a.getAge()));
List<String> namesSortedByAgeForEach = new ArrayList<String>();
filteredPeople.forEach(p -> namesSortedByAgeForEach.add(p.getName()));
System.out.println("forEach : " + namesSortedByAgeForEach);
```

The first thing you will notice is that a `Stream` is created out of the `people` `List`. Once the `Stream` is created a set of operations is now available that were not available on the original `List`. In the example above `people` is filtering by ages over 22, being sorted by descending age and outputting the names of them into a `List`. Now with a little knowledge of Lambda expressions and Method references it is quite easy to see what it is doing by just looking at the code.

```java
.filter(p -> p.getAge() > 22)
```

The `filter` method says get the people that are older than 22. You could also define its functionality as, for each `Person` in the `people` list that is over 22 add them to the result (which is available to have other operations performed on it).

```java
.sorted(comparing(Person::getAge).reversed())
```

The `sorted` method does the sorting, obviously. It compares the ages of each `Person` using `Person::getAge` and due to` reversed()` the result is in descending order. Remember that `Person::getAge` means for each `Person` call `Person.getAge()`.

```java
.map(Person::getName)
```

This defines what the output will contain. In this situation it will output a list of names or with a small change it could be a list of ages. If you just want the actual object to be output then there is no need to perform the `map` function on the stream. A example of this can be found a bit further down.

```java
.collect(toList())
```

Finally now the all these operations have been performed to the stream we are able to get the results. Again this is something that is quite easy to understand just from reading the method, it collects the result into a list. Different Collections can be used as the target such as a `Set` with` toSet()` and `Map` with `toMap()`.

Excluding the `map` function

```java
List<Person> peopleSortedByAge =
        people.stream()
                .filter(p -> p.getAge() > 21)
                .sorted(comparing(Person::getAge).reversed())
                .map(p -> p) // equivalent to not including this line
                .collect(toList());
System.out.println(peopleSortedByAge);

List<Person> peopleSortedByAgeWithoutMapFunction =
        people.stream()
                .filter(p -> p.getAge() > 21)
                .sorted(comparing(Person::getAge).reversed())
                .collect(toList());
System.out.println(peopleSortedByAgeWithoutMapFunction);
```

The two streams included in the example above produce the same output but one does not include the `map` function. This is due to a list of `Person` objects being the result.

Parallel computation is also made very easy with streams as they can be ran multi-threaded by simply changing the word `stream` to `parallelStream`.

```java
List<String> namesSortedByAge =
                people.parallelStream()
                        .filter(p -> p.getAge() > 22)
                        .sorted(comparing(Person::getAge).reversed())
                        .map(Person::getName)
                        .collect(toList());
```

Streams can also make checking for common characteristics between all objects in a `Collection` easier. If you need to check that all the objects in a list meet a requirement then look no further than `allMatch` or use `noneMatch` for the opposite. You can also check if any objects match the requirement using the aptly named `anyMatch` method. Furthermore these methods are ideal for using in parallel as you do not care about the order they are computed in the `boolean` result is all that matters. So remember to use the `parallelStream`!

```java
// allMatch
boolean areAllPeopleOlderThan20 = people.parallelStream().allMatch(p -> p.getAge() > 20);
// noneMatch
boolean areNoPeopleOlderThan20 = people.parallelStream().noneMatch(p -> p.getAge() > 20);
// anyMatch
boolean areAnyPeopleOlderThan20 = people.parallelStream().anyMatch(p -> p.getAge() > 20);

// allMatch equivalent
boolean areAllPeopleOlderThan20ForEach = true;
for(final Person person : people) {
    if (person.getAge() <= 20) {
        areAllPeopleOlderThan20ForEach = false;
        break;
    }
}
```

Limits can be applied to streams. This puts a limit onto the output of the of the stream. So adding `limit(2)` will limit the result to the first 2 elements that are to be mapped to the output. But be careful as the position in which `limit` is added will alter the outcome. An example will help explain this.

```java
// filtering before limiting
List<Person> getFirstTwoPeopleAbove22 = people.stream()
                .filter(p -> p.getAge() > 22)
                .limit(2)
                .collect(toList());
// limiting before filtering
List<Person> getTheFirst2PeopleAndApplyFilter = people.stream()
                .limit(2)
                .filter(p -> p.getAge() > 22)
                .collect(toList());
```

The first example applies the `filter` first which gets the all the people that are older than 22 and then applies the `limit` which reduces the result to the first 2 elements that made it through the `filter`. The second applies the `limit` first which causes it to take the first 2 elements from the `people` list and then `filter` them. This small change in order can greatly alter the outcome so be careful in where you position it.

Another useful feature of streams is the use of Numeric streams. One of the methods available to them is `sum()` which takes the mapped results and outputs the sum of results. To access a Numeric stream a different mapping needs to be applied. For example `mapToInt` will map works in a similar fashion to the normal `map` method but the mapped objects must be of primitive type `int`.

```java
// mapToInt
int totalOfAges = people.stream().mapToInt(Person::getAge).sum();

// mapToInt equivalent
int totalOfAgesEquivalent = 0;
for(final Person person : people) {
    totalOfAgesEquivalent += person.getAge();
```

In conclusion the Java 8 Stream is a useful addition and allows a lot of logic to be added without having to implement everything yourself, this is going to reduce the amount of times you will need to call `List.add`, but your probably never reach zero. Furthermore due to the use of Lambda expressions and Method references in conjunction with streams will greatly reduce the amount of code that needs to be written without making the code harder to understand.
