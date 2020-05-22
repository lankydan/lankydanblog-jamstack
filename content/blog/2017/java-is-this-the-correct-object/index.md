---
title: Is this the correct object?
date: "2017-03-02"
published: true
tags: [java]
include_date_in_url: true
---

This is something I came across at work that wasn't working as I expected. After a little playing around it seemed pretty obvious but even after a few years of working with Java this wasn't a situation I came across before.

Now what happened? Its way easier to show you&nbsp;an example first.

```java
public class AssigningObjects {
  public static void main(String[] args) {
    Integer a = 1;
    Integer b = a;
    Integer c = 2;
    a = 3;
    a = c;
    System.out.println("a = " + a); // prints 2
    System.out.println("b = " + b); // prints 1
    System.out.println("c = " + c); // prints 2

    c = 4;
    System.out.println("a = " + a); // prints 2
    System.out.println("c = " + c); // prints 4

    c = null;
    System.out.println("a = " + a); // prints 2
    System.out.println("c = " + c); // prints null
  }
}
```

So the problem I had... I thought that&nbsp;if `b = a` and `a = c` then `b = c`, so by changing `c`'s value `b` will also change. But this is not the case. What actually happens is `a` refers to an underlying object (which is the Integer 1) and by assigning `b` to `a`, `b` now also refers to the same object. When `a` is assigned to `c` the underlying object `a` refers to has now changed, but this does not affect `b` which will still have the value 1 as the object it is pointing to has not changed.

Anyway this is just something small that I found interesting as I never actually ran into this situation before and when I told my colleague I wanted to tell him something interesting he told me to go away... so I told you instead!