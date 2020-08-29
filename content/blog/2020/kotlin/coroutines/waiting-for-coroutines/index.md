---
title: Waiting for coroutines
date: "2020-04-26"
published: true
tags: [kotlin, coroutines]
series: Kotlin coroutines
cover_image: blog-card.png
---

Coroutines allow you to execute tasks asynchronously without blocking the calling thread, such as the main thread. Great, but sometimes you will need to wait for all of these tasks to finish. In this post, we will look at how to wait for a coroutine to finish using `join`.

Note, `async`/`await` will not be covered here as I will cover that in a later post. For now, read the [Kotlin docs - Concurrent using async](https://kotlinlang.org/docs/reference/coroutines/composing-suspending-functions.html#concurrent-using-async) if that is what you are interested in.

## How to get a job

No, you didn't misread the heading, I _will_ show you how to get a job:

```kotlin
runBlocking {
  val job: Job = launch {
    delay(2000)
    println("and it seems to work!")
  }
  print("This is your first coroutine, ")
}
```

There, you now have a job. I have solved the world's employment problems...

Ok, seriously, a `Job` is returned when you start a coroutine. In fact, from what I understand anyway, the words job and coroutine are interchangeable in this context. Really, they are the same thing, as seen below:

```kotlin
@InternalCoroutinesApi
public abstract class AbstractCoroutine<in T>(
    /**
     * The context of the parent coroutine.
     */
    @JvmField
    protected val parentContext: CoroutineContext,
    active: Boolean = true
) : JobSupport(active), Job, Continuation<T>, CoroutineScope
```

`AbstractCoroutine` implements the `Job` interface. So a coroutine is a job.

## What to do once you have a job

You can control a coroutine through the functions available on the `Job` interface. Here are some of the functions (there are many more):

- `start`
- `join`
- `cancel`

Further `Job` operations will be explored in future posts.

## Waiting for a coroutine

To wait for a coroutine to finish, you can call `Job.join`. 

`join` is a __suspending function__. Meaning that the coroutine calling it will be suspended until it is told to resume. At the point of suspension, the executing thread is released to any other available coroutines (that are sharing that thread or thread pool).

Below is a short example:

```kotlin
runBlocking {
  val job: Job = launch(context = Dispatchers.Default) {
    println("[${Thread.currentThread().name}] Launched coroutine")
    delay(100)
    println("[${Thread.currentThread().name}] Finished coroutine")
  }
  println("[${Thread.currentThread().name}] Created coroutine")
  job.join()
  println("[${Thread.currentThread().name}] Finished coroutine")
}
```

In the snippet above, a coroutine is launched, and a `Job` is returned. `join` is then called on the created job/coroutine to wait for it to finish before resuming.  This leads to the following output:

```kotlin
[main] Created coroutine
[DefaultDispatcher-worker-1] Launched coroutine
[DefaultDispatcher-worker-1] Finished coroutine
[main] Finished coroutine
```

The main thread is blocked while it waits for the job/coroutine to finish. Note, that the main thread is used by `runBlocking`, while the child is launched using one of the default thread pools.

Just like futures and threads, many coroutines can be created and waited for through the use of `join`. This is also made slightly easier by the convenient `joinAll` extension function:

```kotlin
runBlocking {
  val jobs: List<Job> = (1..5).map {
    launch(context = Dispatchers.Default) {
      println("[${Thread.currentThread().name}] Launched coroutine: $it")
      delay(100)
      println("[${Thread.currentThread().name}] Finished coroutine: $it")
    }
  }
  println("[${Thread.currentThread().name}] Created all coroutines")
  jobs.joinAll()
  println("[${Thread.currentThread().name}] Finished all coroutines")
}
```

Something similar to the following would be output:

```kotlin
[DefaultDispatcher-worker-1] Launched coroutine: 1
[DefaultDispatcher-worker-2] Launched coroutine: 2
[DefaultDispatcher-worker-3] Launched coroutine: 3
[DefaultDispatcher-worker-4] Launched coroutine: 4
[main] Created all coroutines
[DefaultDispatcher-worker-5] Launched coroutine: 5
[DefaultDispatcher-worker-1] Finished coroutine: 1
[DefaultDispatcher-worker-4] Finished coroutine: 4
[DefaultDispatcher-worker-2] Finished coroutine: 3
[DefaultDispatcher-worker-3] Finished coroutine: 5
[DefaultDispatcher-worker-5] Finished coroutine: 2
[main] Finished all coroutines
```

I wonder if you can guess what `joinAll`'s implementation looks like. I don't have any way to hide text, so I'll just assume you actually guessed. I have added it below:

```kotlin
public suspend fun Collection<Job>.joinAll(): Unit = forEach { it.join() }
```

## Joining is not always required

Joining all jobs running inside a coroutine is not a requirement to ensure their completion is waited for. By using the `coroutineScope` builder (a function), you can create a parent/child relationship between coroutines. More precisely, the `coroutineScope` builder will only progress once all of the coroutines inside it have completed. This is effectively doing a `joinAll` on all the jobs inside the `coroutineScope`.

The example below _attempts_ to show this:

```kotlin
runBlocking {
  val jobs: List<Job> = (1..2).map { parentNumber ->
    // This coroutine is joined on inside [runBlocking] to allow the last [println]
    launch(context = Dispatchers.Default) {
      // The [coroutineScope] block cannot be left until the 2 corountines launched inside have finished
      coroutineScope {
        println("[${Thread.currentThread().name}] Launched parent: $parentNumber")
        (1..2).map { childNumber ->
          launch {
            println("[${Thread.currentThread().name}] Launched child: $parentNumber - $childNumber")
            delay(100)
            println("[${Thread.currentThread().name}] Finished child: $parentNumber - $childNumber")
          }
        }
      }
      println("[${Thread.currentThread().name}] Finished parent: $parentNumber")
    }
  }
  println("[${Thread.currentThread().name}] Created all coroutines")
  jobs.joinAll()
  println("[${Thread.currentThread().name}] Finished all coroutines")
}
```

Which outputs something like this:

```kotlin
[DefaultDispatcher-worker-1] Launched parent: 1
[main] Created all coroutines
[DefaultDispatcher-worker-2] Launched parent: 2
[DefaultDispatcher-worker-3] Launched child: 2 - 1
[DefaultDispatcher-worker-4] Launched child: 1 - 1
[DefaultDispatcher-worker-5] Launched child: 1 - 2
[DefaultDispatcher-worker-3] Launched child: 2 - 2
[DefaultDispatcher-worker-2] Finished child: 2 - 1
[DefaultDispatcher-worker-3] Finished child: 2 - 2
[DefaultDispatcher-worker-5] Finished child: 1 - 2
[DefaultDispatcher-worker-1] Finished child: 1 - 1
[DefaultDispatcher-worker-2] Finished parent: 2
[DefaultDispatcher-worker-1] Finished parent: 1
[main] Finished all coroutines
```

Each _parent_ coroutine had to wait until their _children_ finished. This was enabled by using `coroutineScope`, ensuring each coroutine launched inside it had completed before moving on.

I only touched on this subject to show that joining is not the only way to wait for jobs to finish. For some more information, have a look at the [Kotlin docs - Scope builder](https://kotlinlang.org/docs/reference/coroutines/basics.html#scope-builder).

## Summary

Sometimes you will want to wait for several coroutines to complete before moving on. This behaviour can be achieved using `join` and `joinAll` provided by the `Job` interface. Doing so will suspend the calling coroutine until the joined jobs have concluded. Similar behaviour can also be obtained via the `coroutineScope` builder, ensuring that all jobs launched within it have ended before continuing.

----

If you enjoyed this post or found it helpful (or both) then please feel free to follow me on Twitter at [@LankyDanDev](https://twitter.com/LankyDanDev) and remember to share with anyone else who might find this useful!
