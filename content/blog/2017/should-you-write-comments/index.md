---
title: Should you write comments?
date: "2017-01-07"
published: true
tags: [general]
include_date_in_url: true
cover_image: blog-card.png
---

To comment or not to comment, that is the question. I had a little argument with some of my family who have also done some coding, although one of them is still in secondary school, about this subject. They came a had a quick look at some code I was writing at home and asked where are my comments and were shocked at my reply when I told them I don't. So I'm going to write some of the things I told them. When is it the write time to write them into your code, how helpful are they and what should they contain? These are the questions I want to answer.

I don't normally write comments into my code anymore, especially into the code I write at work. One of the first things I was told when I started working was to not write comments and at first I was a bit skeptic but after a while it made sense. The code I write should explain itself. I shouldn't need to explain what a chunk of code does as it should be obvious. If there is a chunk of code that needs a comment to say what it is doing I ask myself should this be a separate method? That way when someone comes along and looks at that code they can simply look at the method name and know what it should do. This leads to other benefits methods will become smaller as lines of code that are related will be moved somewhere else and maybe that new method that's been created could be reused somewhere else.

```java
public void someRandomMethod() {
  // add numbers up to 10
  int totalOfAddedNumbers = 0;
  for (int i = 1; i <= 10; i++) {
    totalOfAddedNumbers += i;
  }

  // multiply numbers up to 10
  int totalOfMultipliedNumbers = 1;
  for (int i = 1; i <= 10; i++) {
    totalOfMultipliedNumbers *= i;
  }

  // subtract numbers up to 10
  int totalOfSubtractedNumbers = 0;
  for (int i = 1; i <= 10; i++) {
    totalOfSubtractedNumbers -= i;
  }

  System.out.println(totalOfAddedNumbers);
  System.out.println(totalOfMultipliedNumbers);
  System.out.println(totalOfSubtractedNumbers);
}
```

Although this is a rather simple example, I think it could be improved slightly allowing the comments to be removed.

```java
public void someRandomMethod() {
  System.out.println(totalOfAddedNumbersUpToTen());
  System.out.println(totalOfMultipliedNumbersUpToTen());
  System.out.println(totalOfSubtractedNumbersUpToTen());
  }

  private int totalOfAddedNumbersUpToTen() {
  int totalOfAddedNumbers = 0;
  for (int i = 1; i <= 10; i++) {
    totalOfAddedNumbers += i;
  }
  return totalOfAddedNumbers;
  }

  private int totalOfMultipliedNumbersUpToTen() {
  int totalOfMultipliedNumbers = 1;
  for (int i = 1; i <= 10; i++) {
    totalOfMultipliedNumbers *= i;
  }
  return totalOfMultipliedNumbers;
  }

  private int totalOfSubtractedNumbersUpToTen() {
  int totalOfSubtractedNumbers = 0;
  for (int i = 1; i <= 10; i++) {
    totalOfSubtractedNumbers -= i;
  }
  return totalOfSubtractedNumbers;
}
```

The downside to splitting this into separate methods as I am sure you can see, is that the code becomes longer. But as the code you write becomes me complicated its worth making a few extra lines to make it easier to read.

I talked above about comments for chunks of code but I should really mention the simplest thing that coders should be doing. Give variables a useful name. Don't just give a variable a random letter as its name, give it a proper title. You wouldn't want to be called "variableA" you want to be called by your own name. Its the same sort of idea with naming variables.

```java
int varialbeA = 365;    // variable for the days in a year
```

Improving this takes only a few seconds and makes it much easier to read.

```java
int daysInAYear = 365;
```

When someone comes and skim reads this code they will see the variable and instantly know what it is.

So you decided that you still want to write a comment, hopefully after trying your best not to, what should it say? Keep it short, precise and easy to understand. Don't write some crazy long story about everything the code does but also don't just write one word in it, if its that short it should be separate method. Don't write what every line is meant to do instead write a summary of the code. Finally don't write a load of terms that others are not going to understand as someone else needs to be able to read that comment and after a quick browse of the code understand what it does, but not necessarily how it does it.

Even though I said I don't write comments anymore, there is going to be times when they are needed. If a really obscure piece of code has been written that cant be split up into smaller methods to say what it does and cant be written in another way, a comment is probably the only solution. Even though self-explanatory code is ideal it is better than having code that makes no sense. There should never be a time that someone can come read a piece of code and not have a clue what is happening there needs to be something and sometimes it's a comment.

The other times where you should write comments are for javadocs. &nbsp;A short explanation of what a method should do so when someone comes along to use it in their own code it will be a bit clearer on what the method will do. &nbsp;There's no need to write javadocs for every single method you write, focus on public methods as these are the methods that can be used in other parts of the code base and writing a javadoc for the classes you write and when they should be used will also be helpful. &nbsp;For a extra look into comments and some of the useful annotations that can be used in javadocs check out [Tutorialspoint's documentation on Java documentation](https://www.tutorialspoint.com/java/java_documentation.htm).

If you follow these guidelines your code will be much easier to understand and follow not only for yourself but also for your colleagues. You don't want to come back to some code that you wrote a few months ago when its workings are no longer in your head and say to yourself "what the f**k does this do". Your colleagues are also going to be less grumpy if they don't need to scratch their heads to understand what you wrote and if you don't like talking to your them, then don't give them a reason to come ask you questions.

Hopefully this post helps in understanding when to write comments and should prevent loads of clutter from being added to future code.