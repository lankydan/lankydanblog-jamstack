---
title: Using Docker to shove an existing application into some containers
date: "2018-09-02"
published: true
tags: [java, spring, spring boot, mongodb, activemq, docker, containers, jms, docker-compose]
canonical_url: https://lankydanblog.com/2018/09/02/using-docker-to-shove-an-existing-application-into-some-containers/
cover_image: ./docker-hong-kong.png
include_date_in_url: true
github_url: https://github.com/lankydan/spring-boot-jms-docker
---

I have finally got round to learning how to use Docker past the level of knowing what it is and does without ever using it. This is the first post that I have attempted to use Docker in and will probably be what I refer to whenever I start a new project (for Java or Kotlin anyway).

This will be a short post that takes an existing project (from one of my other posts) and alters it so it can run inside of containers. I doubt this post will contain anything impressive but I know it will help me in the future and maybe it will help you now.

Before we begin, let's take a look at the existing project. Here are links to the [code](https://github.com/lankydan/spring-boot-jms) and the corresponding [blog post](https://lankydanblog.com/2017/06/18/using-jms-in-spring-boot/). The blog post covers all the information about the code. Here's the quick rundown so we can get on with this post. The old project is a Spring Boot application with a MongoDB database and ActiveMQ message queue. All these components are prime fodder for containerisation.

One last comment, for the content of this post, I am assuming that you have already installed Docker or can figure out how to do so yourself.

## Converting the Spring App

First up, the Spring Boot application.

This is the only part of the project that contains our code. The rest are just images downloaded from someone else's repository. To start moving this application towards running in a container, we need to create a `Dockerfile` that specifies the content of an image:

```dockerfile
FROM openjdk:8-jdk-alpine
LABEL maintainer="Dan Newton"
ADD target/spring-boot-jms-tutorial-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app.jar"]
```

This takes the base image of `openjdk:8-jdk-alpine` which is a good starting point for the application, adds the Jar built from the application code (naming it `app.jar`) and exposes a port for communication between containers. The final line defines the command that executed when the image is run in a container. This is what starts the Spring application.

To build an image from the `Dockerfile` run the command below (assuming you have already built the application code):

```
docker build -t spring-boot-jms-tutorial .
```

There is now an image named `spring-boot-jms-tutorial` (`-t` lets us define the name). This can now be used to create a container that executes the code that is packed into the image's Jar:

```
docker run --name application -p 4000:8080 spring-boot-jms-tutorial
```

This will create and run a container built from the `spring-boot-jms-tutorial` image. It names the container `application` and the `-p` property allows a port from a local machine to mapped to a port inside the container. To access port `8080` of the container we simply need to use port `4000` on our own machine.

If we stopped this container and wanted to run it again, we should use the command:

```
docker start application
```

Where `application` is the name of the container we created before. If `docker run` was used again it would create another new container rather than reusing the existing one. Actually, because we provided a name to the container, running the same `run` command from earlier will lead to an error.

Now the Spring application is successfully running in a container, but the logs are not looking very good. Let's have a quick look so we know what we need to do next.

MongoDB connection failing:

```
Exception in monitor thread while connecting to server mongocontainer:27017

com.mongodb.MongoSocketException: mongocontainer: Name does not resolve
    at com.mongodb.ServerAddress.getSocketAddress(ServerAddress.java:188) ~[mongodb-driver-core-3.6.4.jar!/:na]
    at com.mongodb.connection.SocketStreamHelper.initialize(SocketStreamHelper.java:59) ~[mongodb-driver-core-3.6.4.jar!/:na]
    at com.mongodb.connection.SocketStream.open(SocketStream.java:57) ~[mongodb-driver-core-3.6.4.jar!/:na]
    at com.mongodb.connection.InternalStreamConnection.open(InternalStreamConnection.java:126) ~[mongodb-driver-core-3.6.4.jar!/:na]
    at com.mongodb.connection.DefaultServerMonitor$ServerMonitorRunnable.run(DefaultServerMonitor.java:114) ~[mongodb-driver-core-3.6.4.jar!/:na]
    at java.lang.Thread.run(Thread.java:748) [na:1.8.0_171]
Caused by: java.net.UnknownHostException: mongocontainer: Name does not resolve
    at java.net.Inet4AddressImpl.lookupAllHostAddr(Native Method) ~[na:1.8.0_171]
    at java.net.InetAddress$2.lookupAllHostAddr(InetAddress.java:928) ~[na:1.8.0_171]
    at java.net.InetAddress.getAddressesFromNameService(InetAddress.java:1323) ~[na:1.8.0_171]
    at java.net.InetAddress.getAllByName0(InetAddress.java:1276) ~[na:1.8.0_171]
    at java.net.InetAddress.getAllByName(InetAddress.java:1192) ~[na:1.8.0_171]
    at java.net.InetAddress.getAllByName(InetAddress.java:1126) ~[na:1.8.0_171]
    at java.net.InetAddress.getByName(InetAddress.java:1076) ~[na:1.8.0_171]
    at com.mongodb.ServerAddress.getSocketAddress(ServerAddress.java:186) ~[mongodb-driver-core-3.6.4.jar!/:na]
    ... 5 common frames omitted
```

ActiveMQ also isn't there:

```
Could not refresh JMS Connection for destination 'OrderTransactionQueue' - retrying using FixedBackOff{interval=5000, currentAttempts=1, maxAttempts=unlimited}.
Cause: Could not connect to broker URL: tcp://activemqcontainer:61616.
Reason: java.net.UnknownHostException: activemqcontainer
```

We will sort these out in the next sections so the application can work in its entirety.

One last thing before we move onto looking at Mongo and ActiveMQ.

The `dockerfile-maven-plugin` could also be used to help with the above which builds the container as part of running `mvn install`. I chose not to use it since I couldn't get it to work properly with `docker-compose`. Below is a quick example of using the plugin:

```xml
<build>
    <plugins>
        <plugin>
            <groupId>com.spotify</groupId>
            <artifactId>dockerfile-maven-plugin</artifactId>
            <version>1.4.4</version>
            <executions>
                <execution>
                    <id>default</id>
                    <goals>
                        <goal>build</goal>
                        <goal>push</goal>
                    </goals>
                </execution>
            </executions>
            <configuration>
                <!-- Names the image: spring-boot-jms-tutorial -->
                <repository>${project.artifactId}</repository>
                <buildArgs>
                    <JAR_FILE>${project.build.finalName}.jar</JAR_FILE>
                </buildArgs>
            </configuration>
        </plugin>
    </plugins>
</build>
```

This then allows us to replace a few of the lines in the `Dockerfile`:

```dockerfile
FROM openjdk:8-jdk-alpine
LABEL maintainer="Dan Newton"
ARG JAR_FILE 
ADD target/${JAR_FILE} app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app.jar"]
```

Here one line has been added and one existing line is changed. The `JAR_FILE` argument replaces the original name of the Jar which is injected in by the plugin from the `pom.xml`. Make these changes and run `mvn install` and bam, your container is built with all the required code.

## Using the MongoDB image

There is a MongoDB image ready and waiting for us to use. It is ideally named `mongo`... What else did you expect? All we need to do is `run` the image and give it's container a name:

```
docker run -d --name mongocontainer mongo
```

Adding `-d` will run the container in the background. The name of the container is not just for convenience as the Spring application will need it later to connect to Mongo.

## Onto the ActiveMQ image

Setting up ActiveMQ is just as simple as Mongo. Run the command below:

```
docker run -d --name activemqcontainer -p 8161:8161 rmohr/activemq
```

Here the `8161` ports are mapped from the container to the machine it's running on, allowing the admin console to be accessed from outside the container.

## Tying it all together

If you have been running all these commands as you read through the post, you would have noticed that the `application` container hasn't actually been able to see the `mongocontainer` and `activemqcontainer`. This is because they are not running within the same network. Getting them to communicate is not difficult and takes only a few extra steps.

By default, Docker creates a Bridge network when setting one up without any extra configuration. Below is how to do so:

```
docker network create network
```

Now that the network (named `network`) is created, the commands that were run previously need to be altered to create containers that will connect to the network instead. Below are the 3 commands used to create the containers in the previous sections, each altered to join the network.

```
docker run -d --name mongocontainer --network=network mongo
docker run -d --name activemqcontainer -p 8161:8161 --network=network rmohr/activemq
docker run --name application -p 4000:8080 --network=network spring-boot-jms-tutorial
```

Once these are all run, the application as a whole will now work. Each container can see each other. Allowing the `application` container to connect to MongoDB and ActiveMQ in their respective containers.

At this point, everything is working. It runs in the same way that I remember it working when I had everything set up on my own laptop. But, this time around, nothing is setup locally... Except for Docker!

## Docker composing it up

We could have stopped there, but this next section will make running everything even easier. Docker Compose allows us to effectively bring all the commands that we ran earlier together and start all the containers and their network all in a single command. Obviously, there is some more setup but in the end, I think the amount of typing actually goes down.

To do this, we need to create a `docker-compose.yml` file:

```yml
version: '3'
services:
  appcontainer:
    build:
      context: .
      args:
        JAR_FILE: /spring-boot-jms-tutorial-1.0.0.jar
    ports:
    - "4000:8080"
  activemqcontainer:
    image: "rmohr/activemq"
    ports:
    - "8161:8161"
  mongocontainer:
    image: "mongo"
```

Use with this version of the `Dockerfile`:

```dockerfile
FROM openjdk:8-jdk-alpine
LABEL maintainer="Dan Newton"
ARG JAR_FILE 
ADD target/${JAR_FILE} app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app.jar"]
```

This is pretty much everything that needs to be done.

`appcontainer` is the Spring application container built from the project's code. The `build` property of the container tells Docker to build the image based on the projects `Dockerfile` found in the project's root directory. It passes in the `JAR_FILE` argument to the `Dockerfile` moving some of the configuration into this file instead.

The other two containers don't require much setup. As with the previous commands, the images they are built from are specified and `activemqcontainer` adds configuration around it's mapped ports.

The last piece of configuration happens in the background. A network is created and all the containers are added to it. This removes the need to create a network manually.

All that is left to do is run the `up` command:

```
docker-compose up
```

This will build and run all the containers. The application code image is built if necessary. Running this exact command will output all the containers logs to the console, to do this in the background add the `-d` flag:

```
docker-compose up -d
```

After doing so, we can have a look at the created containers and network. Running:

```
docker ps -a --format "table {{.Image}}\t{{.Names}}"
```

Shows us:

```
IMAGE                          NAMES
mongo                          spring-boot-jms_mongocontainer_1
spring-boot-jms_appcontainer   spring-boot-jms_appcontainer_1
rmohr/activemq                 spring-boot-jms_activemqcontainer_1
```

And the network:

```
docker network ls
```

Produces:

```
NETWORK ID          NAME                      DRIVER              SCOPE
163edcfe5ada        spring-boot-jms_default   bridge              local
```

The names of the containers and network are prepended with the name of the project.

## Conclusion

That is all there is to it... For a simple setup anyway, I'm sure there is much more the Docker gods could do but I am not one of them... Yet.

In conclusion, we took an existing application that I wrote to work locally on a machine and shoved everything into a few containers. This meant we went from a machine that needed to have everything set up, with both MongoDB and ActiveMQ installed. To instead, a machine that could skip all of this by using containers and only requiring an installation of Docker. Docker then manages all of the dependencies for us.

We looked at how to move each part of the application into a container and then tied it all together with Docker Compose. Leaving us, at the end of all this, with a single command that can move us from absolutely nothing to everything needed to run the application.

The code used in this post can be found on my [GitHub](https://github.com/lankydan/spring-boot-jms-docker).

If you found this post helpful, you can follow me on Twitter at [@LankyDanDev](http://www.twitter.com/LankyDanDev) to keep up with my new posts.

## Some links that I found helpful

- [Docker get started - part 2](https://docs.docker.com/get-started/part2/)
- [Docker compose getting started - Define services in a compose file](https://docs.docker.com/compose/gettingstarted/#step-3-define-services-in-a-compose-file)
- [Docker compose - build](https://docs.docker.com/compose/compose-file/#build)
- [Brians Java Blog - Docker multi container app](http://www.briansjavablog.com/2016/08/docker-multi-container-app.html)
- [Aymen Kanzari - Dockerize Spring Boot MongoDB application](https://www.linkedin.com/pulse/dockerize-spring-boot-mongodb-application-aymen-kanzari)