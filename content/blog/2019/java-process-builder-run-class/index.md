---
title: Running a Java class as a subprocess
date: "2019-05-17"
published: true
tags: [java]
cover_image: blog-card.png
---

Running a Java class (not a jar) as a subprocess is something I needed to do this week. More precisely, I wanted to spawn a new process from within a test, instead of running it inside the test directly (in-process). I don't think this is anything fancy or a complex thing to do. But, this is not something I have ever needed to do before and didn't know the exact code to write.

Luckily, a quick google and a few Stack Overflow posts later. I found the [answer](https://stackoverflow.com/questions/636367/executing-a-java-application-in-a-separate-process) I needed. Although the answer is there, I am rewriting it here for my own benefit and as well as yours.

```java
class JavaProcess {

  private JavaProcess() {
  }

  public static int exec(Class clazz, List<String> jvmArgs, List<String> args) throws IOException,
        InterruptedException {
    String javaHome = System.getProperty("java.home");
    String javaBin = javaHome + File.separator + "bin" + File.separator + "java";
    String classpath = System.getProperty("java.class.path");
    String className = clazz.getName();

    List<String> command = new ArrayList<>();
    command.add(javaBin);
    command.addAll(jvmArgs);
    command.add("-cp");
    command.add(classpath);
    command.add(className);
    command.addAll(args);

    ProcessBuilder builder = new ProcessBuilder(command);
    Process process = builder.inheritIO().start();
    process.waitFor();
    return process.exitValue();
  }
}
```

This static function takes in the `Class` that you want to execute along with any JVM arguments and arguments that the class's `main` method is expecting. Having access to both sets of arguments allows full control over the execution of the subprocess. For example, you might want to execute your class with a low heap space to see how it copes under memory pressure (which is what I needed it for).

Note, for this to work, the class that you want to execute needs to have a `main` method. 👈 This is kind of important.

Accessing the path of the Java executable (stored in `javaBin`) allows you to execute the subprocess using the same version of Java as the main application. If `javaBin` was replaced by `"java"`, then you run the risk of executing the subprocess with your machine's default version of Java. That is probably fine a lot of the time. But, there are likely to be situations where this is not desired.

Once the commands are all added to the `command` list, they are passed to the `ProcessBuilder`. The `ProcessBuilder` takes this list and uses each value contained in it to generate the command. Each value inside the `command` list is separated with spaces by the `ProcessBuilder`. There are other overloads of its constructor, one of which takes in a single string where you can manually define the whole command yourself. This removes the need for you to manually manage the addition of arguments to the command string.

The subprocess is started with its IO passing up to the process that executed it. This is required to see both any `stdout`s and `stderr`s it produces. `inheritIO` is a convenience method and can also be achieved by calling chaining the following code instead (also configures the `stdin` of the subprocess):

```java
builder
    .redirectInput(ProcessBuilder.Redirect.INHERIT)
    .redirectOutput(ProcessBuilder.Redirect.INHERIT)
    .redirectError(ProcessBuilder.Redirect.INHERIT);
```

Finally `waitFor` tells the executing thread to wait for the spawned subprocess to finish. It does not matter if the process ends successfully or errors. As long as the subprocess finishes somehow. The main execution can carry on going. How the process finished is detailed by its `exitValue`. For example, `0` normally denotes a successful execution and `1` details an invalid syntax error. There are many other exit codes and they can all vary between applications.

Calling the `exec` method would look something like the below:

```java
JavaProcess.exec(MyProcess.class, List.of("-Xmx200m"), List.of("argument"))
```

Which executes the following command (or something close to it):

```java
/Library/Java/JavaVirtualMachines/jdk-12.0.1.jdk/Contents/Home/bin/java -cp /playing-around-for-blogs MyProcess "argument"
```

I have cut out a lot of the paths included classpath to keep it a bit tidier. Yours will probably look much longer than this. It really depends on your application really. The path in the command above is the bare minimum needed to get it to run (obviously customised for my machine).

The `exec` method is reasonably flexible and helpful in describing what is going on. Although, if you wish to make it more malleable and applicable in a wider range of situations, I recommend returning the `ProcessBuilder` itself from the method. Allowing you to reuse this piece of code in several places while providing the flexibility to configure the IO redirects as well as the power to decide whether to run the subprocess in the background or block and wait for it to finish. This would look something like:

```java
public static ProcessBuilder exec(Class clazz, List<String> jvmArgs, List<String> args) {
  String javaHome = System.getProperty("java.home");
  String javaBin = javaHome + File.separator + "bin" + File.separator + "java";
  String classpath = System.getProperty("java.class.path");
  String className = clazz.getName();

  List<String> command = new ArrayList<>();
  command.add(javaBin);
  command.addAll(jvmArgs);
  command.add("-cp");
  command.add(classpath);
  command.add(className);
  command.addAll(args);

  return new ProcessBuilder(command);
}
```

By utilising either (or both) of these functions, you will now have the ability to run any class that exists in your application's classpath. In my situation, this was very helpful in spawning subprocesses inside of an integration test without needing to pre-build any jars. This allowed control over JVM arguments, such as the memory of the subprocesses which would not be configurable if run directly inside the existing process.

If you enjoyed this post or found it helpful (or both) then please feel free to follow me on Twitter at [@LankyDanDev](https://twitter.com/LankyDanDev) and remember to share with anyone else who might find this useful!