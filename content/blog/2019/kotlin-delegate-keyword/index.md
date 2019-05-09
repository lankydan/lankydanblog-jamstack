---
title: Class delegation in Kotlin
date: "2019-05-09"
published: true
tags: [kotlin]
cover_image: ./kotlin-horizon.png
---

> In software engineering, the delegation pattern is an object-oriented design pattern that allows object composition to achieve the same code reuse as inheritance.

Yes, that is a textbook copy and paste from Wikipedia 😬. I went for that quote as an opening as it is a concise description of the [Delegation Pattern](https://en.wikipedia.org/wiki/Delegation_pattern). Favouring composition over inheritance is something that is recited to almost every developer working with an Object Oriented language like Java and Kotlin. Using this pattern allows you to keep on the good side of the inheritance hating developers while still secretly writing code that is implementing an interface.

Ok, I can see you twitching (not really 🙄). You want to know where Kotlin comes into play 🤔.

Kotlin makes following the Delegation Pattern easier by providing the `by` keyword. Using this keyword in your code allows you to implement (__not__ a class) an interface while delegating all of its functions to the _delegate_ that `by` has specified. All of the interface functions will then be satisfied without you needing to provide a single implementation yourself in your new class. One way to think about it is that the _delegate_ basically becomes a pseudo abstract class.

You now can pick and choose which interface functions you want to provide your own implementation for. Any that you don't provide are delegated down to the _delegate_. This is where the power comes in.

I think it is about time I showed you an example. Below is some code used in [Corda](https://github.com/corda/corda) (written entirely in Kotlin and is actually mentioned on the [Kotlin homepage](https://kotlinlang.org/) 👏👏). This is also the first time I saw `by` being used:

```kotlin
class RestrictedEntityManager(private val delegate: EntityManager) : EntityManager by delegate {

  override fun close() {
    throw UnsupportedOperationException("This method cannot be called via ServiceHub.withEntityManager.")
  }

  override fun clear() {
    throw UnsupportedOperationException("This method cannot be called via ServiceHub.withEntityManager.")
  }
}
```

The above class does everything I was just talking about. So let's take a closer look. `RestrictedEntityManager` wants to implement `EntityManager`. To do so, it uses the implementations provided by the `delegate` property.

Note, the `by` keyword's use here. To me, this says, `EntityManager` is implemented `by` the `delegate` property.

As the name `RestrictedEntityManager` suggests, this class wants to restrict some of the `EntityManager`'s functions. Overrides for `close` and `clear` are supplied and used instead of the versions provided by `delegate`.

This leaves you with a new class, `RestrictedEntityManager` that implements every function in the `EntityManager` interface (51 functions if I counted correctly 😳😵) while only writing 2 yourself. Not only does this allow you to be lazier, it is actually clearer and only relies on interfaces rather than concrete classes.

A piece of information from the [Kotlin docs](https://kotlinlang.org/docs/reference/delegation.html#overriding-a-member-of-an-interface-implemented-by-delegation) on this subject is rather important.

> Note, however, that members overridden in this way do not get called from the members of the delegate object, which can only access its own implementations of the interface members

I said that the _delegate_ was like an abstract class earlier. The statement above disproves that slightly, since the implementations you provide will not be used by the _delegate_ at all. But, I still think the comparison is a nice way to think about it, you just need to remember this fact to prevent a mistake in the future.

Before I close this post, I want to compare the code above to a Java version. This will allow you to see how Kotlin provides you with tools to improve your code:

```java
public class RestrictedEntityManager implements EntityManager {

  private EntityManager delegate;

  public RestrictedEntityManager(EntityManager delegate) {
    this.delegate = delegate;
  }

  @Override
  public void close() {
    throw new UnsupportedOperationException("This method cannot be called via ServiceHub.withEntityManager.");
  }

  @Override
  public void clear() {
    throw new UnsupportedOperationException("This method cannot be called via ServiceHub.withEntityManager.");
  }

  @Override
  public void persist(Object entity) {
    delegate.persist(entity);
  }

  @Override
  public <T> T merge(T entity) {
    return delegate.merge(entity);
  }

  // and another 47 functions/methods 😰😰😱
}
```

The inclusion of that code comment on the last line should be enough to convince you of the elegance of the Kotlin solution. Just for clarity, all the missing methods are just delegating to the `delegate` property. If you did make changes to some of the functions and did not order them nicely, you might find it hard to notice what you did. The Kotlin version on the other hand only includes the functions that have been altered and delegates the others by default.

To wrap up, this short post has taken a look at the `by` keyword provided by Kotlin and how it assists you in leveraging the Delegation Pattern. Helping you take one more step on your path to becoming a super developer. Just put down that Java ☕🤮 thing you are holding on to dearly and grab on to Kotlin with two hands 👌👏👏. 

Just to protect myself. I have nothing against Java. Please don't come and kill me! 😨😨

If you found this post helpful, you can follow me on Twitter at [@LankyDanDev](https://twitter.com/LankyDanDev) to keep up with my new posts.