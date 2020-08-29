---
title: Cancelling coroutines
date: "2020-05-11"
published: true
tags: [kotlin, coroutines]
series: Kotlin coroutines
cover_image: blog-card.png
---

Sooner or later, you will need to cancel a coroutine that you started. Let's look at how you can do just that.

## How to cancel a job

One of the functions available to a job is `cancel`. I don't know about you, but that sounds like the function we need. We can also leverage `join` to wait until the job is finished cancelling.

The example below shows a job being cancelled:

```kotlin
runBlocking {
  val job = launch(Dispatchers.Default) {
    for (i in 0..1000) {
      delay(50)
      println("$i..")
    }
    println("Job is completed")
  }
  delay(500)
  println("Cancelling")
  job.cancel()
  job.join()
  println("Cancelled and done")
}
```

Outputting:

```kotlin
0..
1..
2..
3..
4..
5..
6..
7..
8..
Cancelling
Cancelled and done
```

Note, that `Job is completed` is never output as the job was cancelled before this could occur.

`Job` also provides `cancelAndJoin` to combine the two parts together. This will be used for the remainder of this post.

## Cancellation is cooperative

As the [Kotlin docs](https://kotlinlang.org/docs/reference/coroutines/cancellation-and-timeouts.html#cancellation-is-cooperative) say, "coroutine cancellation is cooperative". I really like this wording, and I think it goes a long way to describe what your part in writing coroutines that are cancellable.

I think this wording is so good, that I stole the heading from the [Kotlin docs - Cancellation is cooperative](https://kotlinlang.org/docs/reference/coroutines/cancellation-and-timeouts.html#cancellation-is-cooperative)... There is no better way to word what needs to be said here. If you want to leave and go through their docs instead, I understand.

For anyone that has decided to stay, let's carry on.

A coroutine needs to cooperate to be cancellable. In other words, you need to take into account the contents of your coroutines to ensure that they can be cancelled. You can make your coroutines cancellable by following the two options below:

- Calling any suspending functions from `kotlinx.coroutines`
- Using `CoroutineScope.isActive` and handling the outcome appropriately

Both of these will be expanded in the following sections.

## Kotlinx suspending functions are cancellable

All of the suspending functions provided by `kotlinx.coroutines` will check if the coroutine calling them is cancelled and throw a `CancellationException` if it has been.

The previous example demonstrated this. I have added it below again but tidied it up a little bit:

```kotlin
runBlocking {
  val job = launch(Dispatchers.Default) {
    for (i in 0..1000) {
      delay(50)
      println("$i..")
    }
  }
  delay(500)
  job.cancelAndJoin()
}
```

`delay` is a suspending function and therefore checks if the coroutine has been cancelled. The code for `delay` indicates how it handles cancellation:

```kotlin
/**
 * Delays coroutine for a given time without blocking a thread and resumes it after a specified time.
 * This suspending function is cancellable.
 * If the [Job] of the current coroutine is cancelled or completed while this suspending function is waiting, this function
 * immediately resumes with [CancellationException].
 *
 * Note that delay can be used in [select] invocation with [onTimeout][SelectBuilder.onTimeout] clause.
 *
 * Implementation note: how exactly time is tracked is an implementation detail of [CoroutineDispatcher] in the context.
 * @param timeMillis time in milliseconds.
 */
public suspend fun delay(timeMillis: Long) {
    if (timeMillis <= 0) return // don't delay
    return suspendCancellableCoroutine sc@ { cont: CancellableContinuation<Unit> ->
        cont.context.delay.scheduleResumeAfterDelay(timeMillis, cont)
    }
}
```

The Kdoc mentions what happens if the calling coroutine has been cancelled. The same documentation is also included in other suspending functions. Furthermore, the call to `suspendCancellableCoroutine` provides a few more clues into what happens, but we're not going to continue this investigation any further.

You might have also noticed that the `CancellationException` thrown by `delay` is not caught in the previous example. It is handled by the coroutine and will not propagate to the calling thread. You can decide to catch it inside your coroutine, but be aware that any calls to built-in suspending functions will end up throwing another `CancellationException`. Some extra information around this topic that is not covered here can be found in the [Kotlin docs - Closing resources with finally](https://kotlinlang.org/docs/reference/coroutines/cancellation-and-timeouts.html#closing-resources-with-finally).

## Checking isActive

Cancelling a coroutine will change a job's `isActive` flag to `false`. This flag can then be used to check if a job is still running, has been cancelled or one of the other non-running states.

As discussed in the previous section, the built-in coroutines will handle cancellation for you. Therefore you're going to need to check the `isActive` flag for the following reasons:

- You aren't using any suspending functions from `kotlinx-coroutines` inside your coroutine
- You have parts of your coroutine that don't call a suspending function
- You are writing your own suspending function that should be cancellable

To explore the use of the `isActive` flag, we will focus on a set of examples consisting of coroutines that continually loop until they are cancelled.

Below are some methods you can use to handle cancellation:

- Conditionally executing code using `isActive` as part of a `while` loop
- Conditionally executing code using `isActive` and an `if` statement
- Using `return` to escape
- Throwing an exception using `isActive`
- Escaping a coroutine using `ensureActive`

The following sub-sections contain examples of these.

### Conditionally executing code using isActive as part of a while loop

`isActive` is a `boolean` property after all, therefore it can be used in a while loop:

```kotlin
runBlocking {
  val job = launch(Dispatchers.Default) {
    while (isActive) {
      Thread.sleep(50)
      println("I am still going..")
    }
  }
  delay(500)
  job.cancelAndJoin()
}
```

This example checks the `isActive` flag as part of the `while` loop. Once the job is cancelled, the value becomes `false`, and the loop ends.

### Conditionally executing code using isActive and an if statement

In a very similar way to the `while` loop, you can check the state of `isActive` with an `if` statement to decide whether to execute some code:

```kotlin
runBlocking {
  val job = launch(Dispatchers.Default) {
    for (it in 0..1000) {
      if (isActive) {
        Thread.sleep(50)
        println("I am still going..")
      }
    }
  }
  delay(500)
  job.cancelAndJoin()
}
```

### Using return to escape

You can use `return` to break out of a loop and stop further processing if the job has been cancelled:

```kotlin
runBlocking {
  val job = launch(Dispatchers.Default) {
    for (it in 0..1000) {
      if (!isActive) {
        return@launch
      }
      Thread.sleep(50)
      println("I am still going..")
    }
  }
  delay(500)
  job.cancelAndJoin()
}
```

### Throwing an exception using isActive

This is similar to escaping using `return`, but changes it up a bit and throws an exception:

```kotlin
runBlocking {
  val job = launch(Dispatchers.Default) {
    for (it in 0..1000) {
      if (!isActive) {
        throw CancellationException("I have been cancelled")
      }
      Thread.sleep(50)
      println("I am still going..")
    }
  }
  delay(500)
  job.cancelAndJoin()
}
```

### Escaping a coroutine using ensureActive

`ensureActive` is a helper function that throws a `CancellationException` if the coroutine has been cancelled:

```kotlin
runBlocking {
  val job = launch(Dispatchers.Default) {
    for (it in 0..1000) {
      ensureActive()
      Thread.sleep(50)
      println("I am still going..")
    }
  }
  delay(500)
  job.cancelAndJoin()
}
```

Calling `ensureActive` removes the need to call the earlier method that throws an exception. Furthermore, it has access to the exception passed into `Job.cancel`.

## Summary

We have looked at how to cancel a job and how to write a coroutine that can be cancelled.

A job can be cancelled by calling `cancel` or `cancelAndJoin`.

It is important to remember that a coroutine must cooperate to be cancellable. You can make a coroutine cancellable by:

- Calling any suspending functions from `kotlinx.coroutines`
- Using `CoroutineScope.isActive` and handling the outcome appropriately

It is highly likely that your coroutines will call at least one of the provided suspending functions. Doing so removes the need to explicitly make your coroutines cancellable. That being said, it is an important subject to be aware of when you do eventually write a coroutine that does not call any of the `kotlinx.coroutines` suspending functions.

----

If you enjoyed this post or found it helpful (or both) then please feel free to follow me on Twitter at [@LankyDanDev](https://twitter.com/LankyDanDev) and remember to share with anyone else who might find this useful!