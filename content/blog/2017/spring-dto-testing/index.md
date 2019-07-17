---
title: Testing Data Transfer Objects and Rest Controllers in Spring Boot
date: "2017-03-26"
published: true
tags: [java, spring, spring boot, spring web]
cover_image: ./title-card.png
github_url: https://github.com/lankydan/spring-boot-dto-test-tutorial
include_date_in_url: true
---

In this post I will cover some tests that can be run to ensure that your DTOs (Data Transfer Objects) are being serialized and deserialized correctly leading onto testing whether they are being passed to and returned from a Rest Controller without errors.

Have a look at my previous posts, [Passing Data Transfer Objects with GET in Spring Boot](https://lankydan.dev/2017/03/11/passing-data-transfer-objects-with-get-in-spring-boot/) and [Returning Data Transfer Objects from a Rest Controller in Spring Boot](https://lankydan.dev/2017/03/19/returning-data-transfer-objects-from-rest-controller-in-spring-boot/) for information about how the DTOs are being passed to and returned from the Rest Controller. Also have a look at [Spring’s starter guide](https://spring.io/guides/gs/spring-boot/) if your starting from scratch. The setup that is not described in this post is covered there.

The Maven dependencies required in this post are

```xml
<dependencies>
  <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
  </dependency>
  <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-test</artifactId>
      <scope>test</scope>
  </dependency>
</dependencies>
```

A little bit of context before we get to the tests.

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

The controller

```java
@RestController
public class PersonRestController {

  @Autowired private ObjectMapper objectMapper;

  private static final SimpleDateFormat simpleDateFormat = new SimpleDateFormat("dd/MM/yyyy");

  @RequestMapping("/getPersonDTO")
  public PersonDTO getPersonDTO(@RequestParam(value = "personDTO") String jsonPersonDTO)
      throws IOException {
    return getPersonDTOFromJson(jsonPersonDTO);
  }

  private PersonDTO getPersonDTOFromJson(final String jsonPersonDTO) throws IOException {
    return objectMapper.setDateFormat(simpleDateFormat).readValue(jsonPersonDTO, PersonDTO.class);
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

Lets start with the simplest test.

```java
@SpringBootTest
@RunWith(SpringRunner.class)
public class PersonRestControllerTest {

  @Autowired
  private PersonRestController controller;

  @Test
  public void controllerInitializedCorrectly() {
    assertThat(controller).isNotNull();
  }
}
```

All this test does is check if the `PersonRestController` has been initialized. If it has not been loaded then it will be null when it is injected in using the `@Autowired` annotation and lead to the test failing.

The next test will check if the PersonDTO will serialize and deserialize correctly.

```java
@JsonTest
@RunWith(SpringRunner.class)
public class PersonDTOJsonTest {

  @Autowired private JacksonTester<PersonDTO> json;

  private static final SimpleDateFormat simpleDateFormat = new SimpleDateFormat(("dd/MM/yyyy"));

  private static final String FIRST_NAME = "First name";
  private static final String SECOND_NAME = "Second name";
  private static final String DATE_OF_BIRTH_STRING = "01/12/2020";
  private static final Date DATE_OF_BIRTH = parseDate(DATE_OF_BIRTH_STRING);
  private static final String PROFESSION = "Professional time waster";
  private static final BigDecimal SALARY = BigDecimal.ZERO;

  private static final String JSON_TO_DESERIALIZE =
      "{\"firstName\":\""
          + FIRST_NAME
          + "\",\"secondName\":\""
          + SECOND_NAME
          + "\",\"dateOfBirth\":\""
          + DATE_OF_BIRTH_STRING
          + "\",\"profession\":\""
          + PROFESSION
          + "\",\"salary\":"
          + SALARY
          + "}";

  private PersonDTO personDTO;

  private static Date parseDate(final String dateString) {
    try {
      return simpleDateFormat.parse(dateString);
    } catch (final ParseException e) {
      return new Date();
    }
  }

  @Before
  public void setup() throws ParseException {
    personDTO = new PersonDTO(FIRST_NAME, SECOND_NAME, DATE_OF_BIRTH, PROFESSION, SALARY);
  }

  @Test
  public void firstNameSerializes() throws IOException {
    assertThat(this.json.write(personDTO))
        .extractingJsonPathStringValue("@.firstName")
        .isEqualTo(FIRST_NAME);
  }

  @Test
  public void secondNameSerializes() throws IOException {
    assertThat(this.json.write(personDTO))
        .extractingJsonPathStringValue("@.secondName")
        .isEqualTo(SECOND_NAME);
  }

  @Test
  public void dateOfBirthSerializes() throws IOException, ParseException {
    assertThat(this.json.write(personDTO))
        .extractingJsonPathStringValue("@.dateOfBirth")
        .isEqualTo(DATE_OF_BIRTH_STRING);
  }

  @Test
  public void professionSerializes() throws IOException {
    assertThat(this.json.write(personDTO))
        .extractingJsonPathStringValue("@.profession")
        .isEqualTo(PROFESSION);
  }

  @Test
  public void salarySerializes() throws IOException {
    assertThat(this.json.write(personDTO))
        .extractingJsonPathNumberValue("@.salary")
        .isEqualTo(SALARY.intValue());
  }

  @Test
  public void firstNameDeserializes() throws IOException {
    assertThat(this.json.parseObject(JSON_TO_DESERIALIZE).getFirstName()).isEqualTo(FIRST_NAME);
  }

  @Test
  public void secondNameDeserializes() throws IOException {
    assertThat(this.json.parseObject(JSON_TO_DESERIALIZE).getSecondName()).isEqualTo(SECOND_NAME);
  }

  @Test
  public void dateOfBirthDeserializes() throws IOException {
    assertThat(this.json.parseObject(JSON_TO_DESERIALIZE).getDateOfBirth())
        .isEqualTo(DATE_OF_BIRTH);
  }

  @Test
  public void professionDeserializes() throws IOException {
    assertThat(this.json.parseObject(JSON_TO_DESERIALIZE).getProfession()).isEqualTo(PROFESSION);
  }

  @Test
  public void salaryDeserializes() throws IOException {
    assertThat(this.json.parseObject(JSON_TO_DESERIALIZE).getSalary()).isEqualTo(SALARY);
  }
}
```

Each property of the `PersonDTO` is tested for serialization and deserialization. If the serialization works correctly then you can be sure that when you pass it to rest controller in a JSON format it will be received and converted to its proper object. You also want to ensure that the DTO can be deserialized correctly so it can be used when it is returned from the rest controller.

Firstly we mark the test with the `@JsonTest` annotation, which will disable full auto-configuration and only apply configuration relevant to JSON tests. This includes initializing the `JacksonTester` which has been `@Autowired` into this test.

A closer look at one of the serialization tests.

```java
@Test
public void firstNameSerializes() throws IOException {
  assertThat(this.json.write(personDTO))
      .extractingJsonPathStringValue("@.firstName")
      .isEqualTo(FIRST_NAME);
}
```

AssertJ is used in this test as it provides useful methods for testing Spring applications. The `JacksonTester` converts the `personDTO` into JSON and then the `firstName` property is extracted from it and compared to the expected value.

Now onto a deserialization test.

```java
@Test
public void firstNameDeserializes() throws IOException {
  assertThat(this.json.parseObject(JSON_TO_DESERIALIZE).getFirstName()).isEqualTo(FIRST_NAME);
}
```

This is test is basically the opposite of the previous test but the configuration is almost the same. Instead of using `json.write` to serialize the object `json.parseObject` turns the JSON into a `PersonDTO`.

The last test in this tutorial still tests serialization and deserialization but also takes it a step further and involves the Rest Controller.

```java
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@RunWith(SpringRunner.class)
@WebMvcTest(PersonRestController.class)
public class PersonRestControllerJsonTest {

  @Autowired private MockMvc mockMvc;

  private static final String PERSON_DTO_JSON =
      "{"
          + "\"firstName\":\"First name\","
          + "\"secondName\":\"Second name\","
          + "\"dateOfBirth\":\"01/12/2020\","
          + "\"profession\":\"Professional time waster\","
          + "\"salary\":0"
          + "}";

  private static final String PERSON_DTO_REQUEST_PARAMETER = "personDTO=" + PERSON_DTO_JSON;

  private static final String PERSON_DTO_2_JSON =
      "{"
          + "\"firstName\":\"Second Person First name\","
          + "\"secondName\":\"Second Person Second name\","
          + "\"dateOfBirth\":\"11/01/2017\","
          + "\"profession\":\"Useless Person\","
          + "\"salary\":0"
          + "}";

  private static final String PERSON_DTO_2_REQUEST_PARAMETER = "personDTO2=" + PERSON_DTO_2_JSON;

  private static final String GET_PERSON_DTO_LIST_JSON_TO_RETURN =
      "[ " + PERSON_DTO_JSON + "," + PERSON_DTO_2_JSON + "]";

  private static final String GET_PEOPLE_DTO_JSON_TO_RETURN =
      "{ people:[" + PERSON_DTO_JSON + "," + PERSON_DTO_2_JSON + "]}";

  @Test
  public void getPersonDTOReturnsCorrectJson() throws Exception {
    mockMvc
        .perform(get("/getPersonDTO?" + PERSON_DTO_REQUEST_PARAMETER))
        .andExpect(status().isOk())
        .andExpect(content().json(PERSON_DTO_JSON));
  }

  @Test
  public void getPersonDTOListReturnsCorrectJson() throws Exception {
    mockMvc
        .perform(
            get(
                "/getPersonDTOList?"
                    + PERSON_DTO_REQUEST_PARAMETER
                    + "&"
                    + PERSON_DTO_2_REQUEST_PARAMETER))
        .andExpect(status().isOk())
        .andExpect(content().json(GET_PERSON_DTO_LIST_JSON_TO_RETURN));
  }

  @Test
  public void getPeopleDTOReturnsCorrectJson() throws Exception {
    mockMvc
        .perform(
            get(
                "/getPeopleDTO?"
                    + PERSON_DTO_REQUEST_PARAMETER
                    + "&"
                    + PERSON_DTO_2_REQUEST_PARAMETER))
        .andExpect(status().isOk())
        .andExpect(content().json(GET_PEOPLE_DTO_JSON_TO_RETURN));
  }
}
```

The `@WebMvcTest` annotation is used which will disable full auto-configuration and only apply configuration relevant to MVC tests including setting up the `MockMvc` used in this test. The `PersonRestController` has been marked in the annotation as it is the test subject. Using `MockMvc` provides a faster way of testing MVC controllers like the `PersonRestController` as it removes the need to fully start a HTTP server.

```java
@Test
public void getPersonDTOReturnsCorrectJson() throws Exception {
  mockMvc
      .perform(get("/getPersonDTO?" + PERSON_JSON_TO_DESERIALIZE))
      .andExpect(status().isOk())
      .andExpect(content().json(PERSON_JSON));
}
```

Each test takes in a string that represents the request that is being sent to the `PersonRestController` and then checks that the request was sent and returned successfully and that the retrieved JSON is correct. I have included some of the static imports that were used to make it a bit clearer where some of these methods are coming from.

The downside to the way I have written this test is that there is a lot of setup of fiddly strings to be used in the test cases. This problem could also be seen as a benefit as it is clear what the input is and what the output should be, but this up to preference. Therefore I have written the same test is a slightly different way and then you can decided which you prefer.

```java
@RunWith(SpringRunner.class)
@WebMvcTest(PersonRestController.class)
public class PersonRestControllerJsonTestVersion2 {

  @Autowired private MockMvc mockMvc;

  @Autowired private ObjectMapper objectMapper;

  private JacksonTester<PersonDTO> personDTOJsonTester;
  private JacksonTester<List> listJsonTester;
  private JacksonTester<PeopleDTO> peopleDTOJsonTester;

  private static final SimpleDateFormat simpleDateFormat = new SimpleDateFormat(("dd/MM/yyyy"));

  private static final String PERSON_FIRST_NAME = "First name";
  private static final String PERSON_SECOND_NAME = "Second name";
  private static final String PERSON_DATE_OF_BIRTH_STRING = "01/12/2020";
  private static final Date PERSON_DATE_OF_BIRTH = parseDate(PERSON_DATE_OF_BIRTH_STRING);
  private static final String PERSON_PROFESSION = "Professional time waster";
  private static final BigDecimal PERSON_SALARY = BigDecimal.ZERO;

  private static final String PERSON_2_FIRST_NAME = "Second Person First name";
  private static final String PERSON_2_SECOND_NAME = "Second Person Second name";
  private static final String PERSON_2_DATE_OF_BIRTH_STRING = "11/01/2017";
  private static final Date PERSON_2_DATE_OF_BIRTH = parseDate(PERSON_2_DATE_OF_BIRTH_STRING);
  private static final String PERSON_2_PROFESSION = "Useless Person";
  private static final BigDecimal PERSON_2_SALARY = BigDecimal.ZERO;

  private static Date parseDate(final String dateString) {
    try {
      return simpleDateFormat.parse(dateString);
    } catch (final ParseException e) {
      return new Date();
    }
  }

  private PersonDTO personDTO;
  private PersonDTO personDTO2;

  @Before
  public void setup() {
    JacksonTester.initFields(this, objectMapper);
    personDTO =
        new PersonDTO(
            PERSON_FIRST_NAME,
            PERSON_SECOND_NAME,
            PERSON_DATE_OF_BIRTH,
            PERSON_PROFESSION,
            PERSON_SALARY);
    personDTO2 =
        new PersonDTO(
            PERSON_2_FIRST_NAME,
            PERSON_2_SECOND_NAME,
            PERSON_2_DATE_OF_BIRTH,
            PERSON_2_PROFESSION,
            PERSON_2_SALARY);
  }

  @Test
  public void getPersonDTOReturnsCorrectJson() throws Exception {
    final String personDTOJson = personDTOJsonTester.write(personDTO).getJson();
    final String personDTORequestParameter = "personDTO=" + personDTOJson;
    final String outputJson = personDTOJson;
    mockMvc
        .perform(get("/getPersonDTO?" + personDTORequestParameter))
        .andExpect(status().isOk())
        .andExpect(content().json(outputJson));
  }

  @Test
  public void getPersonDTOListReturnsCorrectJson() throws Exception {
    final String personDTORequestParameter =
        "personDTO=" + personDTOJsonTester.write(personDTO).getJson();
    final String personDTO2RequestParameter =
        "personDTO2=" + personDTOJsonTester.write(personDTO2).getJson();
    final String outputJson = listJsonTester.write(Arrays.asList(personDTO, personDTO2)).getJson();
    mockMvc
        .perform(
            get(
                "/getPersonDTOList?"
                    + personDTORequestParameter
                    + "&"
                    + personDTO2RequestParameter))
        .andExpect(status().isOk())
        .andExpect(content().json(outputJson));
  }

  @Test
  public void getPeopleDTOReturnsCorrectJson() throws Exception {
    final String personDTORequestParameter =
        "personDTO=" + personDTOJsonTester.write(personDTO).getJson();
    final String personDTO2RequestParameter =
        "personDTO2=" + personDTOJsonTester.write(personDTO2).getJson();
    final String outputJson =
        peopleDTOJsonTester.write(new PeopleDTO(Arrays.asList(personDTO, personDTO2))).getJson();
    mockMvc
        .perform(
            get("/getPeopleDTO?" + personDTORequestParameter + "&" + personDTO2RequestParameter))
        .andExpect(status().isOk())
        .andExpect(content().json(outputJson));
  }
}
```

This version removes the need to setting up the JSON strings by using `JacksonTester` to convert objects to JSON. Setting up this test is a bit nicer as you do not need to write all JSON strings which might have errors in them, such as missing a single speech mark or square bracket. Although I believe this also has the disadvantage of being less clear as you cannot see what the JSON strings are as it has been abstracted away by the `JacksonTester`.

A few things about the code setup of the second version. As the `@WebMvcTest` annotation is being used the `@JsonTest` that was used earlier cannot be applied. This prevents the `JacksonTester` from being injected into the test using `@Autowired`. Therefore to set it up

```java
JacksonTester.initFields(this, objectMapper);
```

was added to the `@Before` method which runs at the start of each test method. If both `@WebMvcTest` and `@JsonTest` are added at the same time the test will fail to run.

In conclusion this tutorial has gone through a few methods that can be used to test Data Transfer Objects and Rest Controllers in Spring Boot to help ensure that your application is running correctly and removes the need for you to manually test every single case yourself.

The code used in this post can be found on my [GitHub](https://github.com/lankydan/spring-boot-dto-test-tutorial).