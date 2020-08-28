---
title: Async/await in coroutines
date: "2020-08-02"
published: true
tags: [kotlin, coroutines]
series: Kotlin coroutines
slug: async-await-in-coroutines
cover_image: blog-card.png
---

Async/await is a common feature in many languages (naming might vary), that allows you to execute functions asynchronously while waiting for their results at a later point. Doing this can improve the performance of your applications by doing work on multiple threads instead of synchronously doing one operation after another. Executing long-running operations that have no dependencies on each other in this manner can significantly reduce the overall runtime.

For example, the runtime of the code below can be decreased by running both operations asynchronously:

```kotlin
val count1 = occurrenceOfWordInFile("some-build-file.log", "jenkins")
val count2 = occurrenceOfWordInFile("some-other-file.log", "build")
println("Both results retrieved:\n$count1\n$count2")

// Yes, there probably is a better way to do this!
private fun occurrenceOfWordInFile(filePath: String, word: String): Int {
  return File(filePath).useLines { lines ->
    lines.map { line ->
      line.splitToSequence(" ", "-", ".", ",", ":", "/", ignoreCase = true)
        .filter { it == word }
        .count()
    }.sum()
  }
}
```

Then by using async/await (using the same `occurrenceOfWordInFile` implementation):

```kotlin
runBlocking {
  val count1 = async(context = Dispatchers.IO) { occurrenceOfWordInFile("some-build-file.log", "jenkins") }
  val count2 = async(context = Dispatchers.IO) { occurrenceOfWordInFile("some-other-file.log", "build") }
  println("Both results retrieved:\n${count1.await()}\n${count2.await()}")
}
```

> I could add the timing code to the example and show you the output, or you could choose to believe me when I say its faster

Each call to `async` executes the file read in a separate thread (the `context` needs specifying). The main thread then suspends when it reaches the `println` since it calls `await`. Remember that when a coroutine suspends, it frees the current thread to be used elsewhere. This also adds a limitation to `await`, as it must be executed within the scope of a coroutine. But this limitation makes sense. Otherwise, you could use a `CompletableFuture` instead and call `get` which would block the current thread while it waits. Note, I said block and not suspend. That thread can't be used for anything else, unlike the async/await combo.

## Async launches a new job

Calling `async` is like calling `launch`, in that it starts a new job/coroutine. The difference is that `async` eventually returns its result when `await` is called, whereas you can `join` to the completion of a job started by `launch`, but it won't return a result. You can somewhat achieve the same behaviour by setting a `var` outside of the launched job and using that after calling `join`:

```kotlin
runBlocking {
  var count1: Int? = null
  val job1: Job = launch(context = Dispatchers.IO) {
    count1 = occurrenceOfWordInFile("some-build-file.log", "jenkins")
  }
  var count2: Int? = null
  val job2: Job = launch(context = Dispatchers.IO) {
    count2 = occurrenceOfWordInFile("some-other-file.log", "build")
  }
  joinAll(job1, job2)
  println("Both results retrieved:\n$count1\n$count2")
}
```

It works, but it would be annoying to have to follow this pattern throughout your code.

## Async returns a special job

`async` can't simply return a `Job`, as the `Job` interface is more general and doesn't have access to `await`. If it did, then it could have been called in the previous example using `launch`.

Therefore, a `Deferred` (a deferred value) is returned instead of a plain old `Job`.

```kotlin
public interface Deferred<out T> : Job {

    public suspend fun await(): T

    public val onAwait: SelectClause1<T>

    @ExperimentalCoroutinesApi
    public fun getCompleted(): T

    @ExperimentalCoroutinesApi
    public fun getCompletionExceptionOrNull(): Throwable?
}
```

As you can see, `Deferred` is also a `Job` allowing you to cancel it if needed.

Let me rewrite the original `async` example to highlight the use of `Deferred`:

```kotlin
runBlocking {
  val count1: Deferred<Int> = async(context = Dispatchers.IO) { occurrenceOfWordInFile("some-build-file.log", "jenkins") }
  val count2: Deferred<Int> = async(context = Dispatchers.IO) { occurrenceOfWordInFile("some-other-file.log", "build") }
  println("Both results retrieved:\n${count1.await()}\n${count2.await()}")
}
```

## Async can leverage suspending functions

I believe this is worth mentioning since my examples throughout this post haven't called any suspending code. Remember, `async` launches a new coroutine, so you can do everything you expect a coroutine to do. This includes calling suspending functions to allow the current thread to free up and context switch to another coroutine.

The power of async/await in coroutines is not fully utilised until you use them in this manner. You can launch a long-running and potentially complex coroutine that suspends and resumes multiple times to make optimal use of your machine's processing power. All while the parent coroutine that `await`s the deferred value is also suspended, thus reducing wasted resources.

## Summary

You can use `async` to launch a coroutine that returns a `Deferred` value which can be accessed by calling `await`. From a simplistic perspective, you can treat it like a `CompletableFuture` to execute an operation on a separate thread and retrieve the result when complete. This will let you improve the performance of your application in some situations. You can utilise `async`s full power when you treat it like a coroutine (because it is), to complete more complex code that can suspend at various points. It also reduces the boilerplate you need to write, removing the need to set the result in a local variable and joining before accessing it.