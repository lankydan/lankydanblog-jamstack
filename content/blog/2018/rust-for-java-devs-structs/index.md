---
title: Rust for Java Devs - Structs
slug: rust-for-java-devs-structs
date: "2018-03-01"
published: true
tags: [rust, java]
canonical_url: https://lankydanblog.com/2018/03/01/rust-for-java-devs-structs/
cover_image: ./rust-icon-with-background.jpg
include_date_in_url: true
---

Next up in Rust for Java Devs we have structs. They are used to hold data within a logical unit that can be passed to other functions or execute their own methods on the values that they store. Now this sounds very familiar... Java objects do the same thing. For example if you took a POJO (Plain Old Java Object) you also pass it to other methods or execute the object's own methods. In this nature they are alike, but they do have their differences. In this post we will look into creating structs, retrieving their values, defining their own methods and how to execute them.

## Creating a struct

Let's start with creating a struct.

```rust
struct Person {
  first_name: String,
  last_name: String,
  age: u32,
  weight: u32,
  height: u32,
}
```

Thats all there is to it. The name of the struct is `Person` which has 5 fields inside of it. The nice thing about how structs work compared to Java's objects is that no constructor equivalent needs to be defined to create struct (until accessability is taken into account). You simply list out the fields and it will just work.

Let's quickly compare the above Rust struct to a Java object.

```java
class Person {
  private String firstName;
  private String lastName;
  private int age;
  private int weight;
  private int height;

  Person(String firstName, String lastName, int age, int weight, int height) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.age = age;
    this.weight = weight;
    this.height = height;
  }
}
```

I'm sure the first thing you will notice is the much greater amount of code that is needed to achieve the same goal. We needed to first list the fields / properties and then write a constructor to create the object.

There are actually still a few more differences between the two just from these two snippets but we'll get to those in a minute. This amount of extra code (boilerplate code) is one of the main criticisms that people have with Java... Leading to the most common word that I hear about Java being "verbose".

So now we have defined a struct, how do we instantiate one to use in our code? Quite simple really.

```rust
let person = Person {
  first_name: String::from("John"),
  last_name: String::from("Doe"),
  age: 50,
  weight: 200,
  height: 180,
};
```

This looks deceptively like the definition of the struct itself. But this time rather than stating what data type is being used for each field we have passed values instead.

And now in Java.

```java
Person person = new Person("John", "Doe", 50, 200, 180);
```

As you can see the names of the fields have been omitted from the code when compared to Rust's structs. This can lead to Java constructors being slightly more difficult to use if there are lots of parameters of the same type as you could mistakenly order the input values and thus creating an object with incorrect values. A possible solution for this is to use the Builder pattern instead of using a constructor directly.

I mentioned above there are a few more differences between the struct and object that we defined earlier, so let's look at them.

What if I want to pass in values into a struct in a different order to how the fields are listed? Easy, the order doesn't matter.

```rust
let person = Person {
  age: 50,
  first_name: String::from("John"),
  height: 180,
  weight: 200,
  last_name: String::from("Doe"),
};
```

What if I wanted to only define some fields? Mmmm, well your out of luck there. All fields need to be initialized when a struct is created. If we tried to compile the code below.

```rust
let person = Person {
  first_name: String::from("John"),
};
```

The compiler will output.
<pre class="language-text">
<span style="color:#ff0000;">error[E0063]:</span> <strong>missing fields `age`, `height`, `last_name` and 1 other field in initializer of `Person`</strong>
 <span style="color:#3366ff;">--&gt;</span> src\main.rs:2:16
  <span style="color:#3366ff;">|
2 |</span>   let person = Person {
  <span style="color:#3366ff;">|</span>                <span style="color:#ff0000;">^^^^^^ missing `age`, `height`, `last_name` and 1 other field</span>

<span style="color:#ff0000;">error:</span> <strong>aborting due to previous error</strong></pre>
</div>

The error is self explanatory and states what / how many fields are missing. This is a decision Rust has made to make the language safer as it removes the possibility of a Null Pointer Exception / Error popping up as every value has to be set. Java does not have this requirement which can lead to null pointers occurring at run time from using an object's value that is still `null`.

How do the two points mentioned above differ from Java? In Java, you can input parameters into a constructor in different orders and you also don't need to initialize every field in the object. But, this comes with a catch. You need to create a new constructor for each order or number of parameters that you wish to pass in, or as I mentioned earlier, you could use the Builder pattern.

For example if we wanted to write constructors that would allow the two Rust snippets above to work, we would write.

```java
class Person {
  // fields
  Person(String firstName, String lastName, int age, int weight, int height) {
    // original constructor
  }
  Person(int age, String firstName, int height, int weight, String lastName) {
    // set values
  }
  Person(String firstName) {
    // set firstName
  }
}
```

A `Person` object can now be instantiated 3 different ways, although the last constructor is a bit risky due to `null` values on most of the fields and could lead to null pointer exceptions.

## Accessing struct values

Next up, we will look at retrieving values from a struct.

```rust
let first_name = person.first_name;
```

Thats about it. Whereas in Java you would write.

```java
String firstName = person.firstName;
```

This snippet relies on the `firstName` field being public, but this is considered bad practice in Java so you would normally write the below instead.

```java
String firstName = person.getFirstName();
```

This allows you to keep `firstName` private which provides you the flexibility to change the internals of the object without breaking existing code as long as the `getFirstName` is still available.

From my understanding of Rust structs, struct fields are private by default within a module (I know I haven't gone through modules yet). So if we make this simpler, if we ran the last Rust snippet in the same file as the struct was defined, it would work, if it was in a different file it would not. To make the fields publicly accessible we need to add the `pub` modifier onto each field, like so.

```rust
pub struct Person {
  pub first_name: String,
  pub last_name: String,
  age: u32,
  weight: u32,
  height: u32,
}
```

Here, `pub` was added onto the struct itself so it can be referenced from outside the module. The fields `first_name` and `last_name` are also marked with `pub` making them the only fields that could be used outside of the module when using the `Person` struct. This actually causes a problem, we have only 2 public fields, so when we go to construct a new `Person` instance, it will fail. This is the double edged sword of accessibility, if we want to hide some fields to prevent access it also means we can't pass values into them on construction, because technically we don't "know" about them. We will look at getting past this barrier later on.

If we tried to create an instance of the struct shown above from outside it's module, we would get the following error.

<pre class="language-text"><span style="color:#ff0000;">error[E0451]:</span> <strong>field `age` of struct `blog_post_sandbox::people::Person` is private</strong>
 <span style="color:#3366ff;">--&gt;</span> src\main.rs:8:5
  <span style="color:#3366ff;">|
8 |</span>     age: 50,
  <span style="color:#3366ff;">|</span>     <span style="color:#ff0000;">^^^^^^^ field `age` is private</span>

<span style="color:#ff0000;">error[E0451]:</span> <strong>field `weight` of struct `blog_post_sandbox::people::Person` is private</strong>
 <span style="color:#3366ff;">--&gt;</span> src\main.rs:9:5
  <span style="color:#3366ff;">|
9 |</span>     weight: 200,
  <span style="color:#3366ff;">|</span>     <span style="color:#ff0000;">^^^^^^^^^^^ field `weight` is private</span>

<span style="color:#ff0000;">error[E0451]:</span> <strong>field `height` of struct `blog_post_sandbox::people::Person` is private</strong>
  <span style="color:#3366ff;">--&gt;</span> src\main.rs:10:5
   <span style="color:#3366ff;">|
10 |</span>     height: 180,
   <span style="color:#3366ff;">|</span>     <span style="color:#ff0000;">^^^^^^^^^^^ field `height` is private</span>

<span style="color:#ff0000;">error:</span> <strong>aborting due to 3 previous errors
</strong></pre>

## Mutability

If you wanted to change the value of a struct field after it's original creation, it must be marked with `mut` making it mutable. In Rust you cannot choose which fields are mutable and which are not, either all fields are mutable or none are.

```rust
let mut person = Person {
  first_name: String::from("John"),
  last_name: String::from("Doe"),
  age: 50,
  weight: 200,
  height: 180,
};
person.first_name = String::from("Bob");
```

This will compile and when ran will change the `first_name` fields value from "John" to "Bob".

Just to prove I'm not lying, if we omitted the `mut` keyword and wrote the below instead.

```rust
let person = Person {
  first_name: String::from("John"),
  last_name: String::from("Doe"),
  age: 50,
  weight: 200,
  height: 180,
};
person.first_name = String::from("Bob");
```

You would get the following compiler error.

<pre class="language-text"><span style="color:#ff0000;">error[E0594]:</span> <strong>cannot assign to immutable field `person.first_name`</strong>
 <span style="color:#3366ff;">--&gt;</span> src\main.rs:9:3
  <span style="color:#3366ff;">|
2 |</span>   let person = Person {
  <span style="color:#3366ff;">|</span>       <span style="color:#3366ff;">------ consider changing this to `mut person`</span>
...
<span style="color:#3366ff;">9 |</span>   person.first_name = String::from("Bob");
 <span style="color:#3366ff;"> |</span>   <span style="color:#ff0000;">^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ cannot mutably borrow immutable field</span>

<span style="color:#ff0000;">error:</span> <strong>aborting due to previous error
</strong></pre>

Comparing this to Java, we would normally use a setter if we wanted to make changes to our objects. Like so.

```java
person.setFirstName("Bob");
```

Using setters also makes it easy to control which fields we wish to be mutable. If we don't create a setter and the field is private, then the field's value can't change. Simple.

## Methods and Associated Functions

We have now got to the point where we can make our structs actually do things.

I personally think how methods are written in Rust are very different to those in Java. You can form your own opinion once we have gone through this section.

To define methods in Rust we first need to create an implementation block.

```rust
struct Person {
  first_name: String,
  last_name: String,
  age: u32,
  weight: u32,
  height: u32,
}

impl Person {
  // methods go here
}
```

It looks almost the same as the code we have seen throughout this post but with the addition of an implementation block that is created using the `impl` keyword along with the struct's name (in this case `Person`).

Now we can start adding some methods into the block. I will omit the creation of the struct's fields from code snippets for now.

```rust
impl Person {
  pub fn full_name(&self) -> String {
    [&self.first_name.to_string(), " ", &self.last_name.to_string()].concat()
  }
}
```

Here we have a method that is tied to the struct that it is invoked on. `&amp;self` is what distinguishes this as an instance method as it has access to it's own values. `self` and `&amp;mut self` can be used instead while keeping it as an instance method. I still need to go into what these syntaxes mean, but in short, `&amp;self` allows you to use the struct's own values without effecting any other code (doesn't take ownership of the `Person` instance), `&amp;mut self` is the same but allows changes to the instance and `self` prevents any code that occurs after the method is invoked to use the `Person` instance that was used. Some of this might sound confusing, but that's due to my bad ordering of writing these posts... I should probably write about ownership sometime soon.

The method has also been marked with `pub` so it can be used outside of it's module, it can be removed if access should be more restrictive.

In general, it looks very similar to normal a Rust function.

To call the this method we need to write.

```rust
let full_name = person.full_name();
```

The `&amp;self` reference is taken as the `person` instance and does not need to be passed into the method manually. If we wanted to pass in another parameter into a method, it would look like.

```rust
impl Person {
  pub fn full_name_with_random_parameter(&self, random_parameter: &str) -> String {
    [&self.first_name.to_string(), " ", &self.last_name.to_string(), " ", random_parameter].concat()
  }
}
```

And invoked by.

```rust
let random_full_name = person.full_name_with_random_parameter("I'm a string");
```

If we take a moment to compare Rust's instance methods to Java's the biggest difference is the passing in of `&amp;self` into the method to be able to access it's fields. In Java you can access an object's owns fields directly or by using the `this` keyword (like `&amp;self` is used in Rust) and does not require any sort of reference to itself to be passed in as a parameter.

The above method would simply look like this when written in Java.

```java
public String fullNameWithRandomParameter(final String randomParameter) {
  return firstName + " " + lastName + randomParameter;
}
```

or

```java
public String fullNameWithRandomParameter(final String randomParameter) {
  return this.firstName + " " + this.lastName + randomParameter;
}
```

So if we pass in `&amp;self` into a method it becomes an instance method, then what happens if we don't? Well, technically they become functions instead of methods, associated functions to be precise because they are functions that are "associated" to a struct (such a helpful explanation...). They don't require an instance to be invoked which might sound familiar coming from Java. That's right (I'll assume figured it out), they are like Java's static methods.

So let's look at an example.

```rust
impl Person {
  pub fn new(first_name: String, last_name: String, age: u32, weight: u32, height: u32) -> Person {
    Person {
      first_name: first_name,
      last_name: last_name,
      age: age,
      weight: weight,
      height: height,
    }
  }
}
```

This method is effectively a constructor to create a new `Person` instance from outside of the `Person`'s module. If you recall to earlier in this post (actually quite long ago now), I mentioned that if any struct fields are private then code outside of it's module cannot create any instances of the struct... Well, this is the solution. By using a public constructor function we can still control accessibility without restricting where instances can be created.

Comparing this function to the methods we looked at previously, the only real difference is that there is no reference to `&amp;self` and therefore no instance tied to the function.

Calling an associated function is a little different from a struct method.

```rust
let person = Person::new(String::from("John"), String::from("Doe"), 50, 200, 180);
```

As the function is not related to an instance it uses the struct's type of `Person` to invoke the function. Another difference is the `::` syntax used to execute it instead of the typical `.` for an instance method. Using this information we can now classify that `String::from` which has been used in most of the Rust examples in this post is an associated function. Allowing a new `String` struct to be created from a `&amp;str` string because the struct's single field is not publicly available.

As a Java static method is the equivalent of associated function, let's take a look at one.

```java
public static void create(final String firstName, final String lastName, final int age, final int weight, final int height) {
  return new Person(firstName, lastName, age, weight, height);
}
```

Nothing particularly interesting to say about this, except for the name of the method. I needed to name this method `create` rather than `new` like in the Rust version, because `new` is a keyword in Java for creating new instances via constructors.

One nice feature before we finish. When creating a struct, if you have a variable whose name matches a struct's field directly, it's value will be passed in without a need to directly assign the value to the field. I can't think of a nice way to explain it in English, so we will use the language we understand better, code!

```rust
impl Person {
  pub fn new(first_name: String, last_name: String, age: u32, weight: u32, input_height: u32) -> Person {
    Person {
      first_name,
      last_name,
      age,
      weight,
      height: input_height,
    }
  }
}
```

As you can see `first_name`, `last_name`, `age` and `weight` are passed in as parameters whose values are then used directly in creating the `Person` struct. `input_height` does not match up and therefore still needs to be passed in manually. This cannot be done in Java so there is nothing to compare it to.

Finally, we have made it to the end... That was a lot longer than I was expecting it to be.

In conclusion Rust structs are like Java's objects, allowing us to group together data within a logical unit. Methods can then be invoked on the data held inside a struct instance but remember to add a `&amp;self` reference or it won't work. We also have associated functions that don't require an instance and can be used to construct a struct instance without access to it's private fields. We can also access data from a struct but we need to make sure we actually have access to the fields we are interested in.

There is definitely a lot of stuff in this post and I appreciate that it probably took a while to go through it all. If you found this post helpful then maybe my previous Rust for Java Devs posts will also provide value. As always, please share this post if you liked it and follow me on twitter at [@LankyDanDev](https://twitter.com/LankyDanDev) to keep up with my new posts as I write them.