---
title: Ktor a Kotlin web framework
date: "2019-07-15"
published: true
tags: [kotlin, ktor]
cover_image: ./title-card.png
---

[Ktor](https://ktor.io/) is a asynchronous web framework written in and designed for Kotlin. Allowing the more interesting features of Kotlin, such as coroutines, to not only be used but supported as a first class citizen. Normally, Spring is my go to general framework and generally what I use when I need to put a REST API together. Spring does have support for Kotlin features, including coroutines, and is always adding better and better Kotlin support. That being said, I wanted to try out Ktor after attending a recent London Kotlin meetup. So this post is a learning experience for both you and me. The content of this post is will to lack experienced advice but will instead document my thoughts and opinions as I play around with Ktor for the first time.

Here is a bit more background information on Ktor. It is backed by [Jetbrains](https://www.jetbrains.com/) who are also the creators of Kotlin itself. Who better to make a Kotlin web framework than the men and women that work on the language.

## Implementation

### Dependencies

```groovy
buildscript {
  ext.kotlin_version = '1.3.40'
  ext.ktor_version = '1.2.2'

  repositories {
    mavenCentral()
  }
  dependencies {
    classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlin_version"
  }
}

apply plugin: 'java'
apply plugin: 'kotlin'

// might not be needed but my build kept defaulting to Java 12
java {
  disableAutoTargetJvm()
}

// Ktor uses coroutines
kotlin {
  experimental {
    coroutines "enable"
  }
}

compileKotlin {
  kotlinOptions.jvmTarget = "1.8"
}
compileTestKotlin {
  kotlinOptions.jvmTarget = "1.8"
}

dependencies {
  // Kotlin stdlib + test dependencies

  // ktor dependencies
  compile "io.ktor:ktor-server-netty:$ktor_version"
  compile "io.ktor:ktor-jackson:$ktor_version"
  // logback for logging
  compile group: 'ch.qos.logback', name: 'logback-classic', version: '1.2.3'
  // kodein for dependency injection
  compile group: 'org.kodein.di', name: 'kodein-di-generic-jvm', version: '6.3.0'
}
```

There are a few things going on here.

Firstly, Ktor requires a minimum version of Kotlin `1.3`, so that coroutines can be leveraged. 

Dependencies on `ktor-server-netty` and `ktor-jackson` are brought it. As the name suggests, this means [Netty](https://netty.io/) will be used for this post. Different underlying web servers can be used depending on which you choose to import. Currently, the remaining options are [Jetty](https://www.eclipse.org/jetty/) and [Tomcat](http://tomcat.apache.org/).

## IS THIS ONLY NEEDED BECAUSE OF THE CALL LOGGING
[Logback](https://logback.qos.ch/) is brought in to handle logging. This is not included in the Ktor dependencies and is needed if you plan on doing any sort of logging.

[Kodein](https://kodein.org/Kodein-DI/) is a dependency injection framework written in Kotlin. I have loosely used it in this post and due to the size of the code examples, I could probably remove it completely. The main reason it is there is to provide me with another chance to use something other than Spring. Remember this is also one of the reasons that I am trying out Ktor.

### Starting the web server

With the boring stuff out of the way, I can now run you through implementing a simple web server. The code below is all you need:

```kotlin
fun main() {
  embeddedServer(Netty, port = 8080, module = Application::module).start()
}

fun Application.module() {
  // code that does stuff which is covered later
}
```

Bam. There you have it. A simple web server running with Ktor and Netty. Ok, yes, it doesn't really do anything but we'll expand on this in the following sections. The code is pretty self explanatory. The only piece worth highlighting is the `Application.module` function. The `module` parameter of `embeddedServer` requires an extension function for `Application`. This is going to be the _main_ function that makes the server do stuff.

### Routing

### Installing extra features

### Brief mention for Kodein

## My first impression on Ktor