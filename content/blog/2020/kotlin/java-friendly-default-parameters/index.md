---
title: Java friendly Kotlin - default arguments
slug: java-friendly-kotlin-default-arguments
date: "2020-06-25"
updated_date: "2020-06-30"
published: true
tags: [kotlin, java]
series: Java friendly Kotlin
cover_image: blog-card.png
---

Kotlin functions and constructors can define default arguments, allowing calls to them to skip any argument that has a default value.

This allows the following function to be called in a number of ways:

```kotlin
fun doStuff(
  a: String = "Default value",
  b: Int = 1,
  c: Boolean = false
)

doStuff()
doStuff("here's a value")
doStuff("here's a value", 2)
doStuff("here's a value", 2, true)
doStuff("here's a value", c = true)
doStuff(b = 2)
doStuff(c = true)
doStuff(b = 2, c = true)
```

More information can be found in the [Kotlin documentation](https://kotlinlang.org/docs/reference/functions.html#default-arguments).

For the rest of this post, we will look at how you can include default arguments in your API while still providing excellent Java compatibility.

## Trying to call an unfriendly Kotlin function

You are not going to have a good time calling a function or constructor with default arguments from Java. The only way to call the function shown previously from Java is to provide every argument that it asks for:

```java
doStuff("here's a value", 2, true);
```

Without some help, there is no way for Java to understand the concept of default arguments.

## Applying the @JvmOverloads annotation

The `@JvmOverloads` annotation can be applied to functions and constructors to tell the compiler to generate extra overloads depending on their default arguments. The overloads are placed in the compiled bytecode. You can then execute them from Java as you would with any other function or constructor.

Let's have a look at the KDoc for `@JvmOverloads` which has a precise declaration of how it generates overloads:

```kotlin
/**
 * Instructs the Kotlin compiler to generate overloads for this function that 
 * substitute default parameter values.
 *
 * If a method has N parameters and M of which have default values, M overloads 
 * are generated: the first one takes N-1 parameters (all but the last one that 
 * takes a default value), the second takes N-2 parameters, and so on.
 */
@Target(AnnotationTarget.FUNCTION, AnnotationTarget.CONSTRUCTOR)
@Retention(AnnotationRetention.BINARY)
@MustBeDocumented
public actual annotation class JvmOverloads
```

In other words:

- Starts at the last argument.
- If the argument has a default value, an overload is generated without that argument, who uses the default value in its implementation.
- If the penultimate argument has a default value, an overload without the last 2 arguments is generated.
- Continues to apply this logic until it reaches the first argument or hits an argument that does not have a default value.

Some examples should help grasp this definition.

Below are the different ways to call the `doStuff` function from earlier in Java:

```kotlin
// All arguments have default values
@JvmOverloads
fun doStuff(
  a: String = "Default value",
  b: Int = 1,
  c: Boolean = false
)
```

```java
// Ways to call [doStuff] from Java
doStuff();
doStuff("here's a value");
doStuff("here's a value", 2);
doStuff("here's a value", 2, true);
```

There are now 4 options for Java to trigger (instead of 1 without the annotation). All the arguments have been removed, one by one, leaving 3 overloads where 1 requires no inputs at all.

It we remove one of the default values, then the generated options will change:

```kotlin
// Remove default value from [b]
@JvmOverloads
fun doStuff(
  a: String = "Default value",
  b: Int,
  c: Boolean = false
)
```

```java
// Ways to call [doStuff] from Java
doStuff("here's a value", 2);
doStuff("here's a value", 2, true);
```

Now, when creating overloads, the compiler hits `b` (second argument) and stops. It does not matter that `a` has a default value, the compiler will not progress from this point. Therefore, only a single extra overload is available to Java.

Applying the annotation to a class' constructor requires a slight manipulation to its structure:

```kotlin
class MyJvmOverloadsClass @JvmOverloads constructor(
  private val a: String = "Default value",
  private val b: Int = 1,
  private val c: Boolean = false
) {

  // Rest of the class
}
```

The annotation must be applied directly to one of the class' constructor. In this case, as there is only a single constructor, the `constructor` keyword must be added (this can typically be omitted in a Kotlin class). Applying the annotation generates overloads in the same way that it does to a function.

## The annotation isn't perfect

The issue with the `@JvmOverloads` annotation is that it does not generate every possible combination of arguments. Kotlin can bypass this as it has access to named arguments. 

Java does not have this ability. Even with the `@JvmOverloads` annotation, this is what prevents Java from accessing all the same options as Kotlin. 

It makes sense when you think about it.

A function or constructor can only be overloaded when it has different arguments from all other versions, for example (written in Kotlin but Java follows the same rules):

```kotlin
fun doStuff(a: String = "Default value"): String
fun doStuff(a: String = "Default value", b: Int = 1): String
fun doStuff(a: String = "Default value", b: Int = 1, c: Boolean = false): String
// Return type can be different as long as it has different arguments
fun doStuff(a: String = "Default value", b: Int = 1, c: Boolean = false, d: Long = 2): Int
```

The difference between each overload is clear because the argument types are different. But if they were all the same type it becomes harder to use:

```kotlin
fun doStuff(a: String = "Default value"): String
fun doStuff(a: String = "Default value", b: String = "Another value"): String
fun doStuff(a: String = "Default value", b: String = "Another value", c: String = "Another one"): String
```

Named arguments makes this bearable (assuming they are named better than `a`, `b` and `c`). Allowing you to omit some arguments due to their default values.

Without the use of named arguments, the is no way for the compiler to distinguish between the objects that you pass to this function. So all it can do is pass them in, one by one, in order, into the function. This is the problem that `@JvmOverloads` faces. It cannot generate all possible iterations because there is not enough information to differentiate the overloads from each other. If all the arguments have different types, then technically the compiler can do it, but having a rule that is loosely applied would become confusing. 

This is the reason that `@JvmOverloads` only generates overloads starting from the last argument, who must also have a default value, and then moves onto the next (backwards towards the first argument).

## Cooperating with the annotation

You can work around the limitations of `@JmvOverloads`. Doing so requires you to think about how your functions will be used and what combinations of parameters will be frequently used.

Below are some points for you to consider when writing a function annotated with `@JvmOverloads`:

1. Order the arguments in order of importance, the first as the most important and decreasing as they go on.

    ```kotlin
    @JvmOverloads
    fun doStuff(
      superImportant: String = "I need this argument!",
      reallyImportant: Int = 1,
      somewhatImportant: Boolean = false,
      dontReallyCareAboutThisOne: Long = 2
    )
    ```

2. Do not mix arguments with default values with ones that do not (easier to understand with the example).

    ```kotlin
    // Stops generating overloads when [doesNotHaveDefaultValue] is reached
    @JvmOverloads
    fun doStuff(
      hasDefaultValue: String = "I need this argument!",
      doesNotHaveDefaultValue: Int,
      hasDefaultValue2: Boolean = false,
      hasDefaultValue3: Long = 2
    )
    

    // No overloads can be generated
    @JvmOverloads
    fun doStuff(
      hasDefaultValue: String = "I need this argument!",
      doesNotHaveDefaultValue: Int,
      hasDefaultValue2: Boolean = false,
      doesNotHaveDefaultValue2: Long
    )
    ```

3. Manually create overloads if there are still combinations missing that you deem useful.

    ```kotlin
    // Original
    @JvmOverloads
    fun doStuff(
      a: String = "I need this argument!",
      b: Int = 1,
      c: Boolean = false,
      d: Long = 2
    )

    // Calling with just [a] and [c] is useful
    fun doStuff(a: String, c: Boolean) {
      // Add in the missing parameters
      // Copy the default values or maybe they are taken from properties of a class
      // instead of being passed into the function
      return doStuff(a, 1, c, 2)
    }
    ```

The main piece of advice I want to give you here is to really think about the functions you create. When creating a public API as part of a library, especially when you want it to play well with Java, spending time considering how your functions will be leveraged will make everyone happier. 

Developers consuming a Kotlin API when using the language themselves can use its features to get around potential problems in your code. Java, on the other hand, requires you to apply some of your brainpower to write functions that are friendly to use.

## Summary

Adding the `@JvmOverloads` annotation to your functions and constructors persuades them to play nicer with Java. It does so by generating additional overloads and placing them in the bytecode that Java interacts with. Adding the annotation does not always make your API easily accessible to Java, in those situations, it is on you to put the work in and craft a well thought out API.

----

If you enjoyed this post or found it helpful (or both) then please feel free to follow me on Twitter at [@LankyDanDev](https://twitter.com/LankyDanDev) and remember to share with anyone else who might find this useful!