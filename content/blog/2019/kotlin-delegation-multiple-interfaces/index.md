---
title: Implementing multiple interfaces through delegation
date: "2019-09-04"
published: true
tags: [kotlin]
cover_image: ./title-card.png
---

In Kotlin, a class can implement multiple interfaces. This is common knowledge. A class can also use delegation to implement numerous interfaces where the implementations come from any delegated objects passed into the constructor. For example:

```kotlin
class GeneticExperiment(human: Human, animal: Animal) : Human by human, Animal by animal

interface Human {
  fun eat()
  fun sleep()
  fun poop()
}

interface Animal {
  fun bite()
}
```

This weird class inherits functionality from both the `Human` and `Animal` objects passed into the constructor. Without delegation, any functions on either of the interfaces will need to be written out manually within the class.

An important point to note is the fact that `Human` and `Animal` do not share a common parent interface.

If you do have interfaces that extend from a common interface, then there will be compilation errors due to conflicting implementations from the delegated objects. For example, the code:

```kotlin
class ShapeShifter(human: Human, weightLifter: WeightLifter) : Human by human, WeightLifter by weightLifter

interface Human {
  fun eat()
  fun sleep()
  fun poop()
}

interface WeightLifter : Human {
  fun liftHeavyStuff()
  fun pose()
}
```

Leads to the errors:

```java
Delegation.kt:80:1: error: class 'ShapeShifter' must override public open fun eat(): 
Unit defined in dev.lankydan.ShapeShifter because it inherits many implementations of it
class ShapeShifter(human: Human, weightLifter: WeightLifter) : Human by human, WeightLifter by weightLifter
^
Delegation.kt:80:1: error: class 'ShapeShifter' must override public open fun sleep(): 
Unit defined in dev.lankydan.ShapeShifter because it inherits many implementations of it
class ShapeShifter(human: Human, weightLifter: WeightLifter) : Human by human, WeightLifter by weightLifter
^
Delegation.kt:80:1: error: class 'ShapeShifter' must override public open fun poop(): 
Unit defined in dev.lankydan.ShapeShifter because it inherits many implementations of it
class ShapeShifter(human: Human, weightLifter: WeightLifter) : Human by human, WeightLifter by weightLifter
^
```

As you can see in the errors, the `ShapeShifter` class does not know which delegated implementation to take. The compilation errors must be resolved by explicitly overriding the conflicting functions. By overriding the functions, you can decide which delegated implementation you wish to use, or you can provide a new one altogether. A fixed version of this class could look like:

```kotlin
class ShapeShifter(
  private val human: Human,
  private val weightLifter: WeightLifter
) : Human by human, WeightLifter by weightLifter {
  
  override fun eat() {
    human.eat()
  }

  override fun sleep() {
    weightLifter.sleep()
  }

  override fun poop() {
    println("💩")
  }
}

interface Human {
  fun eat()
  fun sleep()
  fun poop()
}

interface WeightLifter : Human {
  fun liftHeavyStuff()
  fun pose()
}
```

> Only the functions declared in the `Human` interface need to manually overridden

Taking a slight step back from here. A class that implements a child interface and delegates its functionality to the child's parent interface will compile as long as all of the child's functions are implemented. Wording that was difficult. An example should help clarify what I am trying to say:

```kotlin
class ShapeShifter(copied: Human) : WeightLifter, Human by copied {

  override fun liftHeavyStuff() {
    println("🏋️‍♂️")
  }

  override fun pose() {
    println("💪")
  }
}

interface Human {
  fun eat()
  fun sleep()
  fun poop()
}

interface WeightLifter : Human {
  fun liftHeavyStuff()
  fun pose()
}
```

> Only the functions declared in the `WeightLifter` interface need to be added manually

That's all there is to say on this subject.

To summarise:

- A class can implement multiple interfaces and delegate its functionality to one or more objects
- A class with multiple interfaces that extend a common parent can delegate each interfaces' implementation but must override functions defined in the parent
- A class that implements a child interface can delegate to its parent and only needs to add functions defined in the child.

If you enjoyed this post or found it helpful (or both) then please feel free to follow me on Twitter at [@LankyDanDev](https://twitter.com/LankyDanDev) and remember to share with anyone else who might find this useful!