---
title: Java friendly Kotlin - static functions
slug: java-friendly-kotlin-static-functions
date: "2020-03-18"
published: true
tags: [kotlin, java]
series: Java friendly Kotlin
cover_image: blog-card.png
---

In this post, we will look at writing static functions in Kotlin that treat Java callers as first-class citizens.

## Recap

There are three ways to define static functions in Kotlin:

- Directly in a Kotlin file:

    ```kotlin
    fun execute() {
      println("Executing from inside a kotlin file")
    }
    ```

  Called by:

    ```kotlin
    execute()
    ```

- Inside a `Companion` object:

    ```kotlin
    class StaticFunctions {
      companion object {
        fun execute() {
          println("Executing from inside a companion object")
        }
      }
    }
    ```

  Called by:

    ```kotlin
    StaticFunctions.execute()
    StaticFunctions.Companion.execute() // If you really wanted to...
    ```

- Inside a static object:

    ```kotlin
    object StaticFunctions {
      fun execute() {
        println("Executing from inside a static object")
      }
    }
    ```

    Called by:

    ```kotlin
    StaticFunctions.execute()
    ```


## Non-friendly static functions

The functions defined above are not _friendly_. This is how you would call each of them from Java:

- Directly in a Kotlin file:

    ```java
    StaticFunctionsKt.execute();
    ```

- Inside a `Companion` object:
  
    ```java
    StaticFunctions.Companion.execute();
    ```

- Inside a static object:

    ```java
    StaticFunctions.INSTANCE.execute();
    ```

They all look pretty bad. I would use more vulgar words if I wasn't writing... 

- `StaticFunctionsKt.execute` is not too bad, it is relatively close to a standard Java static function. Except, that it's clear that it came from a Kotlin file/library due to the `Kt` stuck onto the end.

- `StaticFunctions.Companion.execute` is much worse as you have to reference the `Companion` object directly to access the function. Furthermore, mentioning the `Companion` object doesn't bring any extra clarity to the code, so even more reason to try and remove it.

- `StaticFunctions.INSTANCE.execute` has the same problem as the `Companion` version.

## Writing Java friendly static functions

The three ways of defining static functions in Kotlin can each have their Java interoperability improved through different routes.

### JvmName
  
The `@file:JvmName` annotation can be added to the top of a Kotlin file to allow you to manually specify the file's name:

```kotlin
@file:JvmName("StaticFunctions")

package dev.lankydan

fun execute() {
  println("Executing from inside a kotlin file")
}
```

This allows a function to be called from Java using the specified file name rather than the original name. Any name can be chosen for the file, but most of the time, giving it the same name as the original file will suffice (the `Kt` part is dropped from the end).

This can then be called as such: 

```java
StaticFunctions.execute();
```

### JvmStatic
  
The `@JvmStatic` annotation can be added to functions found in `Companion` and static objects:

  - Inside a `Companion` object:
  
    ```kotlin
    class StaticFunctions {
      companion object {
        @JvmStatic
        fun execute() {
          println("Executing from inside a companion object")
        }
      }
    }
    ```
  
  - Inside a static object:

    ```kotlin
    object StaticFunctions {
      @JvmStatic
      fun execute() {
        println("Executing from inside a static object")
      }
    }
    ```

`@JvmStatic` generates a new version of a function that is more suitable for Java callers. 

You can then access the function just like any normal Java static function (both `Companion` and static objects can be called in the same way):

```java
StaticFunctions.execute();
```

## Which one should you use

This is a question I am still trying to answer myself. 

I currently believe that if you are writing a purely static function, you should add the function directly to the file (not inside a `Companion` or static object). The inclusion of the class clutters things up.

On the other hand, you should use a `Companion` or static object if you need to fulfil the following criteria:

- A class/object must be directly referenced (such as passing an instance into another function)
- Provide static functions

## Summary

By using the `@file:JvmName` and `@JvmStatic` annotations, you can write static Kotlin functions that can be used from Java in a nice and friendly way. It doesn't matter how you define your static functions, as you have methods to make them all play better with Java.

----

If you enjoyed this post or found it helpful (or both) then please feel free to follow me on Twitter at [@LankyDanDev](https://twitter.com/LankyDanDev) and remember to share with anyone else who might find this useful!