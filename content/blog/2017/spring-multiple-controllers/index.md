---
title: Request Mapping with multiple Rest Controllers
date: "2017-04-08"
published: true
tags: [java, spring, spring boot, spring web]
github_url: https://github.com/lankydan/spring-boot-rest-controllers-tutorial
include_date_in_url: true
---

In this post we will look at a possible problem when multiple rest controllers are defined onto the same path and how to use multiple rest controllers within your application. I used Spring Boot to write this application.

So what happens when you have two rest controller defined onto the same path? If you don't have any overlapping request mappings other than the code being slightly confusing, nothing will actually go wrong and you can successfully send requests to the methods inside each controller. But if you have the same mapping defined in each one, then you are going to run into a problem.

In the code below there are two different controllers where both are mapped to the same path and also each contain a mapping to the same location.

- PersonRestController

```java
@RestController
public class PersonRestController {

  @RequestMapping("/get")
  public PersonDTO getFromPersonController() {
    return new PersonDTO("Joe", "Blogs", new Date(), "Programmer", BigDecimal.ZERO);
  }

  @RequestMapping("/getPerson")
  public PersonDTO getPerson() {
    return new PersonDTO("Joe", "Blogs", new Date(), "Programmer", BigDecimal.ZERO);
  }
}
```

- UserRestController

```java
@RestController
public class UserRestController {

  @RequestMapping("/get")
  public UserDTO getFromUserController() {
    return new UserDTO("joeblogs", "Joe Blogs", "joeblogs@gmail.co.uk");
  }

  @RequestMapping("/getUser")
  public UserDTO getUser() {
    return new UserDTO("joeblogs", "Joe Blogs", "joeblogs@gmail.co.uk");
  }
}
```

If you were to start up you application now the following stack trace would appear in your console.

<pre class="language-text">
org.springframework.beans.factory.BeanCreationException: Error creating bean with name 'requestMappingHandlerMapping' defined in class path resource [org/springframework/boot/autoconfigure/web/WebMvcAutoConfiguration$EnableWebMvcConfiguration.class]: 
Invocation of init method failed; nested exception is java.lang.IllegalStateException: <span style="color:#ff0000;">Ambiguous mapping. Cannot map 'userRestController' method</span>
public lankydan.tutorial.springboot.dto.UserDTO lankydan.tutorial.springboot.controller.<span style="color:#ff0000;">UserRestController.getFromUserController()</span>
<span style="color:#ff0000;">to {[/get]}: There is already 'personRestController' bean method</span>
public lankydan.tutorial.springboot.dto.PersonDTO lankydan.tutorial.springboot.controller.<span style="color:#ff0000;">PersonRestController.getFromPersonController() mapped</span>.
 at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.initializeBean(AbstractAutowireCapableBeanFactory.java:1628) ~[spring-beans-4.3.6.RELEASE.jar:4.3.6.RELEASE]
 at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.doCreateBean(AbstractAutowireCapableBeanFactory.java:555) ~[spring-beans-4.3.6.RELEASE.jar:4.3.6.RELEASE]
 at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.createBean(AbstractAutowireCapableBeanFactory.java:483) ~[spring-beans-4.3.6.RELEASE.jar:4.3.6.RELEASE]
 at org.springframework.beans.factory.support.AbstractBeanFactory$1.getObject(AbstractBeanFactory.java:306) ~[spring-beans-4.3.6.RELEASE.jar:4.3.6.RELEASE]
 at org.springframework.beans.factory.support.DefaultSingletonBeanRegistry.getSingleton(DefaultSingletonBeanRegistry.java:230) ~[spring-beans-4.3.6.RELEASE.jar:4.3.6.RELEASE]
 at org.springframework.beans.factory.support.AbstractBeanFactory.doGetBean(AbstractBeanFactory.java:302) ~[spring-beans-4.3.6.RELEASE.jar:4.3.6.RELEASE]
 at org.springframework.beans.factory.support.AbstractBeanFactory.getBean(AbstractBeanFactory.java:197) ~[spring-beans-4.3.6.RELEASE.jar:4.3.6.RELEASE]
 at org.springframework.beans.factory.support.DefaultListableBeanFactory.preInstantiateSingletons(DefaultListableBeanFactory.java:761) ~[spring-beans-4.3.6.RELEASE.jar:4.3.6.RELEASE]
 at org.springframework.context.support.AbstractApplicationContext.finishBeanFactoryInitialization(AbstractApplicationContext.java:866) ~[spring-context-4.3.6.RELEASE.jar:4.3.6.RELEASE]
 at org.springframework.context.support.AbstractApplicationContext.refresh(AbstractApplicationContext.java:542) ~[spring-context-4.3.6.RELEASE.jar:4.3.6.RELEASE]
 at org.springframework.boot.context.embedded.EmbeddedWebApplicationContext.refresh(EmbeddedWebApplicationContext.java:122) ~[spring-boot-1.5.1.RELEASE.jar:1.5.1.RELEASE]
 at org.springframework.boot.SpringApplication.refresh(SpringApplication.java:737) [spring-boot-1.5.1.RELEASE.jar:1.5.1.RELEASE]
 at org.springframework.boot.SpringApplication.refreshContext(SpringApplication.java:370) [spring-boot-1.5.1.RELEASE.jar:1.5.1.RELEASE]
 at org.springframework.boot.SpringApplication.run(SpringApplication.java:314) [spring-boot-1.5.1.RELEASE.jar:1.5.1.RELEASE]
 at org.springframework.boot.SpringApplication.run(SpringApplication.java:1162) [spring-boot-1.5.1.RELEASE.jar:1.5.1.RELEASE]
 at org.springframework.boot.SpringApplication.run(SpringApplication.java:1151) [spring-boot-1.5.1.RELEASE.jar:1.5.1.RELEASE]
 at lankydan.tutorial.springboot.Application.main(Application.java:10) [classes/:na]
Caused by: java.lang.IllegalStateException: Ambiguous mapping. Cannot map 'userRestController' method
</pre>

From looking at this stack trace it paints quite a clear picture at what has gone wrong.

Starting from the top

```
Ambiguous mapping. Cannot map 'userRestController' method
```

telling us that there must be at least one other place that has the same mapping defined.

Going down a line

```
UserRestController.getFromUserController() to {[/get]}: There is already 'personRestController' bean method
```

Makes it even clearer. `UserRestController.getFromUserController()` is mapped to `/get` but there is already one on the `PersonRestController`.

And just to be sure

```
PersonRestController.getFromPersonController() mapped
```

Indicating which method in the `PersonRestController` has already taken the `/get` mapping.

This can be tested by commenting out the `getFromUserController` method in `UserRestController`, restarting the application and sending the request via postman.

The results will be

```json
{
 "firstName": "Joe",
 "secondName": "Blogs",
 "dateOfBirth": "07/04/2017",
 "profession": "Programmer",
 "salary": 0
}
```

which is the JSON of the `PersonDTO` that was correctly returned from the get method in the `PersonRestController`, which is now the only request mapping trying to point to `/get`.

To double check that the other request mappings can be accessed we can send a request to `/getUser` and `/getPerson` which will both return the expected JSON.

A possible fix to this is to change the request mapping path of one of the controller methods. This will quickly fix this problem but suggests that these methods should be not only separated by class but also by their request mappings. Which leads onto a better solutions.

One solution is to manually append a&nbsp;base mapping to each `@RequestMapping` annotation.

This would be defined by

```java
@RequestMapping("/person/get")
public PersonDTO getFromPersonController() {
  return new PersonDTO("Joe", "Blogs", new Date(), "Programmer", BigDecimal.ZERO);
}
```

and

```java
@RequestMapping("/user/get")
public UserDTO getFromUserController() {
  return new UserDTO("joeblogs", "Joe Blogs", "joeblogs@gmail.co.uk");
}
```

This would fix the immediate problem but will not prevent further errors from occurring in the future unless you always remember to append the domain&nbsp;on each `@RequestMapping`

For example if we only altered the code above and not the other mappings in the controllers the paths that they would accept from would be

```
localhost:8080/person/get
localhost:8080/getPerson
```

and

```
localhost:8080/user/get
localhost:8080/getUser
```

In this scenario the correct solution would be to change the path that the controllers accept requests from. To do so we need to add the `@RequestMapping` annotation to each class in a similar way that it has already been used on the methods.

```java
@RestController
@RequestMapping("/person")
public class PersonRestController {

  @RequestMapping("/get")
  public PersonDTO getFromPersonController() {
    return new PersonDTO("Joe", "Blogs", new Date(), "Programmer", BigDecimal.ZERO);
  }

  @RequestMapping("/getPerson")
  public PersonDTO getPerson() {
    return new PersonDTO("Joe", "Blogs", new Date(), "Programmer", BigDecimal.ZERO);
  }
}
```

and

```java
@RestController
@RequestMapping("/user")
public class UserRestController {

  @RequestMapping("/get")
  public UserDTO getFromUserController() {
    return new UserDTO("joeblogs", "Joe Blogs", "joeblogs@gmail.co.uk");
  }

  @RequestMapping("/getUser")
  public UserDTO getUser() {
    return new UserDTO("joeblogs", "Joe Blogs", "joeblogs@gmail.co.uk");
  }
}
```

This is more likely to reduce conflicts of mappings as each class will have its own specific base mapping and then each method's path will be built upon it.

Now the `PersonRestController` accepts requests from

```
localhost:8080/person/...
```

for example

```
localhost:8080/person/get
localhost:8080/person/getPerson
```

The `UserRestController` accepts from

```
localhost:8080/user/...
```

for example

```
localhost:8080/user/get
localhost:8080/user/getUser
```

Not only does it prevent the conflicts but it is much clearer from looking at the request what controller it will eventually go to, which in the future could help with debugging.

After reading this post you should know how to set the path of a rest controller and understand the consequences if you don't. As well as some reasons for setting the path via the controller to make the code tidier and less likely to run into issues in the future.

The code for this post can be found on my [Github](https://github.com/lankydan/spring-boot-rest-controllers-tutorial).