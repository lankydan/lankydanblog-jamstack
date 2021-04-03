---
title: Kafka producer and consumer written with Kotlin
date: "2021-04-03"
published: true
tags: [kafka, kotlin]
cover_image: blog-card.png
---

I wanted to write a short and sweet blog post on writing a Kafka producer and consumer in Kotlin before delving deeper into the topic of Kafka. Yes, that was a "topic" pun... I'll see myself out.

This post will contain example producer and consumer code written in Kotlin.

## Producer

The code below creates a `Producer` that continually pumps messages to its chosen topic.

```kotlin
fun createProducer(): Producer<String, String> {
  val props = Properties()
  props["bootstrap.servers"] = "localhost:9092"
  props["acks"] = "all"
  props["retries"] = 0
  props["linger.ms"] = 1
  props["key.serializer"] = "org.apache.kafka.common.serialization.StringSerializer"
  props["value.serializer"] = "org.apache.kafka.common.serialization.StringSerializer"

  return KafkaProducer(props)
}

fun Producer<String, String>.produceMessages(topic: String) {
  fixedRateTimer(daemon = true, period = Duration.ofSeconds(2).toMillis()) {
    val time = LocalDateTime.now()
    val message = ProducerRecord(
      topic, // topic
      time.toString(), // key
      "Message sent at ${LocalDateTime.now()}" // value
    )
    println("Producer sending message: $message")
    this@produceMessages.send(message)
  }
}
```

> This is an example, so the code is not particularly useful.

When creating a `KafkaProducer`, you must provide its configuration via a `Properties` object or a `Map<String, Object>`. `KafkaProducer`'s constructor also accepts values for the `key.serializer` and `value.serializer` properties.

In this example, a `StringSerializer` is used for both keys and values, as the producer is pushing messages comprised purely of `String`s. At a minimum, you have to include a single serializer, or an error will be coming your way:

```javastacktrace
Exception in thread "main" org.apache.kafka.common.config.ConfigException: Missing required configuration "key.serializer" which has no default value.
	at org.apache.kafka.common.config.ConfigDef.parseValue(ConfigDef.java:478)
	at org.apache.kafka.common.config.ConfigDef.parse(ConfigDef.java:468)
	at org.apache.kafka.common.config.AbstractConfig.<init>(AbstractConfig.java:108)
	at org.apache.kafka.common.config.AbstractConfig.<init>(AbstractConfig.java:129)
	at org.apache.kafka.clients.producer.ProducerConfig.<init>(ProducerConfig.java:536)
	at org.apache.kafka.clients.producer.KafkaProducer.<init>(KafkaProducer.java:330)
	at org.apache.kafka.clients.producer.KafkaProducer.<init>(KafkaProducer.java:302)
	at dev.lankydan.kafka.producer.ProducerKt.createProducer(Producer.kt:30)
	at dev.lankydan.kafka.MainKt.main(Main.kt:13)
	at dev.lankydan.kafka.MainKt.main(Main.kt)
```

Using the wrong serializer will cause the following error:

```javastacktrace
Exception in thread "Timer-0" org.apache.kafka.common.errors.SerializationException: Can't convert key of class java.lang.String to class org.apache.kafka.common.serialization.UUIDSerializer specified in key.serializer
Caused by: java.lang.ClassCastException: class java.lang.String cannot be cast to class java.util.UUID (java.lang.String and java.util.UUID are in module java.base of loader 'bootstrap')
	at org.apache.kafka.common.serialization.UUIDSerializer.serialize(UUIDSerializer.java:29)
	at org.apache.kafka.common.serialization.Serializer.serialize(Serializer.java:62)
	at org.apache.kafka.clients.producer.KafkaProducer.doSend(KafkaProducer.java:918)
	at org.apache.kafka.clients.producer.KafkaProducer.send(KafkaProducer.java:886)
	at org.apache.kafka.clients.producer.KafkaProducer.send(KafkaProducer.java:774)
	at dev.lankydan.kafka.producer.ProducerKt$produceMessages$$inlined$fixedRateTimer$1.run(Timer.kt:156)
	at java.base/java.util.TimerThread.mainLoop(Timer.java:556)
	at java.base/java.util.TimerThread.run(Timer.java:506)
```

> You can find the available configuration options in [Kafka's documentation](https://kafka.apache.org/documentation/#producerconfigs).

After creating the producer, it is ready to start sending events/messages/records, or whatever you wish to call them. You can send a record by building a `ProducerRecord` and executing `Producer.send`.

> `Producer` is the interface that `KafkaProducer` implements, which it also shares with `MockProducer`.

A `ProducerRecord` consists of 6 components:

- __Topic__ - The topic to send the record to.
- __Partition__ - The partition to send the record to. This property is optional. When it is not provided, the partition is calculated by hashing the record's key and modding it against the number of partitions.
- __Timestamp__ - The timestamp of the record. When it is not explicitly provided, it will default to `System.currentTimeMillis`.
- __Key__ - The key of the record.
- __Value__ - The value of the record.
- __Headers__ - Extra metadata to go alongside the record's value.

`Producer.send` completes the process as it hands off the record to the Kafka broker/cluster.

## Consumer

The following consumer code compliments the previously shown producer:

```kotlin
fun createConsumer(): Consumer<String, String> {
  val props = Properties()
  props.setProperty("bootstrap.servers", "localhost:9092")
  props.setProperty("group.id", "test")
  props.setProperty("enable.auto.commit", "true")
  props.setProperty("auto.commit.interval.ms", "1000")
  props.setProperty("key.deserializer", "org.apache.kafka.common.serialization.StringDeserializer")
  props.setProperty("value.deserializer", "org.apache.kafka.common.serialization.StringDeserializer")
  return KafkaConsumer(props)
}

fun Consumer<String, String>.consumeMessages(topic: String) {
  subscribe(listOf(topic))
  while (true) {
    val messages: ConsumerRecords<String, String> = poll(Duration.ofMillis(5000))
    if (!messages.isEmpty) {
      for (message: ConsumerRecord<String, String> in messages) {
        println("Consumer reading message: ${message.value()}")
      }
      commitAsync { offsets, exception ->
        for ((partition, metadata) in offsets) {
          println("Committed offset for topic: ${partition.topic()}, partition: ${partition.partition()}, offset: ${metadata.offset()}")
        }
      }
    } else {
      println("No messages to read and poll timeout reached")
    }
  }
}
```

Similar to initialising a `KafkaProducer`, you must provide configuration when creating a `KafkaConsumer`.

> You can find the available configuration options in [Kafka's documentation](https://kafka.apache.org/documentation/#consumerconfigs).

The consumer is in charge of requesting records from the Kafka broker. To do this, it subscribes (by calling `subscribe`) to the topic(s) it wants records from. Calling `Consumer.poll` requests records from the subscribed topics and blocking the executing thread until the consumer receives some records or reaching the timeout duration. Surpassing the timeout causes the code to move on with an empty collection of records. No exceptions are thrown, which makes sense; the lack of messages isn't unusual behaviour; it is only an indication that no new records are available for processing.

When messages are successfully received, `poll` will return `ConsumerRecords` (a collection of `ConsumerRecord`s). These records consist of the following information (most of them match the data contained in `ProducerRecord`):

- __Topic__ - The topic the record is from.
- __Partition__ - The partition the record was placed in.
- __Timestamp__ - The timestamp that the record was recorded with.
- __Key__ - The key of the record.
- __Value__ - The value of the record.
- __Headers__ - Extra metadata to stored alongside the record's value.
- __Offset__ - The offset of the record (the position in the partition).

> `ConsumerRecords` implements `Iterable` so it can be looped over directly, as shown in the example above.

After processing the batch of received records, you should update the offset. Calling `commitAsync` will set the offset, for each subscribed topic, to the highest offset of the received records. You can call the `commitAsync` overload below if you want to specify the offsets to update to yourself:

```java
void commitAsync(Map<TopicPartition, OffsetAndMetadata> offsets, OffsetCommitCallback callback);
```

You can use the `OffsetCommitCallback` to trigger a callback when committing the offset, which can be beneficial as it is happening asynchronously.

> `commitSync` is the synchronous version of `commitAsync` which will block the current thread until the consumer propagates the update to the Kafka broker.

How you decide to update your offset is up to you and the behaviour your application requires.

## Summary

You have now seen an example of how to write a Kafka producer and consumer in Kotlin. There isn't anything special about it being written in Kotlin, but now you know what it could like like if you were wondering. 

In short, to create a producer, you should instantiate a `KafkaProducer`, make `ProducerRecords` and `send` them to the Kafka broker. To consume these messages, create a `KafkaConsumer`, `poll` new records, and remember to call `commitAsync`/`commitSync` to update your topics' offsets.