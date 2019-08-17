---
title: The potential traps in Kotlin's Data Classes
date: "2019-08-17"
published: true
tags: [kotlin]
cover_image: ./title-card.png
---

The aim of this post is not to point out some massive flaws in Kotlin's design of data classes and show you how to get passed them. Actually, it is quite the opposite. The contents of this post are clearly documented in the [Kotlin docs](https://kotlinlang.org/docs/reference/data-classes.html#properties-declared-in-the-class-body). I am merely here to highlight this information to anyone who has not noticed precisely how their data classes are working.

Data classes are convenient for us developers, especially those of us coming over from Java. They provide several generated functions allowing you to write a fully functional class with very little code. Data classes provide the following generated functions:

- `equals`
- `hashCode`
- `toString`
- `copy`
- [componentN() functions](https://kotlinlang.org/docs/reference/multi-declarations.html).

All of the above are generated for properties defined in a class' primary constructor. Anything defined outside of this constructor is ignored. This is the potential _trap_. But, this is only a trap if you are not aware of how data classes work. As I mentioned earlier, it is clearly [documented](https://kotlinlang.org/docs/reference/data-classes.html#properties-declared-in-the-class-body), you only need to be mindful of it. Which you now are, of course.

If you are not considerate in how you define your data classes, you are likely to find some bugs in your application. `equals` and `hashCode` are generally essential functions. If they do not work as expected, bugs are sure to follow.

Below is an example of this:

```kotlin
data class MyClass(val a: String, val b: Int) {
  // property defined outside of primary constructor
  lateinit var c: String
}

fun main() {
  // create two equal objects
  val myClass = MyClass("abc", 0)
  val myClass2 = myClass.copy()
  // check their hashCodes are the same and that they equal each other
  println("myClass hashCode: ${myClass.hashCode()}")
  println("myClass2 hashCode: ${myClass2.hashCode()}")
  println("myClass == myClass2: ${myClass == myClass2}")
  // set the lateinit variables
  myClass.c = "im a lateinit var"
  myClass2.c = "i have a different value"
  // have their hashCodes changed?
  println("myClass hashCode after setting lateinit var: ${myClass.hashCode()}")
  println("myClass2 hashCode after setting lateinit var: ${myClass2.hashCode()}")
  // are they still equal to each other?
  println("myClass == myClass2 after setting lateinit vars: ${myClass == myClass2}")
  // sanity check to make sure I'm not being stupid
  println("sanity checking myClass.c: ${myClass.c}")
  println("sanity checking myClass2.c: ${myClass2.c}")
}
```

Executing this example outputs:

```kotlin
myClass hashCode: 2986974
myClass2 hashCode: 2986974
myClass == myClass2: true
myClass hashCode after setting lateinit var: 2986974
myClass2 hashCode after setting lateinit var: 2986974
myClass == myClass2 after setting lateinit vars: true
sanity checking myClass.c: im a lateinit var
sanity checking myClass2.c: i have a different value
```

As you can see the `hashCode` of each object is the same, and they are both equal to each other, even though their `c` properties are different. If you tried to make use of `MyClass` inside of a `Map` or `Set`, the chance of entries colliding with each other increases. That being said, it really does depend on what you are trying to achieve. Maybe this is precisely what you want to happen. In which case, more power to you.

Placing `c` into the `MyClass` constructor would affect the `hashCode` and `equals` implementation. `c` would then be involved in any calls to `hashCode`, `equals` and the rest of the generated functions.

If you haven't done so already, I recommend that you take a quick look at the [documentation](https://kotlinlang.org/docs/reference/data-classes.html#properties-declared-in-the-class-body) on this subject. Highlighting this information was the goal of this post. It's not some fancy code that does something magical. Instead, it is something more basic and fundamental to how Kotlin works. Being aware of how data classes work in this aspect can be vital to reducing the number of bugs in your application.

If you enjoyed this post or found it helpful (or both) then please feel free to follow me on Twitter at [@LankyDanDev](https://twitter.com/LankyDanDev) and remember to share with anyone else who might find this useful!
