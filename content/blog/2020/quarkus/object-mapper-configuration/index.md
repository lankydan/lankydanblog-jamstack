---
title: Providing your own Jackson ObjectMapper in Quarkus
date: "2020-12-07"
published: true
tags: [java, quarkus, jackson]
cover_image: blog-card.png
---

I am writing this short post after me, and a colleague had a painful experience trying to get Jackson working in a Quarkus application. The [Quarkus documentation](https://quarkus.io/guides/rest-json#jackson) does actually tell you how to do so, but both my colleague and I found that it was rather blasé with its explanation. 

Why did we feel this way? 

Unfortunately, we were both inexperienced (noobs?) with [CDI](https://quarkus.io/guides/cdi-reference), which Quarkus uses for dependency injection. Furthermore, we also had to do something that wasn't directly explained in the documentation. Making everything that _should_ have been easy, unclear, and required a whole lot of googling to get right.

For anyone else that ran into the same walls we did, this post is for you.

What were we trying to do that made us lose our way? 

We were trying to use a Jackson `ObjectMapper` provided to us by another library. This instantly took us off the path in the [Quarkus documentation](https://quarkus.io/guides/rest-json#jackson), and although it does briefly mention what we _should_ do, we didn't actually know how to do it...

If you don't need to stray from the path included in the [documentation](https://quarkus.io/guides/rest-json#jackson), then what it says is short, sweet and most importantly works. The code below is from their documentation:

```java
@Singleton
public class RegisterCustomModuleCustomizer implements ObjectMapperCustomizer {

    public void customize(ObjectMapper mapper) {
        mapper.registerModule(new CustomModule());
    }
}
```

This takes the `ObjectMapper` that Quarkus creates and applies changes that your application defines.

If instead, you want to provide your own `ObjectMapper` or leverage one from an external library, then everything below will aid you.

As the code you need to achieve this is short, I'll just cut to the chase and show you:

```java
public class ObjectMapperConfiguration {

  @Singleton
  ObjectMapper objectMapper(Instance<ObjectMapperCustomizer> customizers) {
    // Your own `ObjectMapper` or one provided by another library
    ObjectMapper mapper = CustomObjectMapper.get();
    // Apply customizations (includes customizations from Quarkus)
    for (ObjectMapperCustomizer customizer : customizers) {
      customizer.customize(mapper);
    }
    return mapper;
  }
}
```

I'll keep the explanation short and restrict it to bullet points:

- `@Singleton` defines an `ObjectMapper` instance that can be used by the rest of the application. You want to use `@Singleton` here over something like `@ApplicationScoped`, or you will run into client proxy issues.

- `Instance<ObjectMapperCustomizer>` allows all instances of `ObjectMapperCustomizer` to be injected into this function. This is similar to writing `List<ObjectMapperCustomizer>` if you come from the Spring world.

- All the instances of `ObjectMapperCustomizer` are then looped over to apply their customizations. This is included in the [Jackson Quarkus documentation](https://quarkus.io/guides/rest-json#jackson):

    > Users can even provide their own `ObjectMapper` bean if they so choose. If this is done, it is very important to manually inject and apply all `io.quarkus.jackson.ObjectMapperCustomizer` beans in the CDI producer that produces `ObjectMapper`. Failure to do so will prevent Jackson specific customizations provided by various extensions from being applied.

- Finally return the `ObjectMapper` which is ready and raring to go.

You should now know how to customize an `ObjectMapper`, whether you stick to applying customizations to Quarkus' `ObjectMapper`, defining your own or leveraging one provided by another library. All the code should be in this post.

----

If you enjoyed this post or found it helpful (or both) then please feel free to follow me on Twitter at [@LankyDanDev](https://twitter.com/LankyDanDev) and remember to share with anyone else who might find this useful!