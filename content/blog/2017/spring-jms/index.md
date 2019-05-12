---
title: Using JMS in Spring Boot
date: "2017-06-18"
published: true
tags: [activemq, spring, spring boot, spring boot jms]
canonical_url: https://lankydanblog.com/2017/06/18/using-jms-in-spring-boot/
cover_image: ./spring-jms-tube.jpeg
include_date_in_url: true
github_url: https://github.com/lankydan/spring-boot-jms
---

JMS (Java Message Service) is a Java Message Oriented Middleware used to send messages between clients and works by sending messages to a message queue which are then taken when possible to execute a transaction. This post will focus on implementing JMS with Spring Boot, which doesn't take long at all to setup.

JMS and message queues in general bring some certain advantages over using RESTful services such as:

- __Redundancy__ - A message must confirm that it has completed it's transaction and that it can now be removed from the queue, but if the transaction fails it can be reprocessed. The messages can also be stored in a database allowing them to continue later on even if the server stops.
- __Asynchronous messaging__ - As the process time of the message cannot be guaranteed the client that sent the message can carry on asynchronously to the completion of the transaction. Due to this the queue should be used to write data (POST if your thinking in a RESTful mindset).
- __Loose Coupling__ - The services do not interact directly and only know where the message queue is, where one service sends messages and the other receives them.

Now lets get on to actually implementing it. As mentioned earlier we will be using Spring Boot which makes everything nice and easy to setup and Apache ActiveMQ to create and manage the message queue.

The Maven dependencies required for setting up JMS are shown below (some extra dependencies not related to JMS were used and are not shown in the code snippet)

```xml
<dependencies>
  <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-activemq</artifactId>
  </dependency>
  <dependency>
      <groupId>org.apache.activemq</groupId>
      <artifactId>activemq-broker</artifactId>
  </dependency>
  <dependency>
      <groupId>com.fasterxml.jackson.core</groupId>
      <artifactId>jackson-databind</artifactId>
  </dependency>
  <!-- unrelated dependencies -->
</dependencies>
```

The first thing we will look at is the receiver which will take a message from the front of the queue and perform a transaction.

```java
@Component
public class OrderTransactionReceiver {

  @Autowired
  private OrderTransactionRepository transactionRepository;

  @JmsListener(destination = "OrderTransactionQueue", containerFactory = "myFactory")
  public void receiveMessage(OrderTransaction transaction) {
    System.out.println("Received <" + transaction + ">");
    transactionRepository.save(transaction);
  }
}
```

In this scenario the `OrderTransactionReceiver` takes messages from the `OrderTransactionQueue` and save them to the database by using the `transactionRepository`. The name of the method that receives the message is irrelevant and can be called whatever you want, although `receiveMessage` is quite appropriate, but it must have the `@JmsListener` annotation with destination property defining the name of the queue. Included in this annotation is the `containerFactory` property which is not required if you are happy with the default `DefaultJmsListenerContainerFactory` that is provided by Spring Boot.

So now we can take messages from the queue its probably a good idea to know how to put them there in the first place.

```java
@RestController
@RequestMapping("/transaction")
public class OrderTransactionController {

  @Autowired private JmsTemplate jmsTemplate;

  @PostMapping("/send")
  public void send(@RequestBody OrderTransaction transaction) {
    System.out.println("Sending a transaction.");
    // Post message to the message queue named "OrderTransactionQueue"
    jmsTemplate.convertAndSend("OrderTransactionQueue", transaction);
  }
}
```

There is quite a lot of noise in this example as there code that is not related to posting to the message queue. There is only one line that is needed to send the message and in case it wasn't clear I added a comment into the example. Actually that earlier statement a lie, it is two lines of code, but that is only if you included injecting in the `JmsTemplate` into the controller. The reason that I wrote this example inside a `@RestController` is to demonstrate a possible use of the message queue, a user makes a request via the REST API which will send a message to the queue to be executed at some point. While this happens the user is continuing with what they were doing as they do not need to wait for the request's execution to finish.

The final piece to this simple puzzle is main application defined by the class with `@SpringBootApplication`.

```java
@EnableJms
@ComponentScan(basePackages = "lankydan.tutorial")
@EnableMongoRepositories(basePackages = "lankydan.tutorial")
@SpringBootApplication
public class Application {

  public static void main(String[] args) {
    SpringApplication.run(Application.class, args);
  }

  // Only required due to defining myFactory in the receiver
  @Bean
  public JmsListenerContainerFactory<?> myFactory(
      ConnectionFactory connectionFactory,
      DefaultJmsListenerContainerFactoryConfigurer configurer) {
    DefaultJmsListenerContainerFactory factory = new DefaultJmsListenerContainerFactory();
    configurer.configure(factory, connectionFactory);
    return factory;
  }

  // Serialize message content to json using TextMessage
  @Bean
  public MessageConverter jacksonJmsMessageConverter() {
    MappingJackson2MessageConverter converter = new MappingJackson2MessageConverter();
    converter.setTargetType(MessageType.TEXT);
    converter.setTypeIdPropertyName("_type");
    return converter;
  }
}
```

Lets start with the `@EnableJms` annotation which gives a clear indication what it is for, but to be a bit more precise it triggers the discovery of methods marked with the `@JmsListener` and creates the listeners themselves behind the scenes. So if you remember this will be the `recieveMessage` method defined in `OrderTransactionReceiver`. The next two annotations, `@ComponentScan` and `@EnableMongoRepositories` are not required to setup JMS, but due to how the classes in this example are spread out they must be added so that the `OrderTransactionController` and `OrderTransactionRepository` can be found.

Going past the annotations on the class, remember the `myFactory` that was specified in the `@JmsListener` here is the code that defines it. This implementation matches what the default `DefaultJmsListenerContainerFactory` would be if we decided not to specify a factory inside the `@JmsListener`. A `MessageConverter` has to be defined as the default implementation can only convert basic types, which the `OrderTransaction` object is not. This implementation uses JSON to pass the messages to and from the queue. Spring Boot is kind enough to detect the `MessageConverter` and make use of it in the `JmsTemplate` and `JmsListenerContainerFactory`.

Now we have everything put together it can be tested to check that it actually works, through the use of some nicely placed print lines that you can see from the examples we can see how it makes it's way from `OrderTransactionController` and to `OrderTransactionReceiver`.

By making a POST request to

```
localhost:8080/transaction/send
```

With the request body of

```json
{
  "from":"you",
  "to":"me",
  "amount":200
}
```

And looking at the console we can see

```
Sending a transaction.
Received <OrderTransaction(from=you, to=me, amount=200)>
```

So we have proved that it works, but what happens if the transaction fails due to an exception occurring? As mentioned at the beginning of this post message queues provide redundancy as the transaction will be retried if it fails. To test this I have thrown an exception and added a counter into the `receiveMessage` method in `OrderTransactionReceiver`.

```
Sending a transaction.
<1> Received <OrderTransaction(from=you, to=me, amount=200)>
2017-06-17 19:12:59.748 WARN 2352 --- [enerContainer-1] o.s.j.l.DefaultMessageListenerContainer : Execution of JMS message listener failed, and no ErrorHandler has been set.
...
<7> Received <OrderTransaction(from=you, to=me, amount=200)>
```

Obviously I have removed the actual exceptions and messages from the console output but this displays what happens when the transaction fails quite clearly. As we can see as the transaction fails each time the message is redelivered until a maximum attempt of 7 tries has been made (1 initial try and 6 retries).

The amount of re-deliveries can be configured but it requires a bit more setup. To be able to alter this we need to install [Apache ActiveMQ](http://activemq.apache.org/activemq-5145-release.html) which allows extra configuration past what is provided by Spring Boot by default. When ActiveMQ is installed and the service is up and running (extra installation information found [here](http://activemq.apache.org/installation.html)) only a small change to the actual code is required, in fact its not actually a code change but a property change made in the `application.properties` file, which should be placed in the resources folder if one does not already exist.

```properties
spring.activemq.user=admin
spring.activemq.password=admin
spring.activemq.broker-url=tcp://localhost:61616?jms.redeliveryPolicy.maximumRedeliveries=1
```

As we can see from the snippet above the maximum amount of re-deliveries will now be limited to 1, the other properties are the default username and password of ActiveMQ. In case you start wondering about what port is being used by here by the `broker-url`, this is the default port that ActiveMQ is ran on so it should (hopefully...) work straight away if you try it yourself.

Going back to the console output it also mentioned not having an `ErrorHandler` defined, so lets set one up by adding some extra code to the factory that was created earlier.

```java
@Bean
public JmsListenerContainerFactory<?> myFactory(
    ConnectionFactory connectionFactory,
    DefaultJmsListenerContainerFactoryConfigurer configurer) {
  DefaultJmsListenerContainerFactory factory = new DefaultJmsListenerContainerFactory();

  // anonymous class
  factory.setErrorHandler(
      new ErrorHandler() {
        @Override
        public void handleError(Throwable t) {
          System.err.println("An error has occurred in the transaction");
        }
      });

  // lambda function
  factory.setErrorHandler(t -> System.err.println("An error has occurred in the transaction"));

  configurer.configure(factory, connectionFactory);
  return factory;
}
```

Now when an error occurs the ugly stacktrace wont plague the console log, unless you want it to of course. I have included both the anonymous class and lambda function versions of implementing the `ErrorHandler` just so it is a bit clear in what it is doing.

By configuring the maximum re-deliveries and adding the `ErrorHandler` the console output will now look like
<pre class="language-text">
Sending a transaction.
<1> Received <OrderTransaction(from=you, to=me, amount=200)>
<span style="color:#ff0000;">An error has occurred in the transaction</span>
<2> Received <OrderTransaction(from=you, to=me, amount=200)>
<span style="color:#ff0000;">An error has occurred in the transaction</span>
</pre>
So there we have it, we have set up a simple JMS using Spring Boot and Apache ActiveMQ, along with a little introduction into why message queues like JMS can be useful such as providing redundancy, asynchronous messaging and loose coupling. As usual Spring and Spring Boot makes things quite simple for us to implement allowing the basic code to be written quickly and without loads of code.

For all the source code included in this tutorial along with any not shown here can be found on my [GitHub](https://github.com/lankydan/spring-boot-jms).

If you found this post helpful, please share it and if you want to keep up with my latest posts then you can follow me on Twitter at [@LankyDanDev](https://twitter.com/LankyDanDev).