---
title: Common Fork Join Pool and Streams
date: "2017-02-01"
published: true
tags: [java, java 8, java streams, threading]
cover_image: ./title-card.png
canonical_url: https://lankydanblog.com/2017/02/01/common-fork-join-pool-and-streams/
include_date_in_url: true
---

In my post [Dipping into Java 8](https://dzone.com/articles/dipping-into-java-8-streams) Streams a comment was added that I should explain what the Common Fork Join Pool is and how it is linked to parallel streams. Honestly I had never heard of it so I set out on my quest to find the answer somewhere on the internet and make this post to attempt to follow up on the posted comment. Unfortunately I wasn't able to reach the understanding about this subject that I hoped I would, so I am going to write what I found out from doing some research and from debugging some code myself and if you think anything is missing then leave a comment. This is after all a place to learn!

So lets start with something I am pretty sure about. When you use a parallel stream it will run its process in multiple threads when appropriate. Now that's what you would expect as it has the word parallel in its name. But what it doesn't say is that all the parallel streams that you create will share their threads from one Common Fork Join Pool. This shouldn't be a problem if your just using a single parallel stream every now and then but if your running a few of them concurrently it might run slower expected as the threads they use are being shared between them. Another piece of information to note is that although it is called a parallel stream it does not run concurrently by default. The `Collection` that is being processed is done multi-threaded but the main thread will still wait for the overall process to finish.

Lets start with a single parallel stream to see how many threads it creates so we have a baseline to continue from.

```java
public class CommonForkJoinPoolExample1 {

	public static void main(String args[]) throws InterruptedException {

		final List<Integer> numbers = getNumbers();

		numbers.parallelStream().forEach(n -> {
			try {
				Thread.sleep(5);
				System.out.println("Loop 1 : " + Thread.currentThread());
			} catch (InterruptedException e) {

			}
		});
	}

	private static List<Integer> getNumbers() {
		List<Integer> numbers = new ArrayList<>(5);
		for (int i = 0; i < 100; i++)
			numbers.add(i);
		return Collections.unmodifiableList(numbers);
	}

}
```

```java
Thread [main]
[Daemon Thread [ForkJoinPool.commonPool-worker-1]
[Daemon Thread [ForkJoinPool.commonPool-worker-2]
[Daemon Thread [ForkJoinPool.commonPool-worker-3]
```

So if you debug into this code after adding some breakpoints into the `forEach` code it shows that when a parallel stream is ran it uses the main thread and the threads in the Common Fork Join Pool.

Now lets see what happens when two parallel streams are ran at once, what happens to the threads that are used?

```java
public class CommonForkJoinPoolExample2 {

	public static void main(String args[]) throws InterruptedException {

		final List<Integer> numbers = getNumbers();

		Thread t1 = new Thread(() -> numbers.parallelStream().forEach(n -> {
			try {
				Thread.sleep(5);
				System.out.println("Loop 1 : " + Thread.currentThread());
			} catch (InterruptedException e) {

			}
		}));
		Thread t2 = new Thread(() -> numbers.parallelStream().forEach(n -> {
			try {
				Thread.sleep(5);
				System.out.println("Loop 2 : " + Thread.currentThread());
			} catch (InterruptedException e) {

			}
		}));

		t1.start();
		t2.start();
		t1.join();
		t2.join();
	}

	private static List<Integer> getNumbers() {
		List<Integer> numbers = new ArrayList<>(5);
		for (int i = 0; i < 100; i++)
			numbers.add(i);
		return Collections.unmodifiableList(numbers);
	}

}
```

```java
Thread [Thread-0]
Thread [Thread-1]
[Daemon Thread [ForkJoinPool.commonPool-worker-1]
[Daemon Thread [ForkJoinPool.commonPool-worker-2]
[Daemon Thread [ForkJoinPool.commonPool-worker-3]
```

From this you can see the running threads consist of the two created threads plus the common pool threads. Even though the two parallel streams are being ran concurrently there is no indication of this from looking at the common pool threads and can only be seen by the fact that there are two normal threads running as well.

So how do you make the parallel streams use their own Fork Join pools instead of sharing the common pool? Well you need to create your own `ForkJoinPool` object and use this pool to contain the stream code.

```java
public class ForkJoinPoolExample {

	public static void main(String args[]) throws InterruptedException {

		List<Integer> numbers = buildIntRange();

		ForkJoinPool forkJoinPool = new ForkJoinPool(4);
		Thread t1 = new Thread(() -> forkJoinPool.submit(() -> {
			numbers.parallelStream().forEach(n -> {
				try {
					Thread.sleep(5);
					System.out.println("Loop 1 : " + Thread.currentThread());
				} catch (InterruptedException e) {

				}
			});
		}).invoke());

		ForkJoinPool forkJoinPool2 = new ForkJoinPool(4);
		Thread t2 = new Thread(() -> forkJoinPool2.submit(() -> {
			numbers.parallelStream().forEach(n -> {
				try {
					Thread.sleep(5);
					System.out.println("Loop 2 : " + Thread.currentThread());
				} catch (InterruptedException e) {

				}
			});
		}).invoke());

		t1.start();
		t2.start();
		t1.join();
		t2.join();

	}

	private static List<Integer> buildIntRange() {
		List<Integer> numbers = new ArrayList<>(5);
		for (int i = 0; i < 100; i++)
			numbers.add(i);
		return Collections.unmodifiableList(numbers);
	}

}
```

The number defined in `ForkJoinPool(4)` refers to the number of threads in the pool which in this case is four threads. One of the ways to execute a parallel stream from inside a `ForkJoinPool` is to submit `Runnable` task (which submits the task to be executed sometime in the future) and invoked to start its execution. Lets look at the threads.

```java
Thread [Thread-0]
Thread [Thread-1]
[Daemon Thread [ForkJoinPool.commonPool-worker-1]
[Daemon Thread [ForkJoinPool.commonPool-worker-2]
[Daemon Thread [ForkJoinPool.commonPool-worker-3]
[Daemon Thread [ForkJoinPool-1-worker-0]
[Daemon Thread [ForkJoinPool-1-worker-1]
[Daemon Thread [ForkJoinPool-1-worker-2]
[Daemon Thread [ForkJoinPool-1-worker-3]
[Daemon Thread [ForkJoinPool-2-worker-0]
[Daemon Thread [ForkJoinPool-2-worker-1]
[Daemon Thread [ForkJoinPool-2-worker-2]
[Daemon Thread [ForkJoinPool-2-worker-3]
```

The first thing your see is that there are way more threads being ran. The second thing you will probably notice is that pools `ForkJoinPool-1` and `ForkJoinPool-2` now exist and have four workers/threads defined from 0 to 3. Hopefully you will also notice that the common pool is still there even though streams are being ran from inside the defined fork join pools. Honestly I do not know what this happens, but it looks like when a `ForkJoinPool` is defined the common pool will still be used with the defined pool being added on top. So if you know something about this leave a comment!

Hopefully in this post I have somewhat answered the comment that was left on my [Dipping into Java 8](https://dzone.com/articles/dipping-into-java-8-streams). If I haven't done this effectively maybe someone will leave a comment telling me how silly I am (hopefully not in much harsher words) while also adding some useful information for everyone to see.

