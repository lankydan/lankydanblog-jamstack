---
title: Kotlin primitive and object arrays
date: "2019-06-21"
published: true
tags: [kotlin, java, beginner]
cover_image: blog-card.png
---

I initially set out to write this post because I was playing around with some reflection code and thought I found something interesting. Alas, that was definitely not the case. Instead, it was just a basic feature of Kotlin that I haven't needed to use or focus on yet. Although this post didn't turn out the way I wanted it to be, I still think it is a nice little post to bring some clarity to this subject.

In Java, there is the concept of [primitive types](https://docs.oracle.com/javase/tutorial/java/nutsandbolts/datatypes.html) and their [wrapped versions](https://docs.oracle.com/javase/tutorial/java/data/autoboxing.html). Thanks to autoboxing and unboxing, types can be interchanged between their primitive and wrapped versions. In other words, in most situations you can use a `long` instead of a `Long` or a `Long` instead of a `long`. If you didn't notice where the capitals were in that last sentence then I imagine it probably looked quite confusing. The wording in that sentence is also crucial. More specifically, the statement "in most situations".

Autoboxing and unboxing does not work when attempting to interchange a primitive array and a wrapped (`Object`) array. For example,

```java
public class PrimitiveArrays {

  public static void main(String args[]) {
    Long[] longArray = new Long[] {1L, 2L, 3L};
    takesInPrimitiveLongArray(longArray);
  }

  static void takesInPrimitiveLongArray(long[] array) {}
}
```

This does not work and attempting to compile it gives the following error:

```java
error: incompatible types: Long[] cannot be converted to long[]
    takesInPrimitiveLongArray(longArray);
```

Switching the method to take in `Long[]` and passing in a `long[]` will also fail to compile for the same reasons. This is not something that most Java developers will find interesting but helps set the groundwork for the actual content of this post.

Kotlin needs to provide you with the equivalent of Java's primitive arrays. But, Kotlin does not let you define arrays using the same syntax as Java. In Kotlin initialising an array looks like:

```kotlin
val array = Array<Long>(3)
// or
val array: Array<Long> = arrayOf(1,2,3)
```

The fact that you can see the `Array` uses generics should highlight that it is not a primitive array. This is a fact in both Java and Kotlin, that generic types cannot be primitives. Otherwise, it could be switched out for `Array<long>`, and we would all be happy. The code above compiles down to an object array of `Long[]` instead of a primitive `long[]`.

This situation is somewhat unique to arrays. A Kotlin `Long` used by itself can compile to either a `Long` or `long` in JVM bytecode. The compiled type depends on the nullability of the field. Arrays are more explicit, so their types won't change when compiled.

To circumvent this, Kotlin provides a selection of classes that become primitive arrays when compiled down to JVM bytecode.

These classes include:

| Kotlin       | Java      |
|--------------|-----------|
| ByteArray    | byte[]    |
| CharArray    | char[]    |
| ShortArray   | short[]   |
| IntArray     | int[]     |
| LongArray    | long[]    |
| DoubleArray  | double[]  |
| FloatArray   | float[]   |
| BooleanArray | boolean[] |

There are also further classes for arrays of unsigned types.

These classes can also be interchanged between Kotlin and Java without any extra effort.

As a final piece of evidence showing you the differences between primitive and wrapped/object arrays in Kotlin, I want to show you some Kotlin code that is converted to its Java counterpart:

```kotlin
@file:JvmName("PrimitiveArrays")
package dev.lankydan

fun main(args: Array<String>) {
  // long and Long arrays
  val longArray = longArrayOf(1,2,3,4)
  val arrayOfLongs = arrayOf<Long>(1,2,3,4)
  // int and Integer arrays
  val intArray = intArrayOf(1,2,3,4)
  val arrayOfInts = arrayOf<Int>(1,2,3,4)
  // boolean and Boolean arrays
  val booleanArray = booleanArrayOf(true, false)
  val arrayOfBooleans = arrayOf<Boolean>(true, false)
  // char and Character arrays
  val charArray = charArrayOf('a','b','c')
  val arrayOfChars = arrayOf<Char>('a', 'b', 'c')
}
```

Using Intellij's Kotlin bytecode decompiler, the snippet decompiles to:

```java
public final class PrimitiveArrays {
   public static final void main(String[] args) {
      Intrinsics.checkParameterIsNotNull(args, "args");
      // long and Long arrays
      long[] var10000 = new long[]{1L, 2L, 3L, 4L};
      Long[] var9 = new Long[]{1L, 2L, 3L, 4L};
      // int and Integer arrays
      int[] var10 = new int[]{1, 2, 3, 4};
      Integer[] var11 = new Integer[]{1, 2, 3, 4};
      // boolean and Boolean arrays
      boolean[] var12 = new boolean[]{true, false};
      Boolean[] var13 = new Boolean[]{true, false};
      // char and Character arrays
      char[] var14 = new char[]{'a', 'b', 'c'};
      Character[] var15 = new Character[]{'a', 'b', 'c'};
   }
}
```

Firstly, note that Kotlin provides you with useful initialisation functions for your arrays. Both for primitive and object arrays. Secondly, how they are compiled. For example, `LongArray` becomes `long[]` and `Array<Long>` becomes `Long[]`.

You can now see the differences between these arrays. But, I have not mentioned which ones you should be utilising. You should defer to primitive types in the same way that Java does. This is due to the performance impact that autoboxing and unboxing can have on your application. 

For smaller workloads, the result is likely to be negligible. On the other hand, for larger arrays in performance critical applications, this possibly small change can have a noticeable effect. Some more information on this subject can be found [here](https://effective-java.com/2015/01/autoboxing-performance/). 

If you need to store nulls in your arrays, then you will still need to refer back to a wrapped/object array. In most situations, I think you should be able to utilise primitive arrays, but there are always going to be times when you can't. That being said, most of the time we all just use `List`s, so none of this really matters 😛.

You should now have a better understanding of the differences between primitive arrays like `LongArray` and object arrays such as `Array<Long>`. If not, then I have failed you, and I apologise for that 😥.

If you found this post helpful, you can follow me on Twitter at [@LankyDanDev](https://twitter.com/LankyDanDev) to keep up with my new posts.