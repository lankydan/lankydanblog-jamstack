---
title: Sending a HTTP request in Apache Flink
date: "2021-02-07"
published: true
tags: [java, apache flink, flink]
cover_image: blog-card.png
---

You can send a HTTP request in an Apache Flink application using code similar to the following:

```java
public class HttpRequestFunction extends RichAsyncFunction<String, String> {

  private transient OkHttpClient client;

  @Override
  public void open(Configuration parameters) {
    client = new OkHttpClient();
  }

  @Override
  public void asyncInvoke(String input, ResultFuture<String> resultFuture) {
    Request request = new Request.Builder()
      .get()
      .url("https://some-random-url.com")
      .build();
    Call call = client.newCall(request);
    call.enqueue(new Callback() {
      @Override
      public void onFailure(@NotNull Call call, @NotNull IOException e) {
        resultFuture.complete(Collections.emptyList());
      }

      @Override
      public void onResponse(@NotNull Call call, @NotNull Response response) throws IOException {
        resultFuture.complete(Collections.singleton(response.body().string()));
      }
    });
  }
}
```

The HTTP client you use doesn't have to be an `OkHttpClient`, you can use whatever client you want, but ideally one that can send asynchronous requests. By doing so, you can mix it with Flink's ability to execute asynchronous functions; otherwise you're application will slow down as it waits for each request to come back.

You can write an asynchronous function by extending `RichAsyncFunction` and returning a future completed by the async code. In the code above, the HTTP request's callback completes the future. I chose to `complete` the `resultFuture` with an `emptyList` when an error occurred to exclude it from further processing while allowing the stream to continue. I could have used `completeExceptionally` instead but would have lead to the termination of the stream.

> `resultFuture.complete` expects a `List<T>` even though `ResultFuture`'s generic type is only `T`.

Once you have the function written, you'll need to call it in a different way to other `map` or `filter` functions:

```java
AsyncDataStream.unorderedWait(
  // Original stream
  stream,
  // The function
  new HttpRequestFunction(),
  // Tiemout length
  5,
  // Timeout unit
  TimeUnit.SECONDS
)
```

> I'm not sure why you have to call it in a completely different way 🤷.

This code takes in a stream and returns a mutated stream that the `HttpRequestFunction has altered`. It also requires you to specify a timeout using the last two arguments.

You can also use `AsyncDataStream.orderedWait` if you want the output stream's events to remain the same as the input. That being said, it might introduce an overhead to the processing of events, you can find more information in [Flink's documentation](https://ci.apache.org/projects/flink/flink-docs-stable/dev/stream/operators/asyncio.html#event-time).

That should be enough to get you going! Happy coding!