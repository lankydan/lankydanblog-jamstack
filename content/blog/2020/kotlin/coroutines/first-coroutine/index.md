---
title: Launching your coroutine knowledge
date: "2020-04-17"
published: true
tags: [kotlin, coroutines]
series: Kotlin coroutines
cover_image: blog-card.png
---

Coroutines are essentially lightweight threads that allow your applications to squeeze more juice out of the machines they are running on, without needing to manually manage the threads executing them. Coroutines add a new abstraction, further removing you (the developer) away from the lifecycle of threads. This abstraction allows a single thread to context switch between various tasks and therefore making better use of the thread's time. It spends less time sitting around awaiting a result (from a potentially slow I/O task) and can instead continue to be useful by working on a task issued by another coroutine.

Let's try thinking of a real-life example. Think of your day as a developer. You build your code, and it takes, let's say, 3 mins to do so. During that time, what do you do? Well, yes, of course, some times you might just sit there and literally do nothing. But most of the time, you'll check your emails, Slack, Twitter or go for a stretch. It doesn't really matter what you're doing, it's the fact that you _are_ doing something else. You didn't just sit there and wait for the build to finish. You saturated your own processing and did something else while you waited. That is the concept that coroutines provide.

Yes, I did just compare you to a thread. You spawn, you live, and you die. Some of you are even killed... Ok, that metaphor got a bit dark.

One last comment before we dive into a small example. The concept of lightweight threads that coroutines introduce to Kotlin is not new. Many other languages include this ability, for example.

- [Erlang](https://erlang.org/doc/getting_started/conc_prog.html)
- Go has [goroutines](https://tour.golang.org/concurrency/1)
- Java is working on [Project Loom](https://cr.openjdk.java.net/~rpressler/loom/Loom-Proposal.html)

## Quick setup

Coroutines are not included in Kotlin's standard library (although some keywords are baked in). You will need to add a dependency on `kotlinx-coroutines-core` to access coroutines.

- Gradle:

    ```groovy
    dependencies {
        compile group: 'org.jetbrains.kotlinx', name: 'kotlinx-coroutines-core', version: '1.3.5'
    }
    ```

- Maven:

    ```xml
    <dependencies>
      <dependency>
          <groupId>org.jetbrains.kotlinx</groupId>
          <artifactId>kotlinx-coroutines-core</artifactId>
          <version>1.3.5</version>
      </dependency>
    </dependencies>
    ```

> The version will change as the library is updated (yes, I have to say this...)

## A simple coroutine

As this is an introduction to coroutines, we will only go over an example with limited scope. I want to point out that a lot of the benefits of coroutines will not be highlighted by these examples. Moving forward, I will cover these topics which will show you more interesting use-cases.

Let's jump right in:

```kotlin
fun main() {
  runBlocking {
    launch {
      delay(2000)
      println("and it seems to work!")
    }
    print("This is your first coroutine, ")
  }
}
```

In this example, we have some code that launches a coroutine with a `delay` before continuing to print out a message. Even in this short example, there are a few things we can extract from it. Let's start from the top and work our way down.

- `runBlocking` - Runs a new coroutine that blocks the current thread until everything inside of it (including other coroutines) has completed. This is only here to make the example work. Realistically, you should only use this to move from blocking to non-blocking code, such as in `main` (like the example) or in tests.
- `launch` - _Launches_ a new coroutine. Unlike `runBlocking`, `launch` does not block the current thread. Furthermore, it inherits the `CoroutineContext` from the current `CoroutineScope`, these magic words will be expanded on later.
- `delay` - Suspends the coroutine it is executed in for a given amount of time. In one way it is similar to `Thread.sleep` in that it stops the coroutine from continuing for a while. But, it does a lot more than that. The thread that the coroutine is running on does not get blocked (like a `Thread.sleep` would). Instead, the coroutine _suspends_. Releasing its thread to allow another coroutine to continue executing. Once the `delay` period is up, and a thread is available, the coroutine will continue where it left off.

> All functions shown above are part of `kotlinx-coroutines-core`

Quite a few words and concepts were thrown just thrown at you. I would be a monster to not go through them.

- Suspending a coroutine - Conceptually, a coroutine suspending is like the passing of a baton in a never-ending relay race, allowing the next runner to progress. As you move into a multi-threaded environment though, this example becomes a bit weird as everyone is passing the baton to semi-random runners, but let's ignore that. Coroutines share threads (for example, from a thread pool). Suspending a coroutine frees up the thread it was executing on to allow another to take over. This is the main benefit of coroutines. Allowing the number of running coroutines to significantly surpass the number of threads available to the application.
- `CoroutineContext` - The persistent context of a coroutine, that decides what threads the asynchronous code found inside of it executes on.
- `CoroutineScope` - Consists of a single `CoroutineContext` property that is provided to any new (child) coroutines that are launched inside it. Most functions that create new coroutines are extension functions of `CoroutineScope`, therefore requiring a scope to before anything useful can be done. In the example above, `runBlocking` is providing its `CoroutineScope` to the following call to `launch`.

> This [blog post by Roman Elizarov](https://medium.com/@elizarov/coroutine-context-and-scope-c8b255d59055#8293) (Team Lead for Kotlin libraries) goes into the differences between `CoroutineContext` and `CoroutineScope`

## Suspending functions

The topic of suspending a coroutine was touched on above, in this section, we will cover the `suspend` keyword.

You have already seen one suspending function from the example above, `delay`. Below are the contents of `delay`:

```kotlin
public suspend fun delay(timeMillis: Long) {
  if (timeMillis <= 0) return // don't delay
  return suspendCancellableCoroutine sc@ { cont: CancellableContinuation<Unit> ->
    cont.context.delay.scheduleResumeAfterDelay(timeMillis, cont)
  }
}
```

The function is short enough that I've included all of its contents, but don't worry about understanding it all. We are focusing on the `suspend` keyword. Notice that I said keyword. `suspend` is built into the Kotlin language itself.

So, why do we need it in the first place?

All functions that suspend at some point during their execution must be annotated with `suspend`. I mean duh, right? Trying to go deeper than this to fully understand when a function suspends can quickly become confusing. Quite frankly, I haven't use coroutines enough yet to give you a more in-depth explanation.

So for now, remember this is a _getting started_ post of sorts and follow this rule of thumb. If you call a function prefaced with `suspend`, and the calling point is not inside a coroutine, then your function should also be marked with `suspend`.

For example:

- Calling point outside a coroutine:

    ```kotlin
    suspend fun printAfterDelay() {
      delay(2000)
      println("and it seems to work!")
    }
    ```


- Calling point inside a coroutine:

    ```kotlin
    fun CoroutineScope.printAfterDelay() {
      launch {
        delay(2000)
        println("and it seems to work!")
      }
    }
    ```

Both of these are a slight _refactoring_ of the original example.

The compiler will help you in a lot of situations (a benefit of being a keyword). For example, trying to compile:

```kotlin
fun printAfterDelay() {
  delay(2000)
  println("and it seems to work!")
}
```

> Note that the suspend is missing

Will lead to the following error:

```kotlin
Suspend function 'delay' should be called only from a coroutine or another suspend function
```

Which pretty much reiterates what I said previously.

I believe that should be enough of an explanation to get you started.

## Summary

Kotlin's coroutines are lightweight threads that share and release their underlying resources whenever a single coroutine reaches a suspension point. This allows better utilisation of an application's resources, as threads are not necessarily blocked when performing long-running tasks. We looked at a rudimentary example consisting of a single coroutine and a suspending function. Finally, we took a _modest_ look at the `suspend` keyword and how you add it to functions that _suspend_. 

The real benefits of coroutines have not been touched on through the examples in this post. Instead, it has focused on laying the groundwork as you begin building your coroutine knowledge. Moving forward, I aim to publish more content on Kotlin coroutines. So look out for those, assuming I keep my word...

----

If you enjoyed this post or found it helpful (or both) then please feel free to follow me on Twitter at [@LankyDanDev](https://twitter.com/LankyDanDev) and remember to share with anyone else who might find this useful!