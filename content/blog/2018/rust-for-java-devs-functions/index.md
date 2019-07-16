---
title: Rust for Java Devs - Creating Functions
slug: rust-for-java-devs-creating-functions
date: "2018-02-18"
published: true
tags: [rust, java]
cover_image: ./rust-icon-with-background.png
include_date_in_url: true
---

In this post of Rust for Java Devs we will look at creating functions in Rust. Functions in Rust do not differ that much from Java methods but there are a few little differences. There is also the topic of Rust's lifetimes compared to Java's garbage collection that one could argue separates the two from each other a bit more, but for this post I will focus on the structure of writing a function in Rust. Due to the similarities between the two, I believe most Java developers will have no problem in figuring out what arguments a Rust function takes, what it outputs and where the output is returned from.

Lets start with a simple method in Java to get us warmed up.

```java
public static void print(final String input) {
  System.out.println("I am printing the value: " + input);
}
```

There is nothing special about this method, it takes in a `String` and prints it (along with some other text). It does not return anything hence the `void` return type and it can be publicly accessed due to defining it as `public`. The method is also static removing the need of an instance to call it. Note that I have included the `final` keyword, although it is pointless for this method I am trying to bring it closer in line with how Rust works (immutability by default).

Now lets look at the equivalent in Rust.

```rust
pub fn print(input: &str) {
  println!("I am printing the value: {}", input)
}
```

At this point I would say this is pretty clear for a Java developer what is happening, with only one difference that might not be as obvious. We can see that the function is public due to the `pub` keyword, that the function accepts a `String` as its only argument and then goes on to print the input value. One thing that is not included is the return type. That is because this function doesn't return anything but unlike the Java version it does not need to be marked with `void`. The missing return type is basically an implicit declaration that the method does not return anything.

The return types of Rust's functions should become clearer after we have gone through the next snippet below.

```rust
pub fn add(x: i32, y: i32) -> i32 {
  x + y
}
```

In this snippet we have gained an extra bit of code that wasn't seen in the previous example. The `-&gt; i32` that has appeared is declaring it's return type. The above function is saying that it takes in two `i32` numbers and then returns the addition of them also as an `i32`. The other thing to notice is the missing `return` keyword that would need to be included in Java.

A bit of background context is required here before I finish explaining the missing `return` keyword in this Rust function. Rust is comprised of statements and expressions. Statements are instructions that perform an action but do not return a value. Expressions are instructions that evaluate to a value. Therefore writing `1 + 2` is an expression that evaluates to `3`. Hold onto this barely explained concept while we look back at the function above.

A Rust function returns the last expression written in it. This is why we can omit the `return` keyword because we can just output the last expression of the function. So if we look back at the earlier snippet `x + y` is the last expression therefore it's value is computed and returned.

There is one last pitfall we need to cross over regarding the last expression in a function, it cannot have a semicolon at the end of it's line. Adding it on prevents the expression from being returned and changes the actual return type of the function to `void` / no value returned. If we tried to compile the previous function it won't build and will print the following compilation error.

<pre class="language-text"><span style="color:#ff0000;">error[E0308]</span>: <strong>mismatched types</strong>
  <span style="color:#3366ff;">--&gt;</span> src\main.rs:14:35
   <span style="color:#3366ff;">|</span>
<span style="color:#ff0000;">14</span> <span style="color:#3366ff;">|</span>   pub fn add(x: i32, y: i32) -&gt; i32 {
   <span style="color:#3366ff;">|</span>  <span style="color:#ff0000;">___________________________________^</span>
<span style="color:#3366ff;">15</span> <span style="color:#3366ff;">|</span> <span style="color:#ff0000;">|</span>   x + y;
   <span style="color:#3366ff;">|</span> <span style="color:#ff0000;">|</span>        <span style="color:#3366ff;">- help: consider removing this semicolon</span>
<span style="color:#3366ff;">16</span> <span style="color:#3366ff;">|</span> <span style="color:#ff0000;">|</span> }
   <span style="color:#3366ff;">|</span> <span style="color:#ff0000;">|_^ expected i32, found ()</span>
   <span style="color:#3366ff;">|</span>
   = <strong>note</strong>: expected type `i32`
              found type `()`

<span style="color:#ff0000;">error</span>: <strong>aborting due to previous error
</strong></pre>

The error is very helpful and politely asks us to remove the semicolon, although you could consider it impolite being the compiler refuses to compile our code. It also shows that rather than the `i32` return type that the function says it returns, nothing is returned instead as indicated by the found type of `()`.

Ok, back to looking at the `return` keyword. If you really wanted to use it in the example you could, but there is no reason to. The real reason why you still need the `return` keyword in Rust is to return early from a method, just like you have probably done in Java many times already. For example if we wanted to write the Rust equivalent of the below Java method.

```java
public static boolean contains(final List<Integer> collection, final int number) {
  for (final int element : collection) {
    if (element == number) {
      return true;
    }
  }
  return false;
}
```

We would write.

```rust
pub fn contains(collection: Vec<i32>, number: i32) -> bool {
  for element in &collection {
    if *element == number {
      return true
    }
  }
  false
}
```

I am aware that there is some syntax that I haven't covered and might look alien. But stick with me and just focus on the `for` loop that iterates through the collection (`Vec` represents Vector which is like a Java `List`) and returns `true` if the collection contains the input number. To return `true` early we need to use the `return` keyword. It is also worth noting that there, like earlier, is no semicolon on this line, but we could add one if we wanted to and it would still compile in this situation.

There are a few more points I want to cover in this post such as function accessibility and static methods, but unfortunately I believe we first need to go through some other topics before we have all the knowledge required to fully understand them.

I think for a first look into Rust functions we have covered enough to get going but there is still much more to look into.

In conclusion Rust functions are not too dissimilar to Java methods. We have seen that both need to define a return type except for functions that return nothing, where Rust's `void` type is implicit whereas Java's is explicit. That all arguments must be marked with their types, that the `return` keyword is optional on the last expression of a function but still required when returning a value early and that semicolons can be omitted on lines that return values but 100% required on a function's last expression. We have also seen how that we can add `pub` to a function to make it publicly accessible but we didn't look any further into the subject as I have not covered the required topics that they build upon.

If you found this post helpful and wish to keep up to date with my new tutorials as I write them, follow me on Twitter at [@LankyDanDev](https://twitter.com/LankyDanDev). You can also contact me here or on twitter if I have made any mistakes while talking about Rust as I am still in the early days of learning the language and would be grateful for any constructive feedback.