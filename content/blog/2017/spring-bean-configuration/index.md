---
title: Playing around with Spring Bean Configuration
date: "2017-07-30"
published: true
tags: [spring, java, beginners]
include_date_in_url: true
github_url: https://github.com/lankydan/spring-bean-config
cover_image: blog-card.png
---

In this tutorial we will have a look at something more basic on the Spring spectrum, but as most things can sometimes be forgotten and is something that personally I have not looked at properly since switching from XML to Java configuration. The creation of beans is pretty important to the use of Spring (probably more like very important) allowing us to have Java classes that live within the application context that can be used within other beans/classes without constantly creating new instances every time we need to use one of their methods.

Let's start with a simple example, a bean which does not require the use of any other beans (dependencies) and therefore does not require the use of dependency injection which we will look at later.

```java
@Component
public class MyBeanImpl implements MyBean {

  @Override
  public void someMethod() {
    System.out.println(getClass() + ".someMethod()");
  }
}
```

Normally when we create a bean we define it by an interface with the bean being a concrete implementation of it. This provides the benefit of being able to swap out implementations just by changing the configuration file (assuming the other implementations were already created). If the bean was defined by an implementation instead of an interface, when you decide you want to switch out the implementation to another you will need to find all of its uses (which could exist in a lot of separate files) and either make you annoyed or you colleagues when the come to code review and see way more files to look at than required.

Now we have a bit of context we can have a look at how to define some beans.

```java
@Configuration
public class AppConfig {

  @Bean
  public MyBean myBean() {
    return new MyBeanImpl();
  }

  @Bean({"myOtherBean", "beanNameTwo"})
  public MyBean myOtherBeanWithDifferentName() {
    return new MyOtherBeanImpl();
  }
}
```

Here we have a `@Configuration` class that we can use to create and use beans within the application context. I have chucked in a few things into this example so let's go through them one by one. `@Bean` is used to mark a method as one that creates a bean and Spring will then add it to the context for us. The return type of the method defines the type of bean that is created, so both of the beans created in this example will be referred to by the type `MyBean` rather than their implementations. The method name will determine the name of the created bean or a name/names can be passed into the `@Bean` annotation. If done via the annotation, simply add the name of the bean or use an array to provide multiple aliases to the bean.

The another thing to notice is that there are two beans using the `MyBean` interface. Because of this when these beans are injected they need to referred to by their correct names so that they can be distinguished correctly (this is something that we will have a look at later).

The final thing worth mentioning, which goes all the way back to the `@Component` annotation on `MyBeanImpl`, is that when the `@Component` annotation is added to a class it will get auto-detected and created by Spring allowing it to be excluded from configuration files. So if we wanted to we could simply delete the configuration file that was defined above and the application will still work correctly. Although to make it work in the same fashion we will need to provide names to the beans by simply adding a string into the `@Component` annotation, otherwise the bean will be named after the class the annotation is placed on. So if `@Component` is added to `MyBeanImpl` the created bean will be named "myBeanImpl" whereas if it is annotated with `@Component("myBean")` it will be named "myBean" instead.

Now the beans that we created in the above example were very simple and it's quite unlikely that many of your beans will look like that. The reason they won't look like that (if you haven't figured it out already and complained at how trivial that example was) is that it makes no use of any external classes, so either the class doesn't do much or its some gigantic piece of code that should be split out into smaller classes. To use external classes in your code you could create new instances yourself or you could inject a bean in and not need to worry about it's creation, this is what we will look at below.

```java
@Component
public class MyBeanWithInjectionImpl implements MyBean {

  private final MyBean myBean;

  public MyBeanWithInjectionImpl(final MyBean myBean) {
    this.myBean = myBean;
  }

  @Override
  public void someMethod() {
    System.out.print("from injection: ");
    myBean.someMethod();
  }
}
```

```java
@Configuration
public class AppWithInjectionConfig {

  @Autowired private MyBean myOtherBean;

  @Bean
  public MyBean myBeanWithInjection(final MyBean myBean) {
    return new MyBeanWithInjectionImpl(myBean);
  }

  @Bean
  public MyBean myOtherBeanWithInjection(@Qualifier("myOtherBean") final MyBean myBean) {
    return new MyBeanWithInjectionImpl(myBean);
  }

  @Bean
  public MyBean myBeanWithAutowiredDependency() {
    return new MyBeanWithInjectionImpl(myOtherBean);
  }

  @Bean
  public MyBean myBeanWithMethodInjectedDependency() {
    return new MyBeanWithInjectionImpl(myBeanWithAutowiredDependency());
  }
}
```

Here we will look at how to create beans that require dependencies to be injected in. If you look at the first method `myBeanWithInjection` it takes in `myBean` as one of it's parameters and passes it into the constructor of `MyBeanWithInjection`. By specifying `myBean` in the method parameter Spring will search for a bean of a matching type if only one exists or by ID if there are multiple versions. The retrieved bean is then injected into the bean that is being created. The following methods in this example demonstrate similar ways of injecting dependencies as they all use constructor injection but retrieve the injected bean in different fashions. `myOtherBeanWithInjection` uses `@Qualifier` to specify the name of the bean that should be retrieved from the context, allowing the parameter to have a different name which might be useful if the bean name is really long and you don't want to write it out a few times and `myBeanWithAutowiredDependency` uses the `@Autowired` annotation to retrieve `myOtherBean` from the context. Another way of injecting a bean is by calling another method that is annotated with `@Bean` from inside the constructor or method of the bean that you wish to create. Whether you prefer this way of retrieving a bean or not is up to you, but it does come with the restriction of only working on beans that have been defined from within the same configuration file.

There is also another way that should be mentioned, rather than injecting dependencies via constructors, dependencies can be injected into a bean directly by using the `@Autowired` annotation onto the property that needs to be retrieved. This would look like the below.

```java
@Component
public class MyBeanWithInjectionImpl implements MyBean {

  @Autowired
  private MyBean myBean;

  @Override
  public void someMethod() {
    System.out.print("from injection: ");
    myBean.someMethod();
  }
}
```

Again this isn't something I am going to lecture you upon which way is better (constructor injection vs directly injecting using `@Autowired`) as they both come with advantages and disadvantages. The advantage of using `@Autowired`, especially if auto-detection is enabled, is that it requires less code to be written and therefore probably a bit faster to get up and running. Personally in a lot of my own code that I write for use in tutorials I just use `@Autowired` as I am not doing anything particularly complex and just want it to work quickly. The disadvantage of using `@Autowired` compared to constructor injection is that it hides the configuration from the developer due to it pulling in dependencies that are only mentioned from within it's class, making it harder for us to to see what dependencies are being used in beans when browsing through configuration files. When using constructor injection it is clear what is needed and the bean cannot be created until everything that is required has been retrieved and passed into the constructor. I am sure there are more upsides and downsides to either way but let's carry on this this post, if you are still intrigued and need to know more there are plenty of sources you can find where people discuss (or argue) about which way is better.

Following on from constructor injection let's look at the similar process of passing values into beans. These values are normally taken from property files but you could hard code the values in yourself. The configuration required for passing values to a bean follows almost the exact same format as that of injecting dependencies and therefore we can browse through this example nice and quickly.

```java
public class MyBeanWithPropertiesImpl implements MyBean {

  private final String propertyOne;
  private final String propertyTwo;

  public MyBeanWithPropertiesImpl(final String propertyOne, final String propertyTwo) {
        this.propertyOne = propertyOne;
        this.propertyTwo = propertyTwo;
  }

  @Override
  public void someMethod() {
    System.out.println(
        getClass()
          + ".someMethod() with properties: propertyOne = "
          + propertyOne
          + ", propertyTwo = "
          + propertyTwo
    );
  }  
}
```

```java
@Configuration
public class AppWithPropertyInjectionConfig {

  @Value("${propertyOne}")
  private String propertyOne;

  @Value("${propertyTwo}")
  private String propertyTwo;

  @Bean
  public MyBean myBeanWithProperties() {
    return new MyBeanWithPropertiesImpl(propertyOne, propertyTwo);
  }

  @Bean
  public MyBean myOtherBeanWithProperties(
    @Value("${propertyOne}") final String propertyOne,
    @Value("${propertyTwo}") final String propertyTwo
  ) {
    return new MyBeanWithPropertiesImpl(propertyOne, propertyTwo);
  }

  @Bean
  public MyBean myBeanWithMethodInjectedProperties() {
    return new MyBeanWithInjectionImpl(myOtherBeanWithProperties(null, null));
  }
}
```

The first thing we should look at is the `@Value` annotation which reads a value from a property file. Currently these values are being read from `application.properties`. For more information on the `@Value` annotation have a look at [A Quick Guide to Spring @Value](http://www.baeldung.com/spring-value-annotation). As mentioned slightly earlier, the configuration for using properties looks almost exactly the same as injecting dependencies but instead of referencing a bean the `@Value` annotation is used to retrieve and use the value it refers to. As shown by the example above you could either store the property values in private variables for use in the who configuration file or pass them into the method directly (`@Value` annotation still required). The last method in the example shows that you can also can call a method that creates a bean (remember this will retrieve the bean) even if the method that you are calling requires properties to be passed in. It looks a bit nasty passing in some `null` values but everything will work out just fine and the properties will still be used correctly.

As with using `@Autowired` from inside a bean to directly inject a dependency, `@Value` can be used to do the same thing with properties. This comes with the same sort of advantages and disadvantages as `@Autowired`. Just for reference below is what the code would now look like.

```java
@Component
public class MyBeanWithPropertiesImpl implements MyBean {

  @Value("${propertyOne}")
  private String propertyOne;

  @Value("${propertyTwo}")
  private String propertyTwo;

  @Override
  public void someMethod() {
    System.out.println(
        getClass()
          + ".someMethod() with properties: propertyOne = "
          + propertyOne
          + ", propertyTwo = "
          + propertyTwo
    );
  }
}
```

The final thing worth mentioning about this last set of examples (passing in properties) is that the use `@Component` depends on whether you are passing in values in via a constructor or use `@Value` in the class directly. `@Component` marks a class available for auto-detection and by including the constructor Spring expects the bean to have other beans (of type String!) to be passed in, causing it to fail and make you sad. Therefore if using the constructor you will need to remove the annotation, but if you use `@Value` inside the class then feel free to use `@Component` and make use of the auto-detection that is available (by not including the creation of the bean in any configuration files).

The last little thing that I want to mention in this post is that even though in all the examples shown the beans have been referred to by their interfaces, the use of an interface is not required and a bean can be created and used without one. I won't create an example for this as I am sure your imagination is strong enough to view this in you head. So if you are just writing some quick code it is probably fine just to create a class, add `@Component` to it and carry on, but if your working with anyone else (especially at work) I would stick to using interfaces with your beans.

This section below doesn't really contain much extra content, it is simply just the `@SpringBootApplication` that ties everything together so you can see proof that the beans have been created and can be used correctly. That being said, there is a little bit of information that can be extracted. `@Resource` can be used instead of `@Autowired` + `@Qualifier` when retrieving a bean of a specific name and `@ComponentScan` has been added to scan for beans/configuration files due to them not existing as children of the package containing the `@SpringBootApplication`.

```java
@SpringBootApplication
@ComponentScan(basePackages = "com.lankydan")
public class Application implements CommandLineRunner {

  @Autowired
  private MyBean myBean;

  @Resource(name = "myOtherBean")
  private MyBean myOtherBeanWithWrongName;

  @Autowired
  private MyBeanWithoutInterface myBeanWithoutInterface;

  @Autowired
  private MyBean myBeanWithMethodInjectedDependency;

  @Autowired
  private MyBean myBeanWithMethodInjectedProperties;

  public static void main(final String args[]) {
    SpringApplication.run(Application.class, args);
  }

  @Override
  public void run(final String... s) {
    myBean.someMethod();
    myOtherBeanWithWrongName.someMethod();
    myBeanWithoutInterface.someMethod();
    myBeanWithMethodInjectedDependency.someMethod();
    myBeanWithMethodInjectedProperties.someMethod();
  }
}
```

Which when ran produces the output (using the beans from the configuration files we have been through).

```
class lankydan.tutorial.beans.MyBeanImpl.someMethod()
class lankydan.tutorial.beans.MyOtherBeanImpl.someMethod()
class lankydan.tutorial.beans.MyBeanWithoutInterface.someMethod()
from injection: from injection: class lankydan.tutorial.beans.MyOtherBeanImpl.someMethod()
from injection: class lankydan.tutorial.beans.MyBeanWithPropertiesImpl.someMethod() 
        with properties: propertyOne = "I am property one", propertyTwo = "I am not the property your looking for"
```

In conclusion we have looked at creating beans in Spring, which can be done in a variety of ways all leading to the same outcome at the end of the day. Different methods have advantages and disadvantages, some were touched on in this post, although which method you use is up to you. Hopefully I have provided a decent foundation so that you can move onto using other features of Spring without needing to double check every now and then when you come across a bean that has been defined in a slightly different way than your used to.

The code for this post can be found on my [GitHub](https://github.com/lankydan/spring-bean-config).

If you found this post helpful, please share it and if you want to keep up with my latest posts then you can follow me on Twitter at [@LankyDanDev](https://twitter.com/LankyDanDev).