---
title: Should you write comments?
date: "2017-01-07"
updated_date: "2022-03-27"
published: true
tags: [general]
include_date_in_url: true
cover_image: blog-card.png
---

To comment or not to comment, that is the question. I had a little argument with a family member who has also done some coding about this subject, although they're still in secondary school. They came and had a quick look at some code I was writing and was shocked to find that I didn't write any comments. 

So, in this post, I will write some of the things I told them. When is the right time to write them into your code, how helpful are they, and what should they contain? These are the questions I want to answer.

I don't usually write comments into my code anymore, especially into the code I write at work. One of the first things I was told when I started working was to not write comments, and at first, I was sceptical, but after a while, it made sense. The code I write should explain itself. 

I shouldn't need to explain what a chunk of code does, as it should be obvious. If there is a chunk of code requiring a comment to describe it, I ask myself if it should be extracted to a separate method? When someone comes along and looks at that code, they can simply look at the method name and know what it does. This leads to other benefits as methods will become smaller, as related lines of code are grouped and available to be re-used elsewhere.

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

Although this is a relatively simple example, I think it could be improved slightly, allowing the comments to be removed.

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

The downside to splitting this into separate methods, as I am sure you can see, is that the code becomes longer. But as the code you write becomes more complicated, it's worth making a few extra lines to make it easier to read.

I've discussed reducing the need for comments by extracting your code into smaller and more concise methods, but I should mention a fundamental rule that all developers should adhere to. Give variables useful names. Don't give a variable a random letter as its name; give it a proper title. You wouldn't want to be called `variableA`; you want to be called by your own name. It's the same sort of idea with naming variables.

```java
int variableA = 365;    // variable for the days in a year
```

Improving this takes only a few seconds and makes it easier to read.

```java
int daysInAYear = 365;
```

When someone comes and skim reads this code, they will see the variable and instantly know what it is.

So you decided that you still want to write a comment, hopefully after trying your best not to; what should it say? 

Keep it short, precise and easy to understand. Don't write some crazy long story about everything the code does, but also don't just write one word in it; if it's that short, it should be a separate method. Don't write what every line is meant to do; instead, write a summary of the code. Finally, don't write a load of terms that others are not going to understand as someone else needs to be able to read that comment and, after a quick browse of the code, understand what it does, but not necessarily how it does it.

Even though I said I don't write comments anymore, there will be times when they are needed. If a really obscure piece of code has been written that cant be split up into smaller methods to say what it does and cant be written in another way, a comment is probably the only solution. Even though self-explanatory code is ideal, it is better than having code that makes no sense. You should never write code that leaves readers utterly confused; there needs to be something that makes it understandable, and sometimes it's a comment.

The other times where you should write comments are for javadocs. A short explanation of what a method should do so when someone comes along to use it in their own code, it will be a bit clearer on what the method will do. There's no need to write javadocs for every single method you write; focus on public methods as these are the methods that can be used in other parts of the code base, and writing a javadoc for the classes you write and when they should be used will also be helpful. For an extra look into comments and some of the useful annotations that can be used in javadocs check out [Tutorialspoint's documentation on Java documentation](https://www.tutorialspoint.com/java/java_documentation.htm).

If you follow these guidelines, your code will be much easier to understand and follow for yourself and your colleagues. You don't want to return to some code you wrote a few months ago when its workings are no longer in your head and say to yourself, "what the f**k does this do". Your colleagues will also be less grumpy if they don't need to scratch their heads to understand what you wrote, and if you don't like talking to your them, then don't give them a reason to ask you questions.

Hopefully, this post helps you understand when to write comments and should prevent loads of clutter from being added to future code.