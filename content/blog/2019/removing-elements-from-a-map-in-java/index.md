---
title: Removing elements from a Map in Java
date: "2019-03-03"
published: true
tags: [java, java 8, basics, beginners]
include_date_in_url: true
description: Very short and simple post on removing elements from a `Map` in Java.
---

Very short and simple post on removing elements from a `Map` in Java. We will be focusing on removing multiple elements and ignore the fact you can remove a single element using `Map.remove`.

The `Map` below will be used for this post:

```java
Map<Integer, String> map = new HashMap<>();
map.put(1, "value 1");
map.put(2, "value 2");
map.put(3, "value 3");
map.put(4, "value 4");
map.put(5, "value 5");
```

There are a few ways to remove elements. You could loop through the code manually and remove them:

```java
for(Iterator<Integer> iterator = map.keySet().iterator(); iterator.hasNext(); ) {
  Integer key = iterator.next();
  if(key != 1) {
    iterator.remove();
  }
}
```

This is how you would do it without access to Java 8+. The `Iterator` is needed to prevent `ConcurrentModificationException`s when removing elements from the `Map`.

If you do have access to _newer_ versions of Java (8+) then you can choose from the below instead:

```java
// remove by value
map.values().removeIf(value -> !value.contains("1"));
// remove by key
map.keySet().removeIf(key -> key != 1);
// remove by entry / combination of key + value
map.entrySet().removeIf(entry -> entry.getKey() != 1);
```

`removeIf` is a method available to `Collection`s. Yes, a `Map` itself is not a `Collection` and does not have access to `removeIf` itself. But, by using: `values`, `keySet` or `entrySet`, a view of the `Map`‘s contents is returned. This view implements `Collection` allowing `removeIf` to be called on it.

The contents returned by `values`, `keySet` and `entrySet` are very important. Below is an extract of the JavaDoc for `values`:

```
* Returns a {@link Collection} view of the values contained in this map.
* The collection is backed by the map, so changes to the map are
* reflected in the collection, and vice-versa.
*
* The collection supports element removal, which removes the corresponding
* mapping from the map, via the {@code Iterator.remove},
* {@code Collection.remove}, {@code removeAll},
* {@code retainAll} and {@code clear} operations.
```

This JavaDoc explains that the `Collection` returned by `values` is backed by the `Map` and that changing either the `Collection` or the `Map` will alter the other. I don’t think I can explain what the JavaDoc is saying any better than what is already written there… So I’ll stop trying on that part now. I have only shown the documentation for `values`, but you can trust me when I say that `keySet` and `entrySet` are also both backed by the `Map`‘s contents. You can read the docs yourself if you don’t believe me.

This also links back to the first example using an _older_ Java version. The documentation specifies that `Iterator.remove` can be used. This is what is used earlier. Furthermore, the implementation of `removeIf` is very similar to the `Iterator` example. After talking about it, I might as well show it:

```java
default boolean removeIf(Predicate<? super E> filter) {
  Objects.requireNonNull(filter);
  boolean removed = false;
  final Iterator<E> each = iterator();
  while (each.hasNext()) {
    if (filter.test(each.next())) {
      each.remove();
      removed = true;
    }
  }
  return removed;
}
```

There is a bit extra to it. But, otherwise it is pretty much the same.

So, that’s that. Not much to conclude other than me telling you to remember that using: `values`, `keySet`, or `entrySet` will provide access to `removeIf` allowing easy removal of `Map` entries.

If you found this post helpful, you can follow me on Twitter at [@LankyDanDev](https://twitter.com/LankyDanDev) to keep up with my new posts.