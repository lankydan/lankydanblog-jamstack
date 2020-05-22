---
title: Being lazy with Lombok
date: "2017-04-29"
published: true
tags: [lombok, java]
include_date_in_url: true
---


Lombok allows us lazy Java developers to stop writing "boilerplate" code in our objects. Through the use of some annotations it will generate the methods for us without the need to write out each getter or setter and many other methods, allowing us to simply add actual functionality to the object or leave it pretty much empty and use it as a data transfer object. This post will go through some of the basics of using Lombok in your code.

Before explaining how to use it I think its best to show you what it can do with a quick example.

Without Lombok

```java
public class PersonDTO {

  private String firstName;
  private String secondName;
  private Date dateOfBirth;
  private String profession;
  private BigDecimal salary;

  public PersonDTO(
      String firstName, String secondName, Date dateOfBirth, String profession, BigDecimal salary) {
    this.firstName = firstName;
    this.secondName = secondName;
    this.dateOfBirth = dateOfBirth;
    this.profession = profession;
    this.salary = salary;
  }

  public PersonDTO() {}

  public String getFirstName() {
    return firstName;
  }

  public void setFirstName(String firstName) {
    this.firstName = firstName;
  }

  public String getSecondName() {
    return secondName;
  }

  public void setSecondName(String secondName) {
    this.secondName = secondName;
  }

  public Date getDateOfBirth() {
    return dateOfBirth;
  }

  public void setDateOfBirth(Date dateOfBirth) {
    this.dateOfBirth = dateOfBirth;
  }

  public String getProfession() {
    return profession;
  }

  public void setProfession(String profession) {
    this.profession = profession;
  }

  public BigDecimal getSalary() {
    return salary;
  }

  public void setSalary(BigDecimal salary) {
    this.salary = salary;
  }
}
```

With Lombok

```java
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PersonDTO {

  private String firstName;
  private String secondName;
  private Date dateOfBirth;
  private String profession;
  private BigDecimal salary;
  
}
```

As you can see it is way way shorter and is still clear what methods it should contain when compared to the original.

One other thing to note before continuing is that it is worth finding a plugin to handle the use of Lombok in your IDE. If you do not have one you are going to see a lot of compiler errors in your IDE, although it will still compile correctly due to the annotations. Intellij, Eclipse and Netbeans all have plugins available for use with Lombok to remove all those scary errors, they can all be found [here](https://projectlombok.org/download.html).

So going back to the example above you can see how the annotations are used to define what methods we want Lombok to generate for us. `@Getter` creates the getters for each field, `@Setter` generates the setters, `@AllArgsConstructor` creates a constructor that takes all the fields as parameters and `@NoArgsConstructor` makes a empty constructor. I'm sure you get the gist of whats going on by this point.

Now that you have seen a basic example lets look at what else it can do and how to use it. The first thing that we need to do to actually use it is add it to our classpath, which in this post is done via Maven using the following dependency.

```xml
<dependency>
  <groupId>org.projectlombok</groupId>
  <artifactId>lombok</artifactId>
</dependency>
```

The first annotations I want to look at a bit closer are the `@Getter` and `@Setter` annotations. These are prime examples of methods that clutter up classes and are arguably one of the main reasons the word "verbose" is always used to describe Java. So lets get rid of them! If you look back to the code earlier you can see the difference it makes by removing the getters and setters. Using these annotations is straight forward, you either apply it to the class to add them to all fields or mark each individual field with the annotation that you wish to have the respective method.

```java
@AllArgsConstructor
public class PersonDTO {

  @Getter private String firstName;
  @Getter private String secondName;
  @Getter private Date dateOfBirth;
  @Getter @Setter private final String profession;
  @Getter @Setter private BigDecimal salary;

}
```

The fields in this example all have getters and therefore the `@Getter` annotation could be applied to the class itself. The `@Setter` on the other hand has only been added to two fields preventing the others from being changed after initialisation. The annotations come equipped with some parameters to provide configuration. These include `value` to set the `AccessLevel` (`PUBLIC`, `MODULE`, `PROTECTED`, `PACKAGE`, `PRIVATE` or `NONE`) and `onMethod` to include other annotations on the generated methods. `@Getter` also comes with `lazy` to control if the method is lazy or not and `@Setter` also has `onParam` to add annotations to the parameters of the generated methods.

`@ToString` and `@EqualsAndHashCode` do as their annotations suggest and generate the `toString`, `equals` and `hashCode` methods. These are again some pretty basic methods to add to an object and can easily make the class look more cluttered than need be, so rejoice as they have been removed!

Lets have a look at the `@ToString` annotation. It also comes with a few parameters that allows us to control what exactly the `toString` method does, so its just like we wrote the method ourselves... but with a bit less typing. By leaving the annotation empty the generated method will include all fields and display their names and values.

```java
@ToString
public class PersonDTO {

  private String firstName;
  private String secondName;
  @JsonFormat(pattern = "dd/MM/yyyy")
  @DateTimeFormat(pattern = "dd/MM/yyyy")
  private Date dateOfBirth;
  private String profession;
  private BigDecimal salary;

}
```

By invoking the `toString` method we get the output

```java
PersonDTO(firstName=Joe, secondName=Blogs, dateOfBirth=Sat Apr 29 10:55:21 BST 2017, profession=Computer Scientist, salary=0)
```

Looks like a `toString` output to me, but to be sure I auto-generated one in Intellij and it produced.

```java
PersonDTO{firstName='Joe', secondName='Blogs', dateOfBirth=Sat Apr 29 10:57:20 BST 2017, profession='Computer Scientist', salary=0}
```

So they look a bit different but hopefully that doesn't bother you at all and if it does then you can write it by hand or use your IDE's generated method.

As mentioned already we can add some of the available parameters to the annotation to change the output of the generated method.

```java
@ToString(includeFieldNames = false, exclude = {"dateOfBirth", "profession", "salary"})
```

By changing the annotation to this the field names have been removed and the fields marked in the exclude parameter have been removed from the output.

There are a few extra parameters that can be used including `callSuper`, `doNotUseGetters`, `of` which can include the super in the `toString`, access the fields directly and only include the chosen fields (the opposite of `exclude`). The `@EqualsAndHashCode` annotation is pretty similar so I will skip over its explanation.

Lets look at some of the more interesting annotations. `@Builder` is something I wish I could have used at work recently as I was writing out a ton of objects with builders and it would have saved me a lot of effort. Again the annotation is pretty clear on what it does, it applies the Builder Pattern to the object.

Without Lombok

```java
public class PersonDTO {

  private String firstName;
  private String secondName;
  private Date dateOfBirth;
  private String profession;
  private BigDecimal salary;

  PersonDTO(
      String firstName, String secondName, Date dateOfBirth, String profession, BigDecimal salary) {
    this.firstName = firstName;
    this.secondName = secondName;
    this.dateOfBirth = dateOfBirth;
    this.profession = profession;
    this.salary = salary;
  }

  public static class Builder {
    private String firstName;
    private String secondName;
    private Date dateOfBirth;
    private String profession;
    private BigDecimal salary;

    public PersonDTOBuilder build() {
      return new PersonDTOBuilder(firstName, secondName, dateOfBirth, profession, salary);
    }

    public Builder firstName(String firstName) {
      this.firstName = firstName;
      return this;
    }

    public Builder secondName(String secondName) {
      this.secondName = secondName;
      return this;
    }

    public Builder dateOfBirth(Date dateOfBirth) {
      this.dateOfBirth = dateOfBirth;
      return this;
    }

    public Builder profession(String profession) {
      this.profession = profession;
      return this;
    }

    public Builder salary(BigDecimal salary) {
      this.salary = salary;
      return this;
    }
  }
}
```

With Lombok

```java
@Builder
public class PersonDTO {

  private String firstName;
  private String secondName;
  private Date dateOfBirth;
  private String profession;
  private BigDecimal salary;
  
}
```

Again this is much much shorter than writing out the builder by hand. To produce the original code shown without Lombok I actually used the Delombok feature of the Intellij plugin which converts the byte code that is generated by the Lombok annotations into actual code that you can see in the class. I did change the output slightly to what I thought looked tidy but the majority of the code was created using this feature.

To use the code generated by `@Builder` we need to write something along the lines of

```java
PersonDTO person = PersonDTO.builder()
            .firstName("Joe")
            .secondName("Blogs")
            .dateOfBirth(new Date())
            .profession("Computer Scientist")
            .salary(BigDecimal.ZERO)
            .build();
```

Configuration can be applied to the `@Builder` annotation. `builderClassName` sets the name of the generated builder class (class_name + "Builder" by default), `buildMethodName` allows you to choose the name of the `build` method (called build by default), `builderMethodName` for the builder instantiation method (builder by default) and `toBuilder` which adds a method to convert the current objects value back into a builder to be altered again.

Moving onto another annotation, lets look at `@NonNull` which is placed inside a constructor, null checks the annotated parameter and throws a `NullPointerException` if required.

Without Lombok

```java
public PersonDTO(
    String firstName, String secondName, Date dateOfBirth, String profession, BigDecimal salary) {
  if (firstName == null) {
    throw new NullPointerException("firstName");
  }
  if (secondName == null) {
    throw new NullPointerException("secondName");
  }
  if (dateOfBirth == null) {
    throw new NullPointerException("dateOfBirth");
  }
  this.firstName = firstName;
  this.secondName = secondName;
  this.dateOfBirth = dateOfBirth;
  this.profession = profession;
  this.salary = salary;
}
```

With Lombok

```java
public PersonDTO(
    @NonNull String firstName,
    @NonNull String secondName,
    @NonNull Date dateOfBirth,
    String profession,
    BigDecimal salary) {
  this.firstName = firstName;
  this.secondName = secondName;
  this.dateOfBirth = dateOfBirth;
  this.profession = profession;
  this.salary = salary;
}
```

As you can see this removes the need to write your own null check for each argument you wish to check, which as I have written a few times now makes it look tidier and saves you from writing some extra code... from now on I'm not going to mention these words anymore as I think you get the gist of it.

What if you want to use the `@AllArgsConstructor` annotation and `@NonNull` at the same time? To do this you need to add `@NonNull` onto the field declarations themselves, this will bring the side effect of null checking all Lombok generated methods that set the annotated field. So if you used `@Setter` in combination with `@NonNull` on some fields they would be checked before successfully setting the value.

Now that I have mentioned `@NonNull` we can look at `@RequiredArgsConstructor`. This annotation will only include fields in the generated constructor that need to have a value set upon initialisation. The fields it includes are marked with `final` or `@NonNull` which also incorporates a null check.

Without Lombok

```java
public class PersonDTO {

  @NonNull private String firstName;
  @NonNull private String secondName;
  @NonNull private Date dateOfBirth;
  private final String profession;
  private BigDecimal salary;

  public PersonDTO(String firstName, String secondName, Date dateOfBirth, String profession) {
    this.firstName = firstName;
    this.secondName = secondName;
    this.dateOfBirth = dateOfBirth;
    this.profession = profession;
  }
  
}
```

With Lombok

```java
@RequiredArgsConstructor
public class PersonDTO {

  @NonNull private String firstName;
  @NonNull private String secondName;
  @NonNull private Date dateOfBirth;
  private final String profession;
  private BigDecimal salary;
  
}
```

Notice that the salary field has not been marked with `final` or `@NonNull` and therefore has been exempt from the equivalent constructor in the example without Lombok.

The last annotation I will cover in this post is `@Data` which incorporates `@ToString`, `@EqualsAndHashCode`, `@Getter` on all fields, `@Setter` on all non `final` fields and `@RequiredArgsConstructor`. As all of these annotations are included in `@Data` you will lose the configuration that comes with using them separately. This isn't really a problem as you can simply add the annotation you wish to configure and it will override the `@Data` settings for that specific annotation.

```java
@Data
@ToString(includeFieldNames = true, of = {"firstName", "secondName"} )
public class PersonDTO {

  @NonNull private String firstName;
  @NonNull private String secondName;
  @NonNull private Date dateOfBirth;
  final private final String profession;
  private BigDecimal salary;
  
}
```

In this example all the incorporated annotations will be applied with the `toString` method being overridden with the parameters inside the `@ToString` annotation. I haven't put the without Lombok equivalent as I am sure you don't want to scroll down a massive code snippet again... and the components that would have made that snippet have already been covered.

That was a pretty long post and there is still plenty more that Lombok can do, for more information simply check their [documentation](https://projectlombok.org/features/). In conclusion use Lombok to remove a lot the boilerplate code that we all hate writing, giving us more time to do the fun stuff... or time to spend playing on our phones. And maybe, just maybe the word "verbose" will be used a little less to describe Java... but probably not.

If you found this post helpful, please share it and if you want to keep up with my latest posts then you can follow me on Twitter at [@LankyDanDev](https://twitter.com/LankyDanDev).