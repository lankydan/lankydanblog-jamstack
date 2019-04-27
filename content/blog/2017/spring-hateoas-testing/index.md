---
title: Testing a HATEOAS service
date: "2017-09-18"
published: true
tags: [spring, testing, hateoas, spring boot, java, spring hateoas, spring rest]
canonical_url: https://lankydanblog.com/2017/09/18/testing-a-hateoas-service/
cover_image: ./arches.jpg
include_date_in_url: true
github_url: https://github.com/lankydan/spring-boot-hateoas
---

This post is a follow up post to a few that I have written recently relating to writing a HATEOAS service and handling exceptions with Spring ([Applying HATEOAS to a REST API with Spring Boot](https://lankydanblog.com/2017/09/10/applying-hateoas-to-a-rest-api-with-spring-boot/) and [Global exception handling with @ControllerAdvice](https://lankydanblog.com/2017/09/12/global-exception-handling-with-controlleradvice/)). Now that we have looked through setting up a service and how to add some error handling via controller advice, it's probably now worth writing some tests to ensure that it works as expected.

There are a few extra dependencies that need to be added to allow the tests to be written. I have excluded the dependencies for setting up the HATEOAS service as they can be found in the previous post [here](https://lankydanblog.com/2017/09/10/applying-hateoas-to-a-rest-api-with-spring-boot/). `spring-boot-starter-test` is the default requirement for most tests when using Spring Boot and `hamcrest-core` allows us to assert the JSON returned in responses more easily.

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-test</artifactId>
  <scope>test</scope>
</dependency>
<dependency>
  <groupId>org.hamcrest</groupId>
  <artifactId>hamcrest-core</artifactId>
  <version>1.3</version>
  <scope>test</scope>
</dependency>
```

Before we look at the test itself, lets have a look at the code that we are trying to test. The short story of the example below is that it is a HATEOAS service which returns a response that can contain an object plus links to relevant resources. For more information about what is going on refer to the previous post mentioned earlier (added again [here](https://lankydanblog.com/2017/09/10/applying-hateoas-to-a-rest-api-with-spring-boot/) if you still need to look at it).

```java
@RestController
@RequestMapping(value = "/people", produces = "application/hal+json")
public class PersonController {

  final PersonRepository personRepository;

  public PersonController(final PersonRepository personRepository) {
    this.personRepository = personRepository;
  }

  @GetMapping
  public ResponseEntity<Resources<PersonResource>> all() {
    final List<PersonResource> collection =
        personRepository.findAll().stream().map(PersonResource::new).collect(Collectors.toList());
    final Resources<PersonResource> resources = new Resources<>(collection);
    final String uriString = ServletUriComponentsBuilder.fromCurrentRequest().build().toUriString();
    resources.add(new Link(uriString, "self"));
    return ResponseEntity.ok(resources);
  }

  @GetMapping("/{id}")
  public ResponseEntity<PersonResource> get(@PathVariable final long id) {
    return personRepository
        .findById(id)
        .map(p -> ResponseEntity.ok(new PersonResource(p)))
        .orElseThrow(() -> new PersonNotFoundException(id));
  }

  @PostMapping
  public ResponseEntity<PersonResource> post(@RequestBody final Person personFromRequest) {
    final Person person = new Person(personFromRequest);
    personRepository.save(person);
    final URI uri =
        MvcUriComponentsBuilder.fromController(getClass())
            .path("/{id}")
            .buildAndExpand(person.getId())
            .toUri();
    return ResponseEntity.created(uri).body(new PersonResource(person));
  }

  @PutMapping("/{id}")
  public ResponseEntity<PersonResource> put(
      @PathVariable("id") final long id, @RequestBody Person personFromRequest) {
    final Person person = new Person(personFromRequest, id);
    personRepository.save(person);
    final PersonResource resource = new PersonResource(person);
    final URI uri = ServletUriComponentsBuilder.fromCurrentRequest().build().toUri();
    return ResponseEntity.created(uri).body(resource);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<?> delete(@PathVariable("id") final long id) {
    return personRepository
        .findById(id)
        .map(
            p -> {
              personRepository.deleteById(id);
              return ResponseEntity.noContent().build();
            })
        .orElseThrow(() -> new PersonNotFoundException(id));
  }
}
```

Now we can write the test code.

```java
@RunWith(SpringRunner.class)
@WebMvcTest(PersonController.class)
public class PersonControllerTest {

  // Taken out due to configuring mockMvc manually before tests
  //  @Autowired
  private MockMvc mockMvc;

  @Autowired private ObjectMapper mapper;

  @MockBean private PersonRepository personRepository;

  private static final DateTimeFormatter formatter =
      DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

  // http://localhost path added because the href's returned contain localhost in their strings
  private static String BASE_PATH = "http://localhost/people";
  private static String MEMBERSHIPS_PATH = "/memberships";
  private static final long ID = 1;
  private Person person;

  @Before
  public void setup() {
    // Added so @ControllerAdvice could be added to test exception handling.
    mockMvc =
        MockMvcBuilders.standaloneSetup(new PersonController(personRepository))
            .setControllerAdvice(new PersonControllerAdvice())
            .build();
    setupPerson();
  }

  private void setupPerson() {
    person = new Person();
    person.setId(ID);
    person.setFirstName("first");
    person.setSecondName("second");
    person.setDateOfBirth(LocalDateTime.now());
    person.setProfession("developer");
    person.setSalary(0);
  }

  @Test
  public void getReturnsCorrectResponse() throws Exception {
    given(personRepository.findById(ID)).willReturn(Optional.of(person));
    final ResultActions result = mockMvc.perform(get(BASE_PATH + "/" + ID));
    result.andExpect(status().isOk());
    verifyJson(result);
  }

  private void verifyJson(final ResultActions action) throws Exception {
    action
        .andExpect(jsonPath("person.id", is(person.getId().intValue())))
        .andExpect(jsonPath("person.firstName", is(person.getFirstName())))
        .andExpect(jsonPath("person.secondName", is(person.getSecondName())))
        .andExpect(jsonPath("person.dateOfBirth", is(person.getDateOfBirth().format(formatter))))
        .andExpect(jsonPath("person.profession", is(person.getProfession())))
        .andExpect(jsonPath("person.salary", is(person.getSalary())))
        .andExpect(jsonPath("links[0].rel", is("people")))
        .andExpect(jsonPath("links[0].href", is(BASE_PATH)))
        .andExpect(jsonPath("links[1].rel", is("memberships")))
        .andExpect(jsonPath("links[1].href", is(BASE_PATH + "/" + ID + MEMBERSHIPS_PATH)))
        .andExpect(jsonPath("links[2].rel", is("self")))
        .andExpect(jsonPath("links[2].href", is(BASE_PATH + "/" + ID)));
  }

  @Test
  public void allReturnsCorrectResponse() throws Exception {
    given(personRepository.findAll()).willReturn(Arrays.asList(person));
    final ResultActions result = mockMvc.perform(get(BASE_PATH));
    result.andExpect(status().isOk());
    result
        .andExpect(jsonPath("links[0].rel", is("self")))
        .andExpect(jsonPath("links[0].href", is(BASE_PATH)))
        .andExpect(jsonPath("content[0].person.id", is(person.getId().intValue())))
        .andExpect(jsonPath("content[0].person.id", is(person.getId().intValue())))
        .andExpect(jsonPath("content[0].person.firstName", is(person.getFirstName())))
        .andExpect(jsonPath("content[0].person.secondName", is(person.getSecondName())))
        .andExpect(
            jsonPath(
                "content[0].person.dateOfBirth", is(person.getDateOfBirth().format(formatter))))
        .andExpect(jsonPath("content[0].person.profession", is(person.getProfession())))
        .andExpect(jsonPath("content[0].person.salary", is(person.getSalary())))
        .andExpect(jsonPath("content[0].links[0].rel", is("people")))
        .andExpect(jsonPath("content[0].links[0].href", is(BASE_PATH)))
        .andExpect(jsonPath("content[0].links[1].rel", is("memberships")))
        .andExpect(
            jsonPath("content[0].links[1].href", is(BASE_PATH + "/" + ID + MEMBERSHIPS_PATH)))
        .andExpect(jsonPath("content[0].links[2].rel", is("self")))
        .andExpect(jsonPath("content[0].links[2].href", is(BASE_PATH + "/" + ID)));
  }

  @Test
  public void postReturnsCorrectResponse() throws Exception {
    given(personRepository.save(any(Person.class))).willReturn(person);
    final ResultActions result =
        mockMvc.perform(
            post(BASE_PATH)
                .content(mapper.writeValueAsBytes(person))
                .contentType(MediaType.APPLICATION_JSON_UTF8));
    result.andExpect(status().isCreated());
    verifyJson(result);
  }

  @Test
  public void putReturnsCorrectResponse() throws Exception {
    given(personRepository.save(any(Person.class))).willReturn(person);
    final ResultActions result =
        mockMvc.perform(
            put(BASE_PATH + "/" + ID)
                .content(mapper.writeValueAsBytes(person))
                .contentType(MediaType.APPLICATION_JSON_UTF8));
    result.andExpect(status().isCreated());
    verifyJson(result);
  }

  @Test
  public void deleteReturnsCorrectResponse() throws Exception {
    given(personRepository.findById(ID)).willReturn(Optional.of(person));
    mockMvc
        .perform(delete(BASE_PATH + "/" + ID))
        .andExpect(status().isNoContent())
        .andExpect(content().string(""));
  }

  // Equivalent tests for PUT and DELETE could be made to test handling of same error
  @Test
  public void getPersonThatDoesNotExistReturnsError() throws Exception {
    final PersonNotFoundException exception = new PersonNotFoundException(ID);
    given(personRepository.findById(ID)).willReturn(Optional.empty());
    final ResultActions result = mockMvc.perform(get(BASE_PATH + "/" + ID));
    result.andExpect(status().isNotFound());
    result
        .andExpect(jsonPath("$[0].logref", is(String.valueOf(ID))))
        .andExpect(jsonPath("$[0].message", is(exception.getMessage())))
        .andExpect(jsonPath("$[0].links", is(new ArrayList<String>())));
  }
}
```

There are a few comments scattered throughout the test above, but lets have a proper look into it. Firstly we have some of the general setup. The `SpringRunner` is used and `@WebMvcTest` marks the controller that is being tested. `@MockBean` allows the `PersonRepository` to be mocked out as is not important to this specific test and `ObjectMapper` allows you to convert objects into JSON so that they can be passed to the controller as if you were manually testing it yourself. `MockMvc` is used to send requests to the controller being tested (the controller is spun up at the start of the test) and the response of the call can be asserted to assure that the code is running correctly.

There are a lot of static methods in this example which have been statically imported to make the code look tidier, unfortunately this can make it a little unclear where they are coming from, another version of the code with imports can be found [here](https://gist.github.com/lankydan/52ac882ac981f437c7406c4410c5d33a).

Below I have taken a snippet of the code in the test to focus on.

```java
@Test
public void getReturnsCorrectResponse() throws Exception {
  given(personRepository.findById(ID)).willReturn(Optional.of(person));
  final ResultActions result = mockMvc.perform(get(BASE_PATH + "/" + ID));
  result.andExpect(status().isOk());
  verifyJson(result);
}

private void verifyJson(final ResultActions action) throws Exception {
  action
      .andExpect(jsonPath("person.id", is(person.getId().intValue())))
      .andExpect(jsonPath("person.firstName", is(person.getFirstName())))
      .andExpect(jsonPath("person.secondName", is(person.getSecondName())))
      .andExpect(jsonPath("person.dateOfBirth", is(person.getDateOfBirth().format(formatter))))
      .andExpect(jsonPath("person.profession", is(person.getProfession())))
      .andExpect(jsonPath("person.salary", is(person.getSalary())))
      .andExpect(jsonPath("links[0].rel", is("people")))
      .andExpect(jsonPath("links[0].href", is(BASE_PATH)))
      .andExpect(jsonPath("links[1].rel", is("memberships")))
      .andExpect(jsonPath("links[1].href", is(BASE_PATH + "/" + ID + MEMBERSHIPS_PATH)))
      .andExpect(jsonPath("links[2].rel", is("self")))
      .andExpect(jsonPath("links[2].href", is(BASE_PATH + "/" + ID)));
}
```

Here we have a test which is checking if the JSON returned from a GET request is correct. The first line of the test mocks out the `findById` repository method and returns the person that was created in the setup method. The following line sends the request. `get` specifies the type of request and the string or URI passed into it tells it where to send the call to. Due to a lot of reused code I decided to split a large chunk of the assertion code out into a separate method. As I decided to split this code out the response has been stored in the `ResultActions` object where it is then checked that it's response code was `200 OK` and then `verifyJson` goes on to ensure the JSON is correct.

The `jsonPath` method is very handy, allowing you to check the JSON one property at a time. The `is` method comes from the `hamcrest-core` dependency and when used in conjunction with `jsonPath` makes for a very tidy way of checking the correctness of the returned JSON. If you decided to not to do it this way, you might need to store a long string to represent the JSON and basically compare two strings together, I can personally tell you that doing it this way is a tad annoying. Below is the JSON returned when the test is ran and we can use this to provide a very brief explanation into how `jsonPath` works.

```json
{  
  "person":{  
    "id":1,
    "firstName":"first",
    "secondName":"second",
    "dateOfBirth":"16/09/2017 18:01",
    "profession":"developer",
    "salary":0
  },
  "links":[  
    {  
      "rel":"people",
      "href":"http://localhost/people"
    },
    {  
      "rel":"memberships",
      "href":"http://localhost/people/1/memberships"
    },
    {  
      "rel":"self",
      "href":"http://localhost/people/1"
    }
  ]
}
```

Separate a line for closer inspection.

```java
.andExpect(jsonPath("person.firstName", is(person.getFirstName())))
```

So this is saying does the `firstName` property of the `Person` object (named `person`) have the value of `person.getFirstName`, if so then this line passes.

And a slightly different example.

```java
.andExpect(jsonPath("links[0].rel", is("people")))
.andExpect(jsonPath("links[0].href", is(BASE_PATH)))
```

Due to `links` being an array you need to retrieve values from it as such. Therefore this snippet says; get the first object in the `links` array, get the property `rel` and `href` and check their values. These links are what are included due to it being a HATEOAS service. The code above is repeated for the remaining links. If you have noticed the URI's included in the response include "localhost" etc and therefore the string it is being compared to needs to also needs to contain it. The reason I mention this is because the URI passed into the `get` method (or any of the other verbs) do not need to receive a whole URI and therefore can take in `/people/1` instead of `http://localhost/people/1`. But if you tried to do the same inside of the `is`&nbsp;methods they would fail instead. Just something I think is worth looking out for as it might trip you up if you are not careful.

Next we will look at another test snippet which focuses on the response returned when an exception is thrown. Due to the exception being handled in `PersonControllerAdvice` some extra configuration needs to be applied (which caused some weird things to happen which I'll get into later).

PersonControllerAdvice

```java
@ControllerAdvice
@RequestMapping(produces = "application/vnd.error+json")
public class PersonControllerAdvice extends ResponseEntityExceptionHandler {

  @ExceptionHandler(PersonNotFoundException.class)
  public ResponseEntity<VndErrors> notFoundException(final PersonNotFoundException e) {
    return error(e, HttpStatus.NOT_FOUND, e.getId().toString());
  }

  private ResponseEntity<VndErrors> error(
      final Exception exception, final HttpStatus httpStatus, final String logRef) {
    final String message =
        Optional.of(exception.getMessage()).orElse(exception.getClass().getSimpleName());
    return new ResponseEntity<>(new VndErrors(logRef, message), httpStatus);
  }
}
```

The test case

```java
@Test
public void getPersonThatDoesNotExistReturnsError() throws Exception {
  final PersonNotFoundException exception = new PersonNotFoundException(ID);
  given(personRepository.findById(ID)).willReturn(Optional.empty());
  final ResultActions result = mockMvc.perform(get(BASE_PATH + "/" + ID));
  result.andExpect(status().isNotFound());
  result
      .andExpect(jsonPath("$[0].logref", is(String.valueOf(ID))))
      .andExpect(jsonPath("$[0].message", is(exception.getMessage())))
      .andExpect(jsonPath("$[0].links", is(new ArrayList<String>())));
}
```

This time round the mocked repository method will return `Optional.empty` which in turn causes a exception to be thrown inside the controller's GET method. If everything is setup correctly, this exception is handled by the `@ExceptionHandler` inside of `PersonControllerAdvice`, converted into a `ResponseEntity` and returned. Below is the JSON included in the response.

```json
[
  {
    "logref": "1",
    "message": "Person could not be found with id: 1",
    "links": []
  }
]
```

It is then checked in the same way all the other tests are. The `$[0]` represents first value of the unnamed array.

Oh, I should probably go over that configuration I mentioned a minute ago as well. The `mockMvc` object needs to be setup to allow classes annotated with `@ControllerAdvice` to be used (in this case `PersonControllerAdvice`). If you do not require this extra configuration (or the others available) then just injecting in `MockMvc` with `@Autowired` will suffice. `setControllerAdvice` can take in an array of objects allowing you to enable multiple `@ControllerAdvice` classes to use with your test.

```java
mockMvc = MockMvcBuilders.standaloneSetup(new PersonController(personRepository))
            .setControllerAdvice(new PersonControllerAdvice())
            .build();
```

I also mentioned that some weird things happened when I added this configuration. Depending on whether I setup `mockMvc` manually using the snippet above or injected it using `@Autowired` the JSON returned in the response would differ slightly. This lead to the JSON returned in the test being different from the output of manual testing, which is not the best outcome for a test. Below is the JSON with the manual configured `mockMvc` followed by the injected version.

With configuration

```json
{  
  "person":{  
    "id":1,
    "firstName":"first",
    "secondName":"second",
    "dateOfBirth":"16/09/2017 18:01",
    "profession":"developer",
    "salary":0
  },
  "links":[  
    {  
      "rel":"people",
      "href":"http://localhost/people"
    },
    {  
      "rel":"memberships",
      "href":"http://localhost/people/1/memberships"
    },
    {  
      "rel":"self",
      "href":"http://localhost/people/1"
    }
  ]
}
```

By injection

```json
{
  "person": {
    "id": 1,
    "firstName": "first",
    "secondName": "second",
    "dateOfBirth":"16/09/2017 18:01",
    "profession": "developer",
    "salary": 0
  },
  "_links": {
    "people": {
      "href": "http://localhost/people"
    },
    "memberships": {
      "href": "http://localhost/people/1/memberships"
    },
    "self": {
      "href": "http://localhost/people/1"
    }
  }
}
```

As you can see, the difference lies in the JSON representing the links. Where in one version it is an array called `links` and in the other it is an object called `_links` with properties representing each link.

The correct code to test the JSON from the second snippet is as follows. Note the difference in the path passed into `jsonPath` due to it being an object instead of an array.

```java
private void verifyJson(final ResultActions action) throws Exception {
  action
      .andExpect(jsonPath("person.id", is(person.getId().intValue())))
      .andExpect(jsonPath("person.firstName", is(person.getFirstName())))
      .andExpect(jsonPath("person.secondName", is(person.getSecondName())))
      .andExpect(jsonPath("person.dateOfBirth", is(person.getDateOfBirth().format(formatter))))
      .andExpect(jsonPath("person.profession", is(person.getProfession())))
      .andExpect(jsonPath("person.salary", is(person.getSalary())))
      .andExpect(jsonPath("_links.people.href", is(BASE_PATH)))
      .andExpect(jsonPath("_links.memberships.href", is(BASE_PATH + "/" + ID + MEMBERSHIPS_PATH)))
      .andExpect(jsonPath("_links.self.href", is(BASE_PATH + "/" + ID)));
}
```

Personally I have not tried to look into the code that could cause this and therefore do not know whether it is a bug/oversight, or if I did something wrong myself... Either way it is worth knowing that this could happen.

Unfortunately this left my test output looking different to my production code, a possible solution for my scenario is splitting the test into separate classes where one uses an injected `mockMvc` and the other tests the exception handling with the configured `mockMvc`. This should allow the JSON to match the output of the production code in more situations.

In conclusion, writing tests for a HATEAOS service is not very different from testing a REST API and just requires a few more asserts to ensure that the links are returned correctly. We also had a brief look at using `jsonPath` to help make verifying the output JSON easier and how we can configure the test to allow for error handling to be checked when a `@ControllerAdvice` class is used.

The code used in this post can be found on my [GitHub](https://github.com/lankydan/spring-boot-hateoas).

If you found this post helpful, please share it and if you want to keep up with my latest posts then you can follow me on Twitter at [@LankyDanDev](https://twitter.com/LankyDanDev).