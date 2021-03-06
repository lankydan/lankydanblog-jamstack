---
title: Serializable Java Lambdas
date: "2020-01-24"
published: true
tags: [java, kryo, lambdas, functions]
cover_image: blog-card.png
---

Recently I was presented with the following error when serializing a lambda with Kryo:

```java
com.esotericsoftware.kryo.KryoException: 
  java.lang.IllegalArgumentException: 
    Unable to serialize Java Lambda expression, unless explicitly declared e.g., 
    Runnable r = (Runnable & Serializable) () -> System.out.println("Hello world!");
```

If you do not recognise the `(Runnable & Serializable)` syntax, don't worry, it is merely stating that the lambda must implement two types. This is called [Type Intersection](http://iteratrlearning.com/java/generics/2016/05/12/intersection-types-java-generics.html). Personally, I have never needed to use this myself, so have never really thought about it. `Serializable` is a bit of a unique interface in this regards, as there is nothing you actually need to implement.

Without making this cast, the lambda will be considered unserializable, which does not make Kryo happy.

As someone who doesn't look at bytecode very often, I find it amazing how big the difference is when adding and extra casting of `& Serializable`. The examples below demonstrate this. For clarity, I used the following command to generate bytecode from the code snippets:

```
javap -c -p target.classes.dev.lankydan.IntersectionCasting  
```

Before doing any casting:

```java
public class IntersectionCasting {

  public static void main(String[] args) {
    Function<String, String> function = (message) -> "Kryo please serialize this message '" + message + "'";
  }
}
```

The generated bytecode is:

```java
public class dev.lankydan.IntersectionCasting {
  public dev.lankydan.IntersectionCasting();
    Code:
       0: aload_0
       1: invokespecial #1                  // Method java/lang/Object."<init>":()V
       4: return

  public static void main(java.lang.String[]);
    Code:
       0: invokedynamic #2,  0              // InvokeDynamic #0:apply:()Ljava/util/function/Function;
       5: astore_1
       6: return

  private static java.lang.String lambda$main$0(java.lang.String);
    Code:
       0: new           #3                  // class java/lang/StringBuilder
       3: dup
       4: invokespecial #4                  // Method java/lang/StringBuilder."<init>":()V
       7: ldc           #5                  // String Kryo please serialize this message '
       9: invokevirtual #6                  // Method java/lang/StringBuilder.append:(Ljava/lang/String;)Ljava/lang/StringBuilder;
      12: aload_0
      13: invokevirtual #6                  // Method java/lang/StringBuilder.append:(Ljava/lang/String;)Ljava/lang/StringBuilder;
      16: ldc           #7                  // String '
      18: invokevirtual #6                  // Method java/lang/StringBuilder.append:(Ljava/lang/String;)Ljava/lang/StringBuilder;
      21: invokevirtual #8                  // Method java/lang/StringBuilder.toString:()Ljava/lang/String;
      24: areturn
}
```

After casting:

```java
public class IntersectionCasting {

  public static void main(String[] args) {
    Function<String, String> function =
        (Function<String, String> & Serializable) (message) -> "Kryo please serialize this message '" + message + "'";
  }
}
```

The bytecode becomes:

```java
public class dev.lankydan.IntersectionCasting {
  public dev.lankydan.IntersectionCasting();
    Code:
       0: aload_0
       1: invokespecial #1                  // Method java/lang/Object."<init>":()V
       4: return

  public static void main(java.lang.String[]);
    Code:
       0: invokedynamic #2,  0              // InvokeDynamic #0:apply:()Ljava/util/function/Function;
       5: checkcast     #3                  // class java/io/Serializable
       8: checkcast     #4                  // class java/util/function/Function
      11: astore_1
      12: return

  private static java.lang.Object $deserializeLambda$(java.lang.invoke.SerializedLambda);
    Code:
       0: aload_0
       1: invokevirtual #5                  // Method java/lang/invoke/SerializedLambda.getImplMethodName:()Ljava/lang/String;
       4: astore_1
       5: iconst_m1
       6: istore_2
       7: aload_1
       8: invokevirtual #6                  // Method java/lang/String.hashCode:()I
      11: lookupswitch  { // 1
           -1657128837: 28
               default: 39
          }
      28: aload_1
      29: ldc           #7                  // String lambda$main$2cf54983$1
      31: invokevirtual #8                  // Method java/lang/String.equals:(Ljava/lang/Object;)Z
      34: ifeq          39
      37: iconst_0
      38: istore_2
      39: iload_2
      40: lookupswitch  { // 1
                     0: 60
               default: 135
          }
      60: aload_0
      61: invokevirtual #9                  // Method java/lang/invoke/SerializedLambda.getImplMethodKind:()I
      64: bipush        6
      66: if_icmpne     135
      69: aload_0
      70: invokevirtual #10                 // Method java/lang/invoke/SerializedLambda.getFunctionalInterfaceClass:()Ljava/lang/String;
      73: ldc           #11                 // String java/util/function/Function
      75: invokevirtual #12                 // Method java/lang/Object.equals:(Ljava/lang/Object;)Z
      78: ifeq          135
      81: aload_0
      82: invokevirtual #13                 // Method java/lang/invoke/SerializedLambda.getFunctionalInterfaceMethodName:()Ljava/lang/String;
      85: ldc           #14                 // String apply
      87: invokevirtual #12                 // Method java/lang/Object.equals:(Ljava/lang/Object;)Z
      90: ifeq          135
      93: aload_0
      94: invokevirtual #15                 // Method java/lang/invoke/SerializedLambda.getFunctionalInterfaceMethodSignature:()Ljava/lang/String;
      97: ldc           #16                 // String (Ljava/lang/Object;)Ljava/lang/Object;
      99: invokevirtual #12                 // Method java/lang/Object.equals:(Ljava/lang/Object;)Z
     102: ifeq          135
     105: aload_0
     106: invokevirtual #17                 // Method java/lang/invoke/SerializedLambda.getImplClass:()Ljava/lang/String;
     109: ldc           #18                 // String dev/lankydan/IntersectionCasting
     111: invokevirtual #12                 // Method java/lang/Object.equals:(Ljava/lang/Object;)Z
     114: ifeq          135
     117: aload_0
     118: invokevirtual #19                 // Method java/lang/invoke/SerializedLambda.getImplMethodSignature:()Ljava/lang/String;
     121: ldc           #20                 // String (Ljava/lang/String;)Ljava/lang/String;
     123: invokevirtual #12                 // Method java/lang/Object.equals:(Ljava/lang/Object;)Z
     126: ifeq          135
     129: invokedynamic #2,  0              // InvokeDynamic #0:apply:()Ljava/util/function/Function;
     134: areturn
     135: new           #21                 // class java/lang/IllegalArgumentException
     138: dup
     139: ldc           #22                 // String Invalid lambda deserialization
     141: invokespecial #23                 // Method java/lang/IllegalArgumentException."<init>":(Ljava/lang/String;)V
     144: athrow

  private static java.lang.String lambda$main$2cf54983$1(java.lang.String);
    Code:
       0: new           #24                 // class java/lang/StringBuilder
       3: dup
       4: invokespecial #25                 // Method java/lang/StringBuilder."<init>":()V
       7: ldc           #26                 // String Kryo please serialize this message '
       9: invokevirtual #27                 // Method java/lang/StringBuilder.append:(Ljava/lang/String;)Ljava/lang/StringBuilder;
      12: aload_0
      13: invokevirtual #27                 // Method java/lang/StringBuilder.append:(Ljava/lang/String;)Ljava/lang/StringBuilder;
      16: ldc           #28                 // String '
      18: invokevirtual #27                 // Method java/lang/StringBuilder.append:(Ljava/lang/String;)Ljava/lang/StringBuilder;
      21: invokevirtual #29                 // Method java/lang/StringBuilder.toString:()Ljava/lang/String;
      24: areturn
}
```

Now, I don't really know how to read bytecode, but even I can see that there is a lot more going on in the version with the `& Serializable` cast. 

If you can explain what is going on there, then be my guest and give me a shout.

One thing I _can_ read from the bytecode above, is the references to `SerializedLambda` which were not there before. This class is used by compilers and libraries to ensure that lambdas deserialise correctly. Making the intersection cast of `Function<String, String> & Serializable` changes the underlying type of the lambda, allowing a library like Kryo to properly understand how to deserialise lambdas given to it.

Adding this extra casting of `& Serializable` is one possible solution to allow Kryo to deserialise lambdas. An alternative route involves creating a new interface that extends both the underlying `Function` type that you need, along with `Serializable`. This is useful when putting together a library or API for others to consume. Allowing them to focus purely on implementing their code, rather than worrying about providing the correct casting to satisfy the serialisation of their lambdas. 

You could use an interface like the one below:

```java
interface SerializableLambda extends Function<String, String>, Serializable {}
```

This can then be used to replace the casting in the previous example:

```java
public class IntersectionCasting {

  public static void main(String[] args) {
    SerializableLambda function = (message) -> "Kryo please serialize this message '" + message + "'";
  }


  interface SerializableLambda extends Function<String, String>, Serializable {}
}
```

I have added the bytecode generated by this change below:

```java
public class dev.lankydan.IntersectionCasting {
  public dev.lankydan.IntersectionCasting();
    Code:
       0: aload_0
       1: invokespecial #1                  // Method java/lang/Object."<init>":()V
       4: return

  public static void main(java.lang.String[]);
    Code:
       // NO CASTING                        // Mention of casting is removed and reference to new interface is added
       0: invokedynamic #2,  0              // InvokeDynamic #0:apply:()Ldev/lankydan/IntersectionCasting$SerializableLambda;
       5: astore_1
       6: return

  private static java.lang.Object $deserializeLambda$(java.lang.invoke.SerializedLambda);
    Code:
       0: aload_0
       1: invokevirtual #3                  // Method java/lang/invoke/SerializedLambda.getImplMethodName:()Ljava/lang/String;
       4: astore_1
       5: iconst_m1
       6: istore_2
       7: aload_1
       8: invokevirtual #4                  // Method java/lang/String.hashCode:()I
      11: lookupswitch  { // 1
           -1657128837: 28
               default: 39
          }
      28: aload_1
      29: ldc           #5                  // String lambda$main$2cf54983$1
      31: invokevirtual #6                  // Method java/lang/String.equals:(Ljava/lang/Object;)Z
      34: ifeq          39
      37: iconst_0
      38: istore_2
      39: iload_2
      40: lookupswitch  { // 1
                     0: 60
               default: 135
          }
      60: aload_0
      61: invokevirtual #7                  // Method java/lang/invoke/SerializedLambda.getImplMethodKind:()I
      64: bipush        6
      66: if_icmpne     135
      69: aload_0
      70: invokevirtual #8                  // Method java/lang/invoke/SerializedLambda.getFunctionalInterfaceClass:()Ljava/lang/String;
      73: ldc           #9                  // String dev/lankydan/IntersectionCasting$SerializableLambda
      75: invokevirtual #10                 // Method java/lang/Object.equals:(Ljava/lang/Object;)Z
      78: ifeq          135
      81: aload_0
      82: invokevirtual #11                 // Method java/lang/invoke/SerializedLambda.getFunctionalInterfaceMethodName:()Ljava/lang/String;
      85: ldc           #12                 // String apply
      87: invokevirtual #10                 // Method java/lang/Object.equals:(Ljava/lang/Object;)Z
      90: ifeq          135
      93: aload_0
      94: invokevirtual #13                 // Method java/lang/invoke/SerializedLambda.getFunctionalInterfaceMethodSignature:()Ljava/lang/String;
      97: ldc           #14                 // String (Ljava/lang/Object;)Ljava/lang/Object;
      99: invokevirtual #10                 // Method java/lang/Object.equals:(Ljava/lang/Object;)Z
     102: ifeq          135
     105: aload_0
     106: invokevirtual #15                 // Method java/lang/invoke/SerializedLambda.getImplClass:()Ljava/lang/String;
     109: ldc           #16                 // String dev/lankydan/IntersectionCasting
     111: invokevirtual #10                 // Method java/lang/Object.equals:(Ljava/lang/Object;)Z
     114: ifeq          135
     117: aload_0
     118: invokevirtual #17                 // Method java/lang/invoke/SerializedLambda.getImplMethodSignature:()Ljava/lang/String;
     121: ldc           #18                 // String (Ljava/lang/String;)Ljava/lang/String;
     123: invokevirtual #10                 // Method java/lang/Object.equals:(Ljava/lang/Object;)Z
     126: ifeq          135
     129: invokedynamic #2,  0              // InvokeDynamic #0:apply:()Ldev/lankydan/IntersectionCasting$SerializableLambda;
     134: areturn
     135: new           #19                 // class java/lang/IllegalArgumentException
     138: dup
     139: ldc           #20                 // String Invalid lambda deserialization
     141: invokespecial #21                 // Method java/lang/IllegalArgumentException."<init>":(Ljava/lang/String;)V
     144: athrow

  private static java.lang.String lambda$main$2cf54983$1(java.lang.String);
    Code:
       0: new           #22                 // class java/lang/StringBuilder
       3: dup
       4: invokespecial #23                 // Method java/lang/StringBuilder."<init>":()V
       7: ldc           #24                 // String Kryo please serialize this message '
       9: invokevirtual #25                 // Method java/lang/StringBuilder.append:(Ljava/lang/String;)Ljava/lang/StringBuilder;
      12: aload_0
      13: invokevirtual #25                 // Method java/lang/StringBuilder.append:(Ljava/lang/String;)Ljava/lang/StringBuilder;
      16: ldc           #26                 // String '
      18: invokevirtual #25                 // Method java/lang/StringBuilder.append:(Ljava/lang/String;)Ljava/lang/StringBuilder;
      21: invokevirtual #27                 // Method java/lang/StringBuilder.toString:()Ljava/lang/String;
      24: areturn
}
```

Most of it is the same, with some new references to the `SerializableLambda` interface and the removal of the original intersection cast.

As mentioned before, this solution is ideal for library and API authors as it allows developers to write code as usual without having to worry about casting (for example, if the library uses Kryo under the hood). Furthermore, since the interface extends `Function` which is a `@FunctionalInterface`, developers can nicely write lambdas/functions and don't even have to mention the interface if passing it directly into another function or constructor. I personally went down this route when designing a new API for [Corda](https://github.com/corda/corda). I wanted to provide the most accessible API for developers to use, while still providing an API that works (I can't let Kryo blow up...).

In conclusion, in this post which lacks a lot of information and is littered with extended snippets of bytecode, you need to take away two things. You can make a Java lambda/function serializable through type intersection, and you can ensure that your own APIs are clean by creating a new interface that extends both your desired function type and `Serializable`. These are both routes that should be considered when using a serialisation library like Kryo.

If you enjoyed this post or found it helpful (or both) then please feel free to follow me on Twitter at [@LankyDanDev](https://twitter.com/LankyDanDev) and remember to share with anyone else who might find this useful!