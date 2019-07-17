---
title: Rust for Java Devs - Compiling code and using Cargo
slug: rust-for-java-devs-compiling-code-and-using-cargo
date: "2018-01-21"
published: true
tags: [rust, java]
cover_image: ./rust-icon-with-background.png
include_date_in_url: true
---

After my last post seemed to be well received I am back with another Rust for Java Devs post. Today we will look at a compiling Rust code and have a brief look at using the basics of Cargo. For a developer there isn't much difference between how to compile Rust code compared to Java, but where they vary are their build tools. Rust comes built in with Cargo to manage projects whereas Java does not and relies on external build tools like Maven and Gradle. We can then use Cargo to build and run projects instead of directly compiling and executing the created `.exe` file.

So lets jump in.

In my previous post [Rust for Java Devs: Creating Variables](https://lankydan.dev/2018/01/13/rust-for-java-devs-creating-variables-first-rust-post/) I showed code examples and what they output, but without any other knowledge you would not be able to try it yourself because you can't compile it. I am here to correct that.

Compiling is straight forward and most likely you won't actually need to use it very often as you will use Cargo instead. Nevertheless it is still worth knowing how to compile your code manually. To compile your code run the `rustc` command with the name of the file you wish to compile.

```
λ rustc main.rs
λ ./main        (run on Linux or OSX)
λ ./main.exe    (run on Windows)
```

Thats it. The output of compiling Rust source code is an executable that can then be ran when needed.

The java version of the same process is.

```
λ javac main.java
λ java main
```

As you can see there isn't much difference between them in terms of what you need to enter into the command line. Where they do differ is that Rust produces an `.exe` file which is why it does not mention Rust at all and can be executed by anyone even if they do no have Rust on their machine, whereas the Java version uses another command to run the `.class` file it creates and therefore requires Java to be installed on the machine it is ran on.

Now that the more fundamental stuff is out of the way we can look at the build tools that both Rust and Java have available, which are normally used to compile/build and run your code. As mentioned earlier Rust uses Cargo which is a build system and package manager that comes out of the box with Rust. Java does not have a inbuilt build tool but can use external tools such as Maven and Gradle. If you are familiar with either of these I doubt that Cargo will look alien to you even if the syntax is different.

Lets go through the process of creating and running a Cargo project.

First of all we need to run the `cargo new` command. This includes the name of the project and it's type, add `--bin` for binary executable file or to create a library then there is no need to add anything extra.

```
λ cargo new my_rust_project --bin
```

After running the above command above we will have a new directory created called `my_rust_project` that contains a few files inside of them. Firstly there is the `main.rs` file inside the `src` directory containing a little hello world program (I assume you will delete this!) where the main executable code will go, by default Cargo will look for a `main.rs` (executable) or `lib.rs` (library) file. Next you will notice that there is a `.gitignore` file, yes Cargo initialised a Git repository for you and ignored the files in the target directory. Finally there are the `Cargo.lock` and `Cargo.toml` files, below is the generated `Cargo.toml` file.

```toml
[package]
name = "my_rust_project"
version = "0.1.0"
authors = ["Dan Newton <danknewton@hotmail.com>"]

[dependencies]
```

Obviously your project wont have my name and email in it. Cargo uses TOML (Tom's Obvious, Minimal Language) instead of XML which Maven uses or the Groovy like DSL that Gradle requires.

Currently the `Cargo.toml` file is pretty empty as we do not have any dependencies or any other configuration. If we wanted to add a dependency to it would look something like below.

```toml
[package]
name = "my_rust_project"
version = "0.1.0"
authors = ["Dan Newton <danknewton@hotmail.com>"]

[dependencies]

rand = "0.3.14"
```

This will pull in a dependency on the rand crate (a crate is what Rust calls a library) with any version that is compatible with `0.3.14`.

If this was done in Maven it would look like this (I haven't used Gradle myself so I won't show one for it).

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>

  <groupId>my_rust_project</groupId>
  <artifactId>my_rust_project</artifactId>
  <version>0.1.0</version>

  <dependencies>
      <dependency>
          <groupId>some_group</groupId>
          <artifactId>rand</artifactId>
          <version>0.3.14</version>
      </dependency>
  </dependencies>
</project>
```

Finally there is the `Cargo.lock` file. This contains the dependencies that are actually used within your project, as these could differ from what are shown in the `Cargo.toml` file. Below is what it will look like after running `cargo new`.

```toml
[[package]]
name = "my_rust_project"
version = "0.1.0"
```

Again this is empty but we will review this later.

Now that we have gone through the files created for us we need to know what we can actually do with them. For the scope of this post we have the following commands `cargo build` or `cargo run`. Running either one will build the project but `cargo run` does an extra step, and as the name suggests, runs the created executable. It might take a while the first time you build the whole project, but Cargo is smart enough to figure out which files have changed and only recompile the changes.

This is where the `Cargo.lock` comes back into the game. After running `cargo build` or `cargo run` (whatever, just build the damn project) any dependencies that are used will be added to the file. Below is what is now contained within `Cargo.lock` when we have a dependency on the rand crate.

```toml
[[package]]
name = "bitflags"
version = "1.0.1"
source = "registry+https://github.com/rust-lang/crates.io-index"

[[package]]
name = "fuchsia-zircon"
version = "0.3.3"
source = "registry+https://github.com/rust-lang/crates.io-index"
dependencies = [
 "bitflags 1.0.1 (registry+https://github.com/rust-lang/crates.io-index)",
 "fuchsia-zircon-sys 0.3.3 (registry+https://github.com/rust-lang/crates.io-index)",
]

[[package]]
name = "fuchsia-zircon-sys"
version = "0.3.3"
source = "registry+https://github.com/rust-lang/crates.io-index"

[[package]]
name = "libc"
version = "0.2.36"
source = "registry+https://github.com/rust-lang/crates.io-index"

[[package]]
name = "my_rust_project"
version = "0.1.0"
dependencies = [
 "rand 0.3.20 (registry+https://github.com/rust-lang/crates.io-index)",
]

[[package]]
name = "rand"
version = "0.3.20"
source = "registry+https://github.com/rust-lang/crates.io-index"
dependencies = [
 "fuchsia-zircon 0.3.3 (registry+https://github.com/rust-lang/crates.io-index)",
 "libc 0.2.36 (registry+https://github.com/rust-lang/crates.io-index)",
]
```

There is quite a lot in here now. Because we are using the rand crate all of it's dependencies have also been pulled into our project which is why the lock file is now so full. You can use the `cargo update` command to update your dependencies to newer versions based on what is in your `Cargo.toml` file, these will be versions larger than `0.3.0` and smaller than `0.4.0` for the rand crate in this example. To up the version even more we will need to change the version in `Cargo.toml` ourselves.

I think we have covered what is needed for a basic understanding of compiling Rust code manually as well as using Cargo as our build tool. I haven't done much comparing Cargo to Java's build tools but I think there is enough information here to allow you to make your own comparison to your preferred tool.

In conclusion there is not much difference in the process of compiling Rust code vs Java code but it is important to note that the outputs of each differ quite considerably. Rust will produce a `.exe` whereas Java creates a `.class` file, meaning that Rust compiles to an executable that can be run without Rust being locally installed whereas Java needs to be installed to run it's compiled code. Each language has their own build tools, but Rust comes with Cargo ready to go whereas Java uses external tools. Which system is better is up to you and I'm sure my own opinion will form once I have delved deeper into Rust myself and actually need to put together a more complex build.

If you are new to Rust and want to learn more about it, I suggest viewing the [Rust Book](https://doc.rust-lang.org/book/second-edition/ch01-00-introduction.html) which I think is an excellent resource for getting started with Rust.

If you found this post helpful and wish to keep up to date with my new tutorials as I write them, follow me on Twitter at [@LankyDanDev](https://twitter.com/LankyDanDev).