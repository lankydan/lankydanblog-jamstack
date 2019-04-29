---
title: Default and private methods in Interfaces
date: "2017-08-13"
published: true
tags: [java, java 8, java 9]
canonical_url: https://lankydanblog.com/2017/08/13/default-and-private-methods-in-interfaces/
cover_image: ./coffee.jpg
include_date_in_url: true
---

In this tutorial we will look at default and private methods within interfaces. Default methods were added in Java 8 allowing methods to be added to an interface that comes with a default implementation that could be used, overridden or ignored without causing issues to existing classes that have implemented an interface. Private methods were missing when default methods were added, preventing code being split out into smaller methods within an interface. This is something that was a bit off putting to me as if you had a default method that became a bit long there was no way to tidy it up. So now that both default and private methods can exist within an interface we can write methods like we are used to, although if you haven't used default methods yet then you will first need to get past the fact that there is now actual code living in an interface.

In terms of adding default and private methods to an interface, its really simple. To add a default method just add the keyword `default` to the method definition and I'm not even going to tell you how to add a private method as I don't wish to insult you!

Being it's so simple lets just jump straight into some code examples.

```java
public interface MyInterface {

  default void defaultMethod() {
    privateMethod("Hello from the default method!");
  }

  private void privateMethod(final String string) {
    System.out.println(string);
  }

  void normalMethod();
}
```

```java
public class MyClassWithDefaultMethod implements MyInterface {

  @Override
  public void normalMethod() {
    System.out.println("Hello from the implemented method!");
  }
}
```

As you can see from the basic snippets above a default method is defined on the interface which in turn calls a private method. As the name suggests it is a default method and therefore due to `MyClassWithDefaultMethod` not providing an implementation for `defaultMethod` it will carry on and use what is defined on the interface. So if `defaultMethod` and `normalMethod` were called they would produce the following output.

```
Hello from the default method!
Hello from the implemented method!
```

There is really not much to it. If you wanted to provide your own implementation of the default method within the class then as you would with a normal interface method, just add a method with the same name and preferably pop the `@Override` annotation on top of it.

```java
public class MyClassOverrideDefaultMethod implements MyInterface {

  @Override
  public void normalMethod() {
    System.out.println("Hello from the implemented method!");
  }

  @Override
  public void defaultMethod() {
    System.out.println("I have overridden the default method!!");
  }
}
```

Nothing really to say about this code as now it looks like a normal class that has implemented an interface. When ran it will produce the following output rather than what was show previously.

```
I have overridden the default method!!
Hello from the implemented method!
```

Thats the basics of adding default and private methods to interfaces. Below we will look a bit more in depth into default methods as well as why to use them in the first place.

So a class can have multiple interfaces and now an interface can define it's own default methods. What happens if a class implements multiple interfaces which each have the same default method defined? Well not much happens really as it will fail to compile and produce the following error.

```
java: class MyClassWithTwoInterfaces inherits unrelated defaults for defaultMethod() 
from types MyInterface and MyOtherInterface
```

As you can probably figure out, it cannot determine which default method it should actually use so it blows up. To get around this situation we need need to provide an implementation that will override the versions that the interfaces are giving the class which will be used instead and thus removing the ambiguity which resulted in the error.

Moving onto the next point. A class can override a default interface method and call the original method by using `super`, keeping it nicely in line with calling a super method from an extended class. But there is one catch, you need to put the name of the interface before calling `super` this is necessary even if only one interface is added. This makes sense as `super` normally refers to the extended class and as multiple interfaces are allowed restricting it to always being called like this keeps it consistent and without any ambiguity. Below is a code snippet of what this would look like.

```java
public class MyClassWithTwoInterfaces implements MyInterface, MyOtherInterface {

  @Override
  public void normalMethod() {
    // some implementation
  }

  @Override
  public void defaultMethod() {
    MyInterface.super.defaultMethod();
    MyOtherInterface.super.defaultMethod();
  }
}
```

Being able to call `super` on a default interface method also resolves the error the same default method from multiple interfaces. You will still need to override the method itself but you dont need to write much more than that, if one of the original versions satisfies your needs you can call `super` on the implementation you desire and be done with it.

As an interface can extend another interface what happens when both contain a default method of the same name? I'm sure most of you can figure out the answer, but incase you can't it simply takes the implementation from the child interface / the interface furthest down the hierarchy tree.

```java
public interface MyInterface {

  default void defaultMethod() {
    System.out.println("Hello from the parent interface!");
  }
}
```

```java
public interface MyOtherInterface extends MyInterface {

  default void defaultMethod() {
    System.out.println("Hello from the child interface!");
  }
}
```

When a class implements `MyOtherInterface` and calls `defaultMethod` it will print out.

```
Hello from the child interface!
```

As you can see it has called `defaultMethod` from within the child interface `MyOtherInterface`. This keeps it in line with providing an implementation to a default method from within a class, if it is included in the child / implementation then it will use that instead of the original defined on the parent interface.

So why use default methods in the first place? After doing some googling, it seems that they were added to Java 8 as a way of adding methods in preparation for Lambda expressions without breaking code that implemented existing interfaces. So if we had a class that used an interface that was changed, for example code within a 3rd party library, we wouldn't need to worry about any new methods being added to the interface as our existing code will still work and the new method can be ignored until a later date. By using this example I believe it is more important for API / library developers to consider using default methods than it is for those that are writing code within their own codebase where they are in control of everything and can change any classes that have been broken by adding a new interface method.

Below are some code snippets to help make the above point clearer (if it wasn't already).

```java
public class MyClass implements MyOldInterface {

  @Override
  public void doStuff() {
    // does stuff
  }
}
```

```java
public interface MyOldInterface {

  void doStuff();
}
```

So here we have a class that is sitting around nice and happy as it has implemented the method defined on the interface and requires no other work to be done. And then we come along without a care in the world and add a new method to the interface.

```java
public interface MyNewInterface {

  void doStuff();

  void doSomeMore();
}
```

When we try to compile the code it will fail as we have not provided an implementation for `doSomeMore`. Obviously this makes us cry as we need to write some extra code, even if it is some half arsed code just so we can get it to work again. Whereas if the code before was written instead...

```java
public interface MyNewInterface {

  void doStuff();

  default void doSomeMore() {
    // do some more stuff
  }
}
```

We would remain happy as our existing class requireS no extra work and will still compile. When we eventually decide that we need to implement the new method added to the interface then we can do so as normal. Furthermore if the `doSomeMore` method was long enough maybe a private method or two could be used to keep the interface nice and tidy, helping you keep everyone who uses your code happy!

I think that pretty much covers it. In conclusion default methods were added as part of Java 8 with private methods being an addition in java 9. Default methods allow an interface to define an implementation for a method so that when a class implements the interface it does not need to provide it's own version of the method, helping APIs and libraries move forward without always needing to make breaking changes when interfaces require additional methods. Hopefully this post demonstrated their ease of use, although just because they are simple does not mean they should be added all over the place and developers only concerned about their own codebase might never find a need to use them. I almost forgot to mention private methods here, but quite frankly that's because theres not much to say about them and if you noticed while going through this post there is barely any mention of them. Private methods in interfaces are there to make code look nicer and give the option of some code reuse.

If you found this post helpful, please share it and if you want to keep up with my latest posts then you can follow me on Twitter at [@LankyDanDev](https://twitter.com/LankyDanDev).