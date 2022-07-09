---
title: Reading and writing with a ConcurrentHashMap
date: "2022-07-09"
published: true
tags: [java, concurrency]
cover_image: blog-card.png
---

`ConcurrentHashMap` provides a `Map` implementation with thread-safe read and write operations.

The `Map` and `ConcurrentMap` interfaces provide methods that `ConcurrentHashMap` takes advantage of to provide thread-safe interactions. Generally, I tend to solely really on the `Map` interface as it provides most of the same methods that `ConcurrentMap` has; however, depending on your use case, it might be beneficial to check out the `ConcurrentMap` methods yourself.

This post will look at reading from and writing to a `ConcurrentHashMap`.

## Reading

`ConcurrentHashMap` allows concurrent read access to its contents where a key can still be read from even if the same key is being modified by another thread. 

Reading itself does not affect the map's contents and is therefore safe and does not break any of the guarantees that `ConcurrentHashMap` provides. However, this does mean that read values could be "old", as the map doesn't block reads even when updates are actively occurring on other threads. That being said, as soon as the update completes, reading threads will receive the updated value. 

From my searching, there doesn't seem to be a native `Map` implementation that prevents reads and updates from occurring simultaneously on the same key. There is `Collections.synchronizedMap`, but that synchronises access to the whole map rather than per key. 

Below is an example showing how reads are not blocked while the map is being written to using `compute` (which we'll look at in the writing section):

```java
public static void main(String[] args) {

  // Put some values into the map.
  Map<Integer, String> map = new ConcurrentHashMap<>(Map.of(
    1, "INITIAL",
    2, "INITIAL",
    3, "INITIAL"
  ));

  // Slowly write to key [1] in the map using `compute`.
  new Thread(() -> {
    while (true) {
      map.compute(1, (key, value) -> {
        for (int i = 0; i < 5; i++) {
          System.out.println("[1] computing...");
          sleep(1000);
        }
        return "COMPUTE";
      });
      System.out.println("[1] updated from compute");
    }
  }).start();

  // Read each key in the map in a loop.
  for (int key : map.keySet()) {
    new Thread(() -> {
      while (true) {
        String value = map.get(key);
        System.out.println("[" + key + "] read from thread - " + value);
        sleep(1000);
      }
    }).start();
  }
}

// Just added to contain the try/catch when sleeping.
private static void sleep(int time) {
  try {
    Thread.sleep(time);
  } catch (InterruptedException e) {
    e.printStackTrace();
  }
}
```

When run, the code outputs something like:

```
[1] computing...
[2] read from thread - INITIAL
[3] read from thread - INITIAL
[1] read from thread - INITIAL
[1] computing...
[2] read from thread - INITIAL
[3] read from thread - INITIAL
[1] read from thread - INITIAL
[1] computing...
[1] read from thread - INITIAL
[3] read from thread - INITIAL
[2] read from thread - INITIAL
[1] computing...
[2] read from thread - INITIAL
[3] read from thread - INITIAL
[1] read from thread - INITIAL
[1] computing...
[2] read from thread - INITIAL
[3] read from thread - INITIAL
[1] read from thread - INITIAL
[1] updated from compute
[1] computing...
[3] read from thread - INITIAL
[2] read from thread - INITIAL
[1] read from thread - COMPUTE
```

This shows that reads occur on every key (1, 2, 3) even though key 1 is being written to throughout the example's execution.

## Writing

`ConcurrentHashMap` prevents multiple threads from writing to the same key simultaneously. From a superficial perspective, when a write operation begins, such as `compute`, it takes a lock for the specified key and blocks any other threads trying to write to the same key. Once the write finishes, the lock is released, and the process begins again with one of the blocked threads taking the lock. 

The more complicated explanation is that `ConcurrentHashMap` keeps key-value pairs in buckets/bins/segments (I'll refer to them as buckets from now on), which hold many pairs and can be locked. Writing to a key locks its bucket, preventing writes to any key within the bucket. This means that seemingly unrelated writes to separate keys can still block each other; however, this is unlikely to noticeably impact your application. Writes to unlocked buckets are not blocked, with these buckets then transitioning to a locked state while the write executes.

All the write methods available to the `Map` and `ConcurrentMap` interfaces work like this when using a `ConcurrentHashMap`.

The behaviour described above ensures that each write behaves deterministically. Otherwise, a call to `compute` could read the current value while another thread comes in, writes a new value, and then the `compute` call finishes and updates the value again. This is wrong because the `compute`'s code did not accommodate this change and is operating on out-of-date data. The same can be said about the key-value mapping being removed while `compute` is executing.

I've mentioned `compute` many times throughout this post. It is the primary method I use when writing to a `ConcurrentHashMap` where the current value should be read when determining the new one. Methods such as, `computeIfAbsent`, `computeIfPresent` and `merge` have similar behaviour to `compute`.

The example below shows that multiple threads cannot write to the same key at the same time:

```java
public static void main(String[] args) {

  // Put some values into the map.
  Map<Integer, String> map = new ConcurrentHashMap<>(Map.of(
    1, "INITIAL",
    2, "INITIAL",
    3, "INITIAL"
  ));

  // Slowly write to key [1] in the map using `compute`.
  new Thread(() -> {
    while (true) {
      map.compute(1, (key, value) -> {
        for (int i = 0; i < 5; i++) {
          System.out.println("[1] computing...");
          sleep(1000);
        }
        return "COMPUTE";
      });
      System.out.println("[1] updated from compute");
    }
  }).start();

  // Write to each key in the map in a loop.
  for (int key : map.keySet()) {
    new Thread(() -> {
      while (true) {
        map.put(key, "THREAD");
        System.out.println("[" + key + "] updated from thread");
        sleep(1000);
      }
    }).start();
  }
}

// Just added to contain the try/catch when sleeping.
private static void sleep(int time) {
  try {
    Thread.sleep(time);
  } catch (InterruptedException e) {
    e.printStackTrace();
  }
}
```

When run, the code outputs something like:

```
[1] computing...
[2] updated from thread
[3] updated from thread
[1] computing...
[2] updated from thread
[3] updated from thread
[1] computing...
[2] updated from thread
[3] updated from thread
[1] computing...
[3] updated from thread
[2] updated from thread
[1] computing...
[3] updated from thread
[2] updated from thread
[1] updated from compute
[1] updated from thread
```

Here `compute` and `put` are called for key 1 on different threads. The `compute` began executing first and claimed the lock, preventing the `put` from executing until the `compute` call was completed. You can see this in the output as there is no update to key 1 until `compute` finishes, and then the write from `put` instantly executes afterwards. While these threads contest each other, the writes to keys 2 and 3 continue without issue.

### A closer look at compute

I wanted to quickly go over `compute` specifically as I often use it myself, but I still have to check how to use it correctly each time...

Although the JavaDocs for `compute` are actually quite thorough, seeing an example tends to make it sink in better (for me at least):

```java
// Setup for the example.
ScheduledExecutorService executorService = Executors.newSingleThreadScheduledExecutor();
Map<Integer, ScheduledFuture<?>> map = new ConcurrentHashMap<>();

// Always schedule a new future that prints "Hello" after a delay.
// If a future already exists for the passed in `key`, then `cancel` it.
map.compute(key, (k, future) -> {
  if (future != null && !future.isDone()) {
    future.cancel(true);
  }
  return executorService.schedule(() -> System.out.println("Hello"), 10, TimeUnit.SECONDS);
});
```

I have written code similar to this example many times. `compute` is handy here because it allows you to atomically interact with the existing keyed value while providing a new mapping. In this case, it allows the existing future to be cancelled before creating a new one and holding it within the map.

`compute` also lets you remove a mapping by returning `null`. However, this means that `compute` cannot be used to map a key to a `null` value. For `ConcurrentHashMap` though, this is a non-factor as the data structure explicitly disallows `null` values. From the JavaDocs:

```java
/**
* ...
* <p>Like {@link Hashtable} but unlike {@link HashMap}, this class
* does <em>not</em> allow {@code null} to be used as a key or value.
* ...
*/
```

Below is an example that removes a mapping using `compute`:

```java
// Setup for the example.
Map<Integer, Integer> map = new ConcurrentHashMap<>();

map.compute(key, (k, value) -> {
  int newValue = value + input;
  if (newValue > 100) {
    return null;
  }
  return newValue;
});
```

This example removes from the map if the `input` and existing `value` surpass a specific number or updates the mapping to the new total.

### Do not use get and put for atomic updates of existing mappings

`ConcurrentHashMap` cannot ensure deterministic behaviour if you write code like the following:

```java
// `Runnable` created because non-final variables can't be used in lambdas.
static class MyThread implements Runnable {

  private int number;
  private AtomicInteger sharedUpdateCounter;
  private int maxSharedCount;
  private Map<Integer, Integer> sharedMap;

  public MyThread(
    int number,
    AtomicInteger sharedUpdateCounter,
    int maxSharedCount,
    Map<Integer, Integer> sharedMap
  ) {
    this.number = number;
    this.sharedUpdateCounter = sharedUpdateCounter;
    this.maxSharedCount = maxSharedCount;
    this.sharedMap = sharedMap;
  }

  @Override
  public void run() {
    // Keep updating until all the shared count is reached by the threads.
    while (sharedUpdateCounter.getAndIncrement() < maxSharedCount) {
      // Read and icrement the existing value.
      int existingValue = sharedMap.get(1);
      int newValue = existingValue + 1;
      // Update with the incremented value.
      sharedMap.put(1, newValue);
      System.out.println("Thread [" + number + "] 1 -> " + newValue);
      sleep(1000);
    }
  }
}

public static void main(String[] args) {

  Map<Integer, Integer> map = new ConcurrentHashMap<>(Map.of(
    1, 0
  ));

  // Setup a shared count and max value to limit the number of writes to 12.
  AtomicInteger j = new AtomicInteger(0);
  int maxSharedCount = 12;

  // Start threads.
  List<Thread> threads = Stream.of(1, 2, 3).map(i -> {
    Thread thread = new Thread(new MyThread(i, j, maxSharedCount, map));
    thread.start();
    return thread;
  }).toList();

  // Wait for the threads to finish.
  threads.forEach(thread -> {
    try {
      thread.join();
    } catch (InterruptedException e) {
      e.printStackTrace();
    }
  });

  System.out.println("Final value = " + map.get(1));
}
```

This code which reads a key's current value using `get` and then updates it using `put`, allows updates from separate threads to overwrite each other, leading to an indeterministic outcome.

```
Thread [2] 1 -> 2
Thread [3] 1 -> 3
Thread [1] 1 -> 1
Thread [2] 1 -> 4
Thread [3] 1 -> 4
Thread [1] 1 -> 4
Thread [1] 1 -> 5
Thread [3] 1 -> 5
Thread [2] 1 -> 5
Thread [2] 1 -> 7
Thread [3] 1 -> 7
Thread [1] 1 -> 6
Final value = 7
```

The output would be 12 if reads and writes occurred atomically.

Rewriting the example to use `compute` instead of paired calls to `get` and `put` gives us the deterministic result that we desire:

```java
@Override
public void run() {
  while (sharedUpdateCounter.getAndIncrement() < maxSharedCount) {
    int newValue = sharedMap.compute(1, (key, existingValue) -> existingValue + 1);
    System.out.println("Thread [" + number + "] 1 -> " + newValue);
    sleep(1000);
  }
}
```

Outputs:

```
Thread [3] 1 -> 1
Thread [2] 1 -> 2
Thread [1] 1 -> 3
Thread [3] 1 -> 4
Thread [2] 1 -> 6
Thread [1] 1 -> 5
Thread [2] 1 -> 7
Thread [3] 1 -> 9
Thread [1] 1 -> 8
Thread [2] 1 -> 10
Thread [3] 1 -> 11
Thread [1] 1 -> 12
Final value = 12
```

The threads that perform each update will vary, but the final value is always consistent.

## Summary

`ConcurrentHashMap` allows concurrent reads while preventing simultaneous writes, ensuring that the map behaves deterministically. However, you must correctly use the writing methods to ensure your code behaves as expected. Relying on methods such as `compute` and `merge`, which allow you to atomically read an existing mapping and then act on it, is crucial; otherwise, the benefits of using `ConcurrentHashMap` are void.