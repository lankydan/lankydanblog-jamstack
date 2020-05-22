---
title: Privately scoped variable in `when` block
slug: storing-when-block-subject-in-a-variable
date: "2019-01-03"
published: true
tags: [kotlin]
include_date_in_url: true
---

Super short post, on a change introduced in Kotlin 1.3 (yes I know it has been out for a while now). We will take a quick look at capturing the subject of a `when` block into a scoped variable. This is a quality of life improvement that saves a line or so of code while making the role of the variable clearer.

Below is what you would write before the change:

```kotlin
val enum = myClass.enum
when (enum) {
  MyEnum.ONE -> println(enum.propertyOne)
  MyEnum.TWO -> println(enum.propertyTwo)
  else -> println(enum)
}
```

You can now write this instead:

```kotlin
when (val enum: MyEnum = myClass.enum) {
  MyEnum.ONE -> println(enum.propertyOne)
  MyEnum.TWO -> println(enum.propertyTwo)
  else -> println(enum)
}
```

The instantiation of the `enum` variable is merged with the declaration of the `when` block. `enum` is now scoped to the `when` block and cannot be accessed outside of it. Not a massive change, but it does makes the code look a little tidier.

Let's look at one more example:

```kotlin
val obj = someObject()
when(obj) {
  is String -> println("This is a string and it says $obj")
  is Number -> println("This is a number and its value is $obj")
  else -> println("I don't know what $obj is")
}
```

Becomes:

```kotlin
when(val obj = someObject()) {
  is String -> println("This is a string and it says $obj")
  is Number -> println("This is a number and its value is $obj")
  else -> println("I don't know what $obj is")
}
```

Not really anything else to say on this subject as there isn't much to talk about in the first place. You probably get the picture, the example from the [Kotlin 1.3 Release Notes](https://kotlinlang.org/docs/reference/whatsnew13.html#capturing-when-subject-in-a-variable") might make sense to you if I have failed to explain it myself.

If you found this post helpful, you can follow me on Twitter at [@LankyDanDev](https://twitter.com/LankyDanDev) to keep up with my new posts.
