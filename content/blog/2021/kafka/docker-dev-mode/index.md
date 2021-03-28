---
title: Running Kafka locally with Docker
date: "2021-03-28"
published: true
tags: [kafka, docker]
cover_image: blog-card.png
---

There are two popular Docker images for Kafka that I have come across:

- [Bitmami/kafka](https://hub.docker.com/r/bitnami/kafka/) ([Github](https://github.com/bitnami/bitnami-docker-kafka))
- [wurstmeister/kafka](https://hub.docker.com/r/wurstmeister/kafka/) ([Github](https://github.com/wurstmeister/kafka-docker))

> I chose these instead of via [Confluent Platform](https://docs.confluent.io/platform/current/quickstart/ce-docker-quickstart.html) because they're more vanilla compared to the components Confluent Platform includes.

You can run both the `Bitmami/kafka` and `wurstmeister/kafka` images locally using the `docker-compose` config below, I'll duplicate it with the name of each image inserted:

- `Bitmami/kafka`:

  ```yml
  version: "3"
  services:
    zookeeper:
      image: 'bitnami/zookeeper:latest'
      ports:
        - '2181:2181'
      environment:
        - ALLOW_ANONYMOUS_LOGIN=yes
    kafka:
      image: 'bitnami/kafka:latest'
      ports:
        - '9092:9092'
      environment:
        - KAFKA_BROKER_ID=1
        - KAFKA_LISTENERS=PLAINTEXT://:9092
        - KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://127.0.0.1:9092
        - KAFKA_ZOOKEEPER_CONNECT=zookeeper:2181
        - ALLOW_PLAINTEXT_LISTENER=yes
      depends_on:
        - zookeeper
  ```

  > The [Bitnami](https://github.com/bitnami/bitnami-docker-kafka) image is well documented and is where I pulled this nice `docker-compose` config from.

- `wurstmeister/kafka`:

  ```yml
  version: "3"
  services:
    zookeeper:
      image: 'wurstmeister/zookeeper:latest'
      ports:
        - '2181:2181'
      environment:
        - ALLOW_ANONYMOUS_LOGIN=yes
    kafka:
      image: 'wurstmeister/kafka:latest'
      ports:
        - '9092:9092'
      environment:
        - KAFKA_BROKER_ID=1
        - KAFKA_LISTENERS=PLAINTEXT://:9092
        - KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://127.0.0.1:9092
        - KAFKA_ZOOKEEPER_CONNECT=zookeeper:2181
        - ALLOW_PLAINTEXT_LISTENER=yes
      depends_on:
        - zookeeper
  ```

> It is important to have `KAFKA_ADVERTISED_LISTENERS` set or you won't be able to connect to Kafka from an external application. More information on this topic can be found [here](https://www.confluent.io/blog/kafka-client-cannot-connect-to-broker-on-aws-on-docker-etc/), which I found extremely useful when I did this incorrectly.

Once you have started the Kafka and Zookeeper containers, you're good to go. You can start connecting to Kafka either directly or from an application.

- Directly, via Kafka's consumer and producer scripts:

  ```bash
  # Create topic
  docker exec -it kafka_kafka_1 kafka-topics.sh --create --bootstrap-server kafka:9092 --topic my-topic
  # Create events
  docker exec -it kafka_kafka_1 kafka-console-producer.sh --bootstrap-server kafka:9092 --topic my-topic
  # Read events
  docker exec -it kafka_kafka_1 kafka-console-consumer.sh --bootstrap-server kafka:9092 --topic my-topic --from-beginning
  ```

- From an application (in Kotlin):

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
        send(message)
      }
    }

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
        for (message in messages) {
          println("Consumer reading message: ${message.value()}")
        }
        commitAsync()
      }
    }
    ```