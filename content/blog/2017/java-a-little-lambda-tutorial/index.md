---
title: A Little Lambda Tutorial
date: "2017-01-14"
published: true
tags: [java, java 8]
include_date_in_url: true
cover_image: blog-card.png
---

Lambda expressions are thought to be one of the biggest features in the release of Java 8 as they allow a more functional approach to Java programming. This is something that wasn't built into Java in previous versions. Java follows the Object-Oriented programming paradigm which uses object which can store data in fields and manipulate them. The Functional programming on the other hand is declarative and uses expressions or declarations instead of statements.

As someone that didn't particularly like Functional programming while at university I was very skeptical about even trying to use Lambda expressions in Java. I didn't want to relive the pain I had from trying to understand what the hell was going on. But I gave it a try and I wrote this little tutorial from what I learnt.

Lambda expressions are defined by:

> parameters -> expression body

```java
Comparator<String> comparator = (a,b) -> a.compareTo(b);
```

It takes in a parameter or parameters and does stuff with them.

Some rules about using Lambda expressions:

- __Type declaration is optional__ - The compiler can figure out types from the value of the input parameters.
- __Brackets are not needed around a singular parameter__ - If there is one parameter then the brackets are not needed but can still be used, although multiple parameters will still require the brackets.
- __Optional curly brackets__ - If the expression body consists of a single statement then the curly brackets can be removed.
- __Return keyword is option__ - The compiler will return the value of the expression if it contains a single statement. If there are curly brackets around the expression body then it will require a return statement, whether there it consists  of a single statement or not.

Using a Lambda expression first requires a functional interface that contains a method that it will override. The are many classes that are already built into Java that can be used as a functional interface, such as Runnable and Comparator.

```java
@FunctionalInterface
public interface Runnable {
    public abstract void run();
}
```

```java
@FunctionalInterface
public interface Comparator<T> {
    int compare(T o1, T o2);
  // contains other methods but compare is what needs to be overridden 
}
```

Before Java 8 there were a few ways to use the classes and override their behavior. Option 1 is to make a new class and implement them and their method. Unless it is a piece of code that is going to be used a lot this can be seen as overkill and can lead to lots of tiny classes that are only used once. Option 2  is to use an Anonymous class and create an instance of the interface in the current code where it is needed and override the method there. For a piece of code that is used once this makes more sense as you get the functionality you need without the hassle and clutter of making a new class.

- Option 1 - Create a new class:

  ```java
  public class MyRunnable implements Runnable {
      @Override
      public void run() {
          System.out.println("I have implemented Runnable");
      }

      public static void main(String args[]) {
          MyRunnable runnable = new MyRunnable();
          runnable.run();
      }
  }
  ```

- Option 2 - Create an Anonymous class:

  ```java
  Runnable runnable = new Runnable() {
    @Override
    public void run() {
      System.out.println("I have implemented Runnable");
    }
  };
  runnable.run();
  ```

Now we can follow the same path as the Anonymous class but this time the implementation of the interface will be done by using a Lambda expression.

```java
Runnable runnable = () -> System.out.println("I have implemented Runnable");
runnable.run();
```

As you can see this is allows this simple implementation to be done in much fewer lines of code. This example using Runnable does not require any parameters as the run() method also has no input parameters.

Lambda expressions can also be passed in as inputs into methods that require a functional interface as one of their parameters.

```java
public class ComparatorExample {
    public static void main(String args[]) {
        List<Integer> list = Arrays.asList(1,2,9,80,50,4,25,7);
        System.out.println("Unsorted list: " + list);
        Collections.sort(list, new Comparator<Integer>() {
            @Override
            public int compare(Integer a, Integer b) {
                return a.compareTo(b);
            }
        });
        System.out.println("Sorted list: " + list);
    }
}
```

Following the rules defined earlier in this post there are a few ways this could be rewritten using Lambda expressions, although one is clearly nicer than the rest.

```java
public class LambdaComparatorExample {
    public static void main(String args[]) {
        List<Integer> list = Arrays.asList(1,2,9,80,50,4,25,7);
        System.out.println("Unsorted list: " + list);

        // Display types
        Collections.sort(list, (Integer a, Integer b) -> a.compareTo(b));

        // Display curly brackets + return statement
        Collections.sort(list, (a,b) -> { return a.compareTo(b); });

        // Simplest
        Collections.sort(list, (a,b) -> a.compareTo(b));

        System.out.println("Sorted list: " + list);
    }
}
```

By now you hopefully have a little understanding into using Lambda expressions in Java 8. Currently I am still skeptical about using them in my code but in writing this post and the examples I can see why they are useful. The main reason I am starting to like them is that for simple operations they are clear and concise making the code much easier to read when quickly scanning through it. Although they might not be as useful once code becomes more complex, for simple operations such as performing a function on the elements of a list I would not hesitate to use a little Lambda expression.
