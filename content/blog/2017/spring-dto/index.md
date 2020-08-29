---
title: Returning Data Transfer Objects from a Rest Controller in Spring Boot
date: "2017-03-19"
published: true
tags: [java, spring, spring boot, spring web]
github_url: https://github.com/lankydan/spring-boot-dto-tutorial-2
include_date_in_url: true
cover_image: blog-card.png
---

In this post I will cover returning a DTO (Data Transfer Object) from a Rest Controller in Spring Boot. Returning data from a REST call in a DTO is a tidy way of retrieving data from the server which otherwise would be returned as a `List<Object>`.

Have a look at my previous post, [Passing Data Transfer Objects with GET in Spring Boot](https://lankydan.dev/2017/03/11/passing-data-transfer-objects-with-get-in-spring-boot/) for information about how the DTOs are being passed to the Rest Controller. Also have a look at [Spring’s starter guide](https://spring.io/guides/gs/spring-boot/) if your starting from scratch. The setup that is not described in this post is covered there.

The only Maven dependency required in this post is

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
</dependencies>
```

The DTO

```java
public class PersonDTO {

  private String firstName;
  private String secondName;
  // Formats output date when this DTO is passed through JSON
  @JsonFormat(pattern = "dd/MM/yyyy")
  // Allows dd/MM/yyyy date to be passed into GET request in JSON
  @DateTimeFormat(pattern = "dd/MM/yyyy")
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

A few things to notice

```java
@JsonFormat(pattern = "dd/MM/yyyy")
```

Formats the date when the DTO is output to JSON. If this is not used the JSON will display a number that represents the time instead of a easy to read string.

```java
@DateTimeFormat(pattern = "dd/MM/yyyy")
```

This works the other way around as it allows the date to be input in `dd/MM/yyyy` format, which if your trying to pass a date directly into JSON it will be hard to know the number version of the date you want.

Also remember to include your default constructor, getters and setters otherwise serializing and deserializing of the DTO will not work.

The controller

```java
@RestController
public class PersonRestController {

  private static final SimpleDateFormat simpleDateFormat = new SimpleDateFormat("dd/MM/yyyy");

  @RequestMapping("/getPersonDTO")
  public PersonDTO getPersonDTO(@RequestParam(value = "personDTO") String jsonPersonDTO)
      throws IOException {
    return getPersonDTOFromJson(jsonPersonDTO);
  }

  private PersonDTO getPersonDTOFromJson(final String jsonPersonDTO) throws IOException {
    return new ObjectMapper()
        .setDateFormat(simpleDateFormat)
        .readValue(jsonPersonDTO, PersonDTO.class);
  }

  @RequestMapping("/getPersonDTOList")
  public List<PersonDTO> getPersonDTOList(
      @RequestParam(value = "personDTO") String jsonPersonDTO,
      @RequestParam(value = "personDTO2") String jsonPersonDTO2)
      throws IOException {
    final PersonDTO personDTO = getPersonDTOFromJson(jsonPersonDTO);
    final PersonDTO personDTO2 = getPersonDTOFromJson(jsonPersonDTO2);
    return Arrays.asList(personDTO, personDTO2);
  }
  
  @RequestMapping("/getPeopleDTO")
  public PeopleDTO getPeopleDTO(
      @RequestParam(value = "personDTO") String jsonPersonDTO,
      @RequestParam(value = "personDTO2") String jsonPersonDTO2)
      throws IOException {
    final PersonDTO personDTO = getPersonDTOFromJson(jsonPersonDTO);
    final PersonDTO personDTO2 = getPersonDTOFromJson(jsonPersonDTO2);
    return new PeopleDTO(Arrays.asList(personDTO, personDTO2));
  }
}
```

Each of these methods are returning DTOs but in slightly different ways. The nice thing about reaching this point is that all the configuration for returning a `PersonDTO` has already been done and there is nothing fancy that needs to be done now.

Lets look at each method individually.

```java
@RequestMapping("/getPersonDTO")
public PersonDTO getPersonDTO(@RequestParam(value = "personDTO") String jsonPersonDTO)
    throws IOException {
  return getPersonDTOFromJson(jsonPersonDTO);
}
```

Nothing interesting happens in this code. The input `personDTO` from the request is parsed into a `PersonDTO` object and returned. As I mentioned above all the setup for returning the `PersonDTO` has already been done due to the code added to it's class. This includes the getters and setters and the `@JsonFormat` which allows it to be returned with its values and have the date field formatted nicely.

So if we pass a request to to the controller (I used [Postman](https://www.getpostman.com/) to do this) we can see what happens.

```
localhost:8080/getPersonDTO?personDTO={"firstName":"First name","secondName":"Second name","profession":"Professional time waster","salary":0,"dateOfBirth":"01/012/2020"}
```

Which outputs the following JSON that represents the `PersonDTO`.

```json
{
 "firstName": "First name",
 "secondName": "Second name",
 "dateOfBirth": "01/12/2020",
 "profession": "Professional time waster",
 "salary": 0
}
```

Notice that the `dateOfBirth` data is a string formatted to `dd/MM/yyyy` due to the `@JsonFormat` that was added to the field in the `PersonDTO`.

Does anything interesting happen if we try to return a `List<PersonDTO>`? Lets have a look.

```java
@RequestMapping("/getPersonDTOList")
public List<PersonDTO> getPersonDTOList(
    @RequestParam(value = "personDTO") String jsonPersonDTO,
    @RequestParam(value = "personDTO2") String jsonPersonDTO2)
    throws IOException {
  final PersonDTO personDTO = getPersonDTOFromJson(jsonPersonDTO);
  final PersonDTO personDTO2 = getPersonDTOFromJson(jsonPersonDTO2);
  return Arrays.asList(personDTO, personDTO2);
}
```

Called with the request.

```
localhost:8080/getPersonDTOList?personDTO={
  "firstName":"First name",
  "secondName":"Second name",
  "profession":"Professional time waster",
  "salary":0,
  "dateOfBirth":"01/12/2020"
}
&personDTO2={
  "firstName":"Random first name",
  "secondName":"Random second name",
  "profession":"Professional sleeper",
  "salary":123,
  "dateOfBirth":"11/12/2100"
}
```

Which leads leads to the JSON output.

```json
[
 {
  "firstName": "First name",
  "secondName": "Second name",
  "dateOfBirth": "01/12/2020",
  "profession": "Professional time waster",
  "salary": 0
 },
 {
  "firstName": "Random first name",
  "secondName": "Random second name",
  "dateOfBirth": "11/12/2100",
  "profession": "Professional sleeper",
  "salary": 123
 }
]
```

As you can see from the output each `PersonDTO` is contained within the square brackets that represent the list in JSON. So did anything interesting happen in the code or the return data? Nope, still nice a simple.

The last example is slightly different from first looks but it is pretty much the same as returning the `List<PersonDTO>`.

```java
public class PeopleDTO {

  private List<PersonDTO> people;

  public PeopleDTO() {}

  public PeopleDTO(List<PersonDTO> people) {
    this.people = people;
  }

  public List<PersonDTO> getPeople() {
    return people;
  }

  public void setPeople() {
    this.people = people;
  }
}
```

Now that you have seen the `PeopleDTO` code your understand why is so similar to the previous example as it is just an object that contains a `List<PersonDTO>`. You might prefer to return this DTO rather than a `List<PersonDTO>` but I wont make that decision for you.

Lets look at the controller code.

```java
@RequestMapping("/getPeopleDTO")
public PeopleDTO getPeopleDTO(
    @RequestParam(value = "personDTO") String jsonPersonDTO,
    @RequestParam(value = "personDTO2") String jsonPersonDTO2)
    throws IOException {
  final PersonDTO personDTO = getPersonDTOFromJson(jsonPersonDTO);
  final PersonDTO personDTO2 = getPersonDTOFromJson(jsonPersonDTO2);
  return new PeopleDTO(Arrays.asList(personDTO, personDTO2));
}
```

Send it the request.

```
localhost:8080/getPeopleDTO?personDTO={
  "firstName":"First name",
  "secondName":"Second name",
  "profession":"Professional time waster",
  "salary":0,"dateOfBirth":"01/12/2020"
}
&personDTO2={
  "firstName":"Random first name",
  "secondName":"Random second name",
  "profession":"Professional sleeper",
  "salary":123,
  "dateOfBirth":"11/12/2100"
}
```

And retrieve the JSON output.

```json
{
 "people": [
  {
   "firstName": "First name",
   "secondName": "Second name",
   "dateOfBirth": "01/12/2020",
   "profession": "Professional time waster",
   "salary": 0
  },
  {
   "firstName": "Random first name",
   "secondName": "Random second name",
   "dateOfBirth": "11/12/2100",
   "profession": "Professional sleeper",
   "salary": 123
  }
 ]
}
```

Yet again the code required to set this up is pretty simple. Other than creating the `PeopleDTO` to store the `List<PersonDTO>` nothing else in the code has changed. The JSON output is slightly different from the previous example as the list is now tied to the `people` property.

So what did you learn from reading this post? Not much actually as returning a data transfer object from a Rest Controller is actually pretty straight forward. Simply set up your DTO correctly with a default constructor, getters and setters and maybe add some annotations if your feeling more sophisticated, after that there's not really anything left to do.

The code used in this post can be found on my [GitHub](https://github.com/lankydan/spring-boot-dto-tutorial-2).