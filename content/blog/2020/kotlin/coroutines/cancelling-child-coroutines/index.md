---
title: Cancelling child coroutines
date: "2020-07-26"
published: true
tags: [kotlin, coroutines]
series: Kotlin coroutines
cover_image: blog-card.png
---

Following on from my previous post, [Cancelling coroutines](../cancelling-coroutines/index.md), we will look at how cancelling a coroutine affects its children.

First let's clarify what a child is in this context:

```kotlin
runBlocking {
  val parent = launch(context = Dispatchers.Default) {
    val child = launch(context = Dispatchers.Default) {
      repeat(100) {
        println("[child] $it.. ")
        delay(50)
      }
    }
  }
}
```

The child is the second coroutine created in the snippet above. The coroutine whose scope the child was created in is the parent.

## Cancelling a job cancels its children

Cancelling a parent coroutine/job will also cancel all of its child coroutines. Allowing you to submit a single cancellation request to stop many executing coroutines.

Below is example:

```kotlin
runBlocking {
  val parent = launch(context = Dispatchers.Default) {
    // children
    (1..2).map {
      launch(context = Dispatchers.Default) {
        repeat(100) { i ->
          println("[child $it] $i.. ")
          delay(50)
        }
      }
    }
    repeat(100) { i ->
      println("[parent] $i.. ")
      delay(50)
    }
  }
  delay(200)
  println("Cancelling")
  parent.cancel()
  parent.join()
  println("Finished cancelling job")
}
```

Which outputs:

```
[child 1] 0.. 
[parent] 0.. 
[child 2] 0.. 
[child 1] 1.. 
[child 2] 1.. 
[parent] 1.. 
[parent] 2.. 
[child 2] 2.. 
[child 1] 2.. 
[parent] 3.. 
[child 1] 3.. 
[child 2] 3.. 
Cancelling
Finished cancelling job
```

Both the parent and child coroutines here are cancelled by the single `Job.cancel` executed on the parent. You don't need to manually retrieve the children from the parent and cancel them yourself. The Kotlin coroutine library developers are kind enough to add this functionality for you. To be honest, you'd probably be a bit annoyed if this ability was not available. Oh, the highs and lows of library development!

## Cancelling via a coroutine's scope

In the previous section the children were cancelled by a call to `Job.cancel`. You can achieve the same behaviour by calling `CoroutineScope.cancel`. Let's look at a quick example:

```kotlin
runBlocking {
  val parent = launch(context = Dispatchers.Default) {
    // children
    (1..2).map {
      launch(context = Dispatchers.Default) {
        repeat(500) { i ->
          println("[child $it] $i.. ")
          delay(50)
        }
      }
    }
    delay(200)
    println("Cancelling in scope")
    // Added [this@launch] to make things a bit clearer
    // You could call [cancel] by itself in this situation
    this@launch.cancel()
  }
  parent.join()
  println("Finished cancelling job")
}
```

`CourtineScope.cancel` is an alternate path to `Job.cancel`:

```kotlin
public fun CoroutineScope.cancel(cause: CancellationException? = null) {
  val job = coroutineContext[Job] ?: error("Scope cannot be cancelled because it does not have a job: $this")
  job.cancel(cause)
}
```

Depending on what you are doing, this might be advantageous, but my current opinion is that `Job.cancel` is likely to be more useful. For example, you can maintain a list of executing coroutines/jobs that you can cancel when needed. Whereas `CoroutineScope.cancel` needs to be triggered from inside the scope itself. Therefore restraining its usefulness. Note, this comes from someone who has not had _tons_ of experience using coroutines out in the wild. 

A benefit it does provide is a clear point where new coroutines will not start. After calling `CoroutineScope.cancel`, no children will be spawned. This allows you to make a decision, from within the scope, whether to continue of not. Achieving such clear cut behaviour like this from outside the scope would be difficult.

## Summary

Coroutines can create parent-child relationships allowing a parent to cancel the child coroutines/jobs running within its context. This ability will enable you to easier control the execution of your coroutines. You can choose to cancel only a parent coroutine and allow the library to handle the rest. You can use either `Job.cancel` or `CoroutineScope.cancel`, even though under the hood they do the exact same thing.

----

If you enjoyed this post or found it helpful (or both) then please feel free to follow me on Twitter at [@LankyDanDev](https://twitter.com/LankyDanDev) and remember to share with anyone else who might find this useful!
