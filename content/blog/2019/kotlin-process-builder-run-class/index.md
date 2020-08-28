---
title: Running a Kotlin class as a subprocess
date: "2019-05-25"
published: true
tags: [kotlin]
cover_image: blog-card.png
---

Last week I wrote a post on [running a Java class as a subprocess](https://lankydan.dev/running-a-java-class-as-a-subprocess). That post was triggered by my need to run a class from within a test without prebuilding a Jar. The only difference between what I wrote in that post and what actually happened was the language. I used Kotlin to write that test. Not Java. Therefore, I have decided to write this follow up post that builds upon what I previously wrote and focuses on starting a Kotlin subprocess instead of a Java subprocess.

Let's start with an equivalent implementation of the `exec` from [Running a Java class as a subprocess](https://lankydan.dev/running-a-java-class-as-a-subprocess):

```kotlin
@Throws(IOException::class, InterruptedException::class)
fun exec(clazz: Class<*>, args: List<String> = emptyList(), jvmArgs: List<String> = emptyList()): Int {
  val javaHome = System.getProperty("java.home")
  val javaBin = javaHome + File.separator + "bin" + File.separator + "java"
  val classpath = System.getProperty("java.class.path")
  val className = clazz.name

  val command = ArrayList<String>()
  command.add(javaBin)
  command.addAll(jvmArgs)
  command.add("-cp")
  command.add(classpath)
  command.add(className)
  command.addAll(args)

  val builder = ProcessBuilder(command)
  val process = builder.inheritIO().start()
  process.waitFor()
  return process.exitValue()
}
```

Short explanation since I covered everything else in my [previous post](https://lankydan.dev/running-a-java-class-as-a-subprocess).

The path to the Java executable is retrieved and stored in `javaBin`. Using this along with the passed in `clazz`, `args`, `jvmArgs` and the process's classpath a command is created and executed by the `ProcessBuilder`. The class is now successfully running as a subprocess.

The code above is pretty much a copy and paste of the Java implementation. The differences are the order of the function parameters. I decided to switch `args` and `jvmArgs` around so I can make full use of their default values. This is based on the assumption that you are more likely to provide `args` instead of `jvmArgs`. It isn't really that much of a concern when running from Kotlin since you can name the parameters when calling the function. But, if any Java code needs to call this function then the order of the parameters might be helpful (as well as adding on `@JvmOverloads`).

Below are some ways of calling `exec`:

```kotlin
exec(MyProcess::class.java, listOf("3"), listOf("-Xmx200m"))
// jvmArgs = emptyList()
exec(MyProcess::class.java, listOf("3"))
// args = emptyList()
exec(MyProcess::class.java, jvmArgs = listOf("-Xmx200m"))
// both args and jvmArgs = emptyList()
exec(MyProcess::class.java)
```

A noticeable difference when writing in Kotlin instead of Java is the number of ways that you can define a `main` function. This is due to Kotlin providing many different routes to create a static function. 

The function I provided above will run a `main` function in the two following scenarios:

> Inside a companion object and annotated with `@JvmStatic`

```kotlin
class MyProcess {
  companion object {
    @JvmStatic
    fun main(args: Array<String>) {
      // do stuff
    }
  }
}
```

> Inside an object and annotated with `@JvmStatic`

```kotlin
object MyProcess {
  @JvmStatic
  fun main(args: Array<String>) {
    // do stuff
  }
}
```

Another way to create a static function in Kotlin is to define it outside of a class:

```kotlin
@file:JvmName("MyProcess")

package dev.lankydan

fun main(args: Array<String>) {
  // do stuff
}
```

A name needs to be provided so Java knows what to do with it. Executing the `main` function in this snippet is one situation where this is needed. Unfortunately, the `exec` function won't work in this situation, since the `MyProcess` class doesn't actually exist. Preventing it from compiling. Funnily enough, calling `MyProcess` from Java code will compile without any changes.

To resolve the compilation error found in the Kotlin version, `exec`'s parameters need to change very slightly:

```kotlin
@Throws(IOException::class, InterruptedException::class)
fun exec(className: String, args: List<String> = emptyList(), jvmArgs: List<String> = emptyList()): Int {
  // className passed into command
}
```

This change sidesteps the compilation error the original `exec` function presents. But, this comes with the downside of not really being type-safe and might lead to a few errors here and there where an invalid string is passed in. As you can see below:

```kotlin
exec("dev.lankydan.MyProcess", listOf("argument"), listOf("-Xmx200m"))
```

Something about this change really rustles my jimmies. Therefore providing both overloads is probably the sanest thing to do.

To wrap up, although most of what I have to say about executing Kotlin classes as subprocesses was already covered in [Running a Java class as a subprocess](https://lankydan.dev/running-a-java-class-as-a-subprocess). There are a few differences due to Kotlin's flexibility. A `main` function in Kotlin can be defined in multiple ways and unfortunately, one of one those does not get along with `exec` function that the rest are happy with. Luckily the solution is a small code change that can work well if there are overloads for both `String` and `Class` class names.

If you enjoyed this post or found it helpful (or both) then please feel free to follow me on Twitter at [@LankyDanDev](https://twitter.com/LankyDanDev) and remember to share with anyone else who might find this useful!