---
title: Building with the Builder Pattern
date: "2017-04-01"
published: true
tags: [java, patterns]
include_date_in_url: true
cover_image: blog-card.png
---

If you have ever looked at a long constructor and got confused about the order that input values need to be added then I am here to help! The Builder Pattern helps expel& this confusion as it removes the need for this long constructor and replaces it the a series of setters which make it clear as to what the input values represent. But why not just add a default constructor and use setters? This is a possible solution if you do not care about immutability at all whereas using the Builder Pattern allows this constraint to be kept.

In this post we will look at why we use the Builder Pattern and how to implement it.

As mentioned in the introduction long constructors can be very confusing. Personally I have used one with at least 15 parameters and I had to spend ages making& sure I had put them all in the right order. What I should have done is create a builder for the class so I could be 100% sure that I had set everything correctly.

```java
public class Person {

  private String firstname;
  private String middlename;
  private String surname;
  private int age;
  private int height;
  private int weight;
  private String country;

  public Person(
      final String firstname,
      final String middlename,
      final String surname,
      final int age,
      final int height,
      final int weight,
      final String country) {
    this.firstname = firstname;
    this.middlename = middlename;
    this.surname = surname;
    this.age = age;
    this.height = height;
    this.weight = weight;
    this.country = country;
  }

  // getters and/or setters

}
```

This class's constructor isn't to bad, but it's just an example after all. So it has a reasonable number parameters in its constructor and if you saw it in your code you might be able to figure out what the names represent but `age`, `height` and `weight` might not be so obvious and really everything you write should be as easy to understand as possible.

So how do we write the builder?

```java
public class Person {

  private String firstname;
  private String middlename;
  private String surname;
  private int age;
  private int height;
  private int weight;
  private String country;

  private Person(
      final String firstname,
      final String middlename,
      final String surname,
      final int age,
      final int height,
      final int weight,
      final String country) {
    this.firstname = firstname;
    this.middlename = middlename;
    this.surname = surname;
    this.age = age;
    this.height = height;
    this.weight = weight;
    this.country = country;
  }
  
  // getters and/or setters

  public static class Builder {

    private String firstname;
    private String middlename;
    private String surname;
    private int age;
    private int height;
    private int weight;
    private String country;

    public Person build() {
      return new Person(firstname, middlename, surname, age, height, weight, country);
    }

    public Builder withFirstname(final String firstname) {
      this.firstname = firstname;
      return this;
    }

    public Builder withMiddlename(final String middlename) {
      this.middlename = middlename;
      return this;
    }

    public Builder withSurname(final String surname) {
      this.surname = surname;
      return this;
    }

    public Builder withAge(final int age) {
      this.age = age;
      return this;
    }

    public Builder withHeight(final int height) {
      this.height = height;
      return this;
    }

    public Builder withWeight(final int weight) {
      this.weight = weight;
      return this;
    }

    public Builder withCountry(final String country) {
      this.country = country;
      return this;
    }
  }
}
```

The first thing your notice is that there is a lot more code but that is the sacrifice that needs to be made to make your life easier down the road. The builder is an inner public class inside the `Person` class which allows us to make the `Person` constructor private so nobody can see and use it, leaving the only way to create a Person object is via the builder. The builder contains a series of methods, setters for each property in the class and a method that creates or "builds" the `Person` object and returns it. The setters also return the Builder allowing them to be chained together.

Below is how you would use the builder to construct a Person object.

```java
final Person person =
    new Person.Builder()
        .withFirstname("Dan")
        .withMiddlename("K")
        .withSurname("Newton")
        .withAge(23)
        .withHeight(200)
        .withWeight(1000)
        .withCountry("UK")
        .build();
```

Personally there is one thing that I do not like about how this class is written which is due to the constructor still being long, it's just now it can't be used from outside this class. Another way to write this constructor is to simply pass the builder into it instead.

```java
public class Person {

  // person properties

  private Person(final Builder builder) {
    this.firstname = builder.firstname;
    this.middlename = builder.middlename;
    this.surname = builder.surname;
    this.age = builder.age;
    this.height = builder.height;
    this.weight = builder.weight;
    this.country = builder.country;
  }

  // getters and/or setters
  
  public static class Builder {

    // builder properties

    public Person build() {
      return new Person(this);
    }

    // builder setters

  }
}
```

Now the main problem you will run into with using the Builder Pattern is that you might forget to call one of the setters whereas if you have a single constructor that sets all the properties you will know that you have set them all, even if you are just setting them to null. So this might not be a problem if some are not set but you might want to make sure that the most important properties are set, such as an ID, below is a solution to this.

```java
public class Person {

  // person properties

  private Person(final Builder builder) {
    this.firstname = builder.firstname;
    this.middlename = builder.middlename;
    this.surname = builder.surname;
    this.age = builder.age;
    this.height = builder.height;
    this.weight = builder.weight;
    this.country = builder.country;
  }

  // getters and/or setters

  public static class Builder {

    // builder properties

    public Person build(final String firstname, final String surname) {
      this.firstname = firstname;
      this.surname = surname;
      return new Person(this);
    }

    // builder setters, excluding firstname and surname setters
    
  }
}
```

The `firstname` and `surname` are ensured to be set as the build method takes in these values, sets them and then creates the object.

Another advantage of using the Builder Pattern is creating an object with only a few properties set. Instead of passing loads of nulls into the objects constructor or creating a new one that only takes in these particular values as inputs you can simply call the builders setters for these instead. This should make your code look tidier as you wont have loads of nulls being passed in.

Using constructor

```java
new Person("Dan", null, null, 100, 100, 100, null);
```

Using builder

```java
new Person.Builder().withFirstname("Dan").withAge(23).withHeight(200).withWeight(1000).build();
```

This last code snippet below isn't part of the Builder Pattern but is something that I like to chuck in if I want to ensure that all the data is set up correctly and none of the properties have been forgotten or set to null. You might want to do this if all the data in an object is important and you don't want any values to be null.

```java
private Person(final Builder builder) {
  validate(builder);
  this.firstname = builder.firstname;
  this.middlename = builder.middlename;
  this.surname = builder.surname;
  this.age = builder.age;
  this.height = builder.height;
  this.weight = builder.weight;
  this.country = builder.country;
}

private void validate(final Builder builder) {
  Objects.requireNonNull(builder.firstname, "firstname is required");
  Objects.requireNonNull(builder.middlename, "middlename is required");
  Objects.requireNonNull(builder.surname, "surname is required");
  Objects.requireNonNull(builder.age, "age is required");
  Objects.requireNonNull(builder.height, "height is required");
  Objects.requireNonNull(builder.weight, "weight is required");
  Objects.requireNonNull(builder.country, "country is required");
}
```

All it does is check that each property is not null otherwise a `NullPointerException` will be thrown. Obviously this will cause the code to break if any of these are not set, but hopefully you will test your code and this allows it to only fail at the point of creating the object rather than getting a `NullPointerException` further down the line or even not seeing an error occur at all and instead persisting a null value to the database without realizing.

In conclusion the Builder Pattern removes the need for a public constructor which might have a large amount of inputs by using the builders setters while keeping immutability if required as the objects setters are not used to create it. The annoying feature of this pattern is all the extra code that needs to be written but this cost is outweighed by the benefit of greater readability. So next time you see a really long constructor, go write a builder for it!
