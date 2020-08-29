---
title: Global exception handling with @ControllerAdvice
slug: global-exception-handling-with-controlleradvice
date: "2017-09-12"
published: true
tags: [spring, spring boot, java, spring web, controlleradvice, exception handling, spring hateoas, hateoas]
include_date_in_url: true
github_url: https://github.com/lankydan/spring-boot-hateoas
cover_image: blog-card.png
---

`@ControllerAdvice` is a annotation provided by Spring allowing you to write global code that can be applied to a wide range of controllers, varying from all controllers to a chosen package or even a specific annotation. In this brief tutorial we will focus on handling exceptions using `@ControllerAdvice` and `@ExceptionHandler` (`@InitBinder` and `@ModalAttribute` can also be used with `@ControllerAdvice`).

I will be making use of the `VndErrors` class in this post and therefore the required dependencies will reflect that. `spring-boot-starter-hateoas` is included to allow `VndErrors` to be used, if you do not wish to use this class `spring-boot-starter-web` will be sufficient and will still provide access to everything else used in this post.

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-hateoas</artifactId>
</dependency>
```

By default `@ControllerAdvice` will apply to all classes that use the `@Controller` annotation (which extends to classes using `@RestController`). If you wanted this to be more specific there are a few properties provided that allow this.

To reduce the applicable classes down by package you simply need to add the name of the package to the annotation. When a package is chosen it will be enabled for classes inside that package as well as sub-packages. Multiple packages can also be chosen by following the same process, but using an array instead of a singular string (all properties in `@ControllerAdvice` can be singular or multiple).

```java
@ControllerAdvice("my.chosen.package")
@ControllerAdvice(value = "my.chosen.package")
@ControllerAdvice(basePackages = "my.chosen.package")
```

Another way to specify a package is via the `basePackageClasses` property which will enable `@ControllerAdvice` to all controllers inside the package that the class (or interface) lives in.

```java
@ControllerAdvice(basePackageClasses = MyClass.class)
```

To apply to specific classes use `assignableTypes`.

```java
@ControllerAdvice(assignableTypes = MyController.class)
```

And finally if you want to apply it to controllers with certain annotations. The below snippet would only assist controllers annotated with `@RestController` (which it covers by default) but will not include `@Controller` annotated classes.

```java
@ControllerAdvice(annotations = RestController.class)
```

`@ExceptionHandler` allows you to define a method that, as the name suggests, handle exceptions. If you weren't using `@ControllerAdvice` the code for handling these exceptions would be in the controllers themselves, which could add quite a bit of duplication and clutter to the class and leading to it not being as "clean". You could move the `@ExceptionHandler` methods into a base class that the controller extends to separate the code. This method is not perfect and comes with the issue that every controller where you need this global exception handling will now need to extend the base controller. Therefore when you create a new controller and forget to extend this base class, you are now no longer handling some exceptions and might get bitten in the butt later on. Using `@ControllerAdvice` along with `@ExceptionHandler` prevents this by providing global (and more specific) error handling so you don't need to remember to implement them yourself or extend another class every time.

Below is a basic example of a class annotated with `@ControllerAdvice`.

```java
@ControllerAdvice
@RequestMapping(produces = "application/vnd.error+json")
public class PersonControllerAdvice {

  @ExceptionHandler(PersonNotFoundException.class)
  public ResponseEntity<VndErrors> notFoundException(final PersonNotFoundException e) {
    return error(e, HttpStatus.NOT_FOUND, e.getId().toString());
  }

  private ResponseEntity<VndErrors> error(
      final Exception exception, final HttpStatus httpStatus, final String logRef) {
    final String message =
        Optional.of(exception.getMessage()).orElse(exception.getClass().getSimpleName());
    return new ResponseEntity<>(new VndErrors(logRef, message), httpStatus);
  }

  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<VndErrors> assertionException(final IllegalArgumentException e) {
    return error(e, HttpStatus.NOT_FOUND, e.getLocalizedMessage());
  }
}
```

This class provides `@ExceptionHandler` methods globally to all controllers, as (which you can't see from this code alone) there are multiple controllers that throw `PersonNotFoundException` which need handling. The `RequestMapping` annotation here is used to set the content type that is returned by the `ResponseEntity`, these could be added to the methods themselves instead if different types needed to be returned. Each instance of `@ExceptionHandler` marks an exception which it is in charge of dealing with. The methods in this example simply catch the exception and take it's error message and combine it with an appropriate response code.

Without this code, when `PersonNotFoundException` is thrown the following output is produced (along with a stacktrace in your log).

```json
{
  "timestamp": "2017-09-12T13:33:40.136+0000",
  "status": 500,
  "error": "Internal Server Error",
  "message": "Person could not be found with id: 1",
  "path": "/people/1"
}
```

With the addition of `@ControllerAdvice` and `@ExceptionHandler` a different response is returned (stack trace not found anymore).

```json
[
  {
    "logref": "1",
    "message": "Person could not be found with id: 1",
    "links": []
  }
]
```

In this response we have actually controlled what is returned to the client. Although the first one contains more information, some of it is not useful to the client and could technically be incorrect. Yes an "Internal Server Error" occurred, but really a person did not exist with the passed in id and the response could suggest something blew up.

One last thing before I wrap up this post. If you define multiple `@ExceptionHandler` for the same exception you need to be on the lookout. When defined in the same class, Spring is kind enough to throw an exception and fail on startup. But when they appear in different classes, say two `@ControllerAdvice` classes both had a handler for the `PersonNotFoundException`, the application would start but will use the first handler it finds. This could cause unexpected behaviour if you are not aware.

In conclusion we have looked at how to use the `@ControllerAdvice` and `@ExceptionHandler` annotations to create global error handling. Allowing you to keep your logic in a central place, thus removing possible duplication and when applied globally removes the need to worry about whether more general exceptions are being handled or not.

The code used in this post can be found on my [GitHub](https://github.com/lankydan/spring-boot-hateoas).

If you found this post helpful, please share it and if you want to keep up with my latest posts then you can follow me on Twitter at [@LankyDanDev](https://twitter.com/LankyDanDev).