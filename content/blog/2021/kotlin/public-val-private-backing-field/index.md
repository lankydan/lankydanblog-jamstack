---
title: Public val with a private backing field
date: "2021-03-14"
published: true
tags: [kotlin]
cover_image: blog-card.png
---

As learnt through many years of writing Java code, we have come to the collective decision to use getters and setters instead of directly accessing a class' properties. However, this seems to slightly butt heads with Kotlin providing language support for exposing class properties directly through `val` and `var` rather than getters and setters.

Ok, yes, in Kotlin, it is a bit more nuanced as it allows you to define a `get` and `set` method for `val`s and `var`s (where appropriate), although this can become awkward to use in some scenarios.

Take the following code as an example:

```kotlin
class BackingProperty {

  val list: List<String> = mutableListOf()
    // Return a copy to prevent modification outside the class
    get() {
      return ArrayList(field)
    }

  fun add(value: String) {
    // Requires cast to [MutableList] as property is defined as a [List]
    (list as MutableList).add(value)
  }
}

fun main() {
  val obj = BackingProperty()
  println(obj.list)
  obj.add("adding a value")
  println(obj.list)
}
```

Which prints out:

```
list = []
list = []
```

This is not what I _wanted_ to output. Instead, I wanted the `add` method to add the `value` to the `list` property. However, due to `list` defining a `get`, it instead returns a copy of the original object and adds it to that, thus rendering the code completely useless since `list` can never be mutated. Furthermore, `list` must be cast as the publicly exposed type is unmodifiable.

The issue here is the duality of the property. It behaves as both the public representation and private implementation, going against Java's best practices. That being said, Java cannot define `get` and `set` methods and restrict the modification of a property while leaving it public in the same way Kotlin can.

This _flaw_ is the cost Kotlin pays to support property accessors. By publicly exposing a property, a class can only access its own properties in the same way that anything outside does. Altering a class' `get`, like in the example above, compounds this issue further as it can prevent the class from behaving correctly.

> [C#](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/properties#properties-with-backing-fields) also does this with their backing properties.

So what can you get around this you say. There are two options, as far as I know:

- Write getters and setters in the same way as Java:

    ```kotlin
    class BackingProperty {

      private val list = mutableListOf<String>()

      // Return a copy to prevent modification outside the class
      fun getList(): List<String> = ArrayList(list)

      fun add(value: String) {
        list.add(value)
      }
    }

    fun main() {
      val obj = BackingProperty()
      println(obj.getList())
      obj.add("adding a value")
      println(obj.getList())
    }
    ```

  The downside here is that you lose some of the "flavour" of Kotlin as you are writing code similar to Java.

- Write a private "backing" field (another version of the property with a different name):

    ```kotlin
    class BackingProperty {

      private val _list = mutableListOf<String>()
      val list: List<String>
      // Return a copy to prevent modification outside the class
      get() {
        return ArrayList(_list)
      }

      fun add(value: String) {
        _list.add(value)
      }
    }

    fun main() {
      val obj = BackingProperty()
      println(obj.list)
      obj.add("adding a value")
      println(obj.list)
    }
    ```

  Adding `_list` allows you to get around the fact that `list` is public. Note, that the naming doesn't matter, just that you need to give it another name. Prepending an underscore works as it looks virtually the same as the public version.

Annoyingly neither solution sits well with me. The _Java_/getter and setter version makes the call-sites worse, and the backing property option slightly confuses the class' code itself. Language support needs to be added to find a solution that makes it pleasant to write code both inside and outside the class.

I also could not find any official recommendation on what to do in this situation. I would be more willing to accept the backing field option if it was an agreed-upon solution. For now, I'll have to assume this is the correct choice as it seems more _Kotlin-ish_ than adding getters and setters. That being said, I think this _could_ lead to bugs since you could now access the wrong version of the property and incorrectly modify the code's behaviour.