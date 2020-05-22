---
title: Calling Java Functional Interfaces from Kotlin
date: "2020-02-10"
published: true
tags: [kotlin, java]
---

## Basics

Below is a Functional Interface defined in Java:

```java
// Standard Java interface
public interface Executor {
    void execute(Runnable command);
}
```

> Note, that an interface does not _need_ to be annotated with `@FunctionalInterface` to be treated as one.

In Kotlin, this can be implemented with the following code:

```kotlin
executor.execute { println("I am a runnable") }
```

As the `Executor` interface has only a single function, with a single input parameter, it can assign a type to the lambda passed to `execute`. This removes the need to define it explicitly as `Runnable`. This is known as SAM (**S**ingle **A**bstract **M**ethod) conversion, see the [Kotlin docs](https://kotlinlang.org/docs/reference/java-interop.html) for more information.

A more verbose way to achieve the same goal looks like:

```kotlin
executor.execute(Runnable { println("I am a runnable") })
```

> If you are using Intellij, it will kindly guide you to the first solution.

## Single-type generics

Let's make it a bit more exciting and include some generics this time round. Taking the Java interface and a function to call it:

```java
@FunctionalInterface
public interface MyJavaInterfaceWithGenerics<A> {
  A execute();
}

public static <A> A doStuff(MyJavaInterfaceWithGenerics<A> myJavaInterface) {
  return myJavaInterface.execute();
}
```

The `doStuff` function can be called with the following Kotlin code:

```kotlin
// Least simplified
doStuff(MyJavaInterfaceWithGenerics<String> { "hi" })
// A bit more simplified
doStuff(MyJavaInterfaceWithGenerics { "hi" })
// Specify generic type explicitly
doStuff<String> { "hi" }
// Let Kotlin do the work
doStuff { "hi" }
```

The return type of the most simplified code is determined by the lambda's result, which in this case is a `String`.

## Multi-type generics

What about when the generics get a bit more complicated? I have spiced up the example code a bit to demonstrate this:

```java
@FunctionalInterface
public interface MyJavaInterfaceWithGenerics<A, B, C> {
  C execute(A a, B b);
}

public static <A, B, C> C doStuff(A a, B b,  MyJavaInterfaceWithGenerics<A, B, C> myJavaInterface) {
  return myJavaInterface.execute(a, b);
}
```

I actually had a bit of trouble thinking of an example to demonstrate both input and output generics. I believe this code is pretty ugly and is unlikely to represent genuine code. Still, it should be good enough for an example.

To call this you would use the code below:

```kotlin
// Least simplified
doStuff(1, 2L, MyJavaInterfaceWithGenerics<Int, Long, String> { a, b -> "hi" })
// Determine types from lambda instead of defining on the interface
doStuff(1, 2L, MyJavaInterfaceWithGenerics { a: Int, b: Long -> "hi" })
// Simplified some more
doStuff(1, 2L, { a, b -> "hi" })
// Fully simplified (extract lambda out of brackets)
doStuff(1, 2) { a, b -> "hi" }
// Determine type information from lambda (not all types had to be provided here)
// Removing the [Long] type will cause the compiler to choose an [Int] instead
doStuff(1, 2) { a, b: Long -> "hi" }
```

As I mentioned a second ago, realistically, the generic input types `A` and `B` in this example would be provided from an external source. Furthermore, the generic types would be specified on an overarching class or be locked down to specific types from the beginning.

----

If you enjoyed this post or found it helpful (or both) then please feel free to follow me on Twitter at [@LankyDanDev](https://twitter.com/LankyDanDev) and remember to share with anyone else who might find this useful!