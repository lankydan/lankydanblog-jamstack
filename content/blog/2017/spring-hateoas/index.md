---
title: Applying HATEOAS to a REST API with Spring Boot
date: "2017-09-10"
published: true
tags: [spring, spring boot, java, spring web, controlleradvice, exception handling, spring hateoas, hateoas]
cover_image: ./spring-hateoas.png
include_date_in_url: true
github_url: https://github.com/lankydan/spring-boot-hateoas
---

HATEOAS is an acronym for <strong> H</strong>ypermedia <strong> A</strong>s <strong> T</strong>he <strong> E</strong>ngine <strong> O</strong>f <strong> A</strong>pplication <strong> S</strong>tate. Even after expanding that for you it still might not mean a lot. HATEOAS is an extra level upon REST and is used to present information about the REST API to the client, allowing for a better understanding of the API without the need to bring up the specification or documentation. This is done by including links in a returned response and using only these links to further communicate with the sever. This reduces the likely hood of the client breaking due to changes to the service. If there are some static endpoints that the client can make use of and further calls are done via the links included in the response, the client's code should not break (I am not claiming it is 100% safe). This makes the assumption that the links returned with the response have already implemented the standard REST verbs, lets face it, it would be pretty silly to link to an endpoint that isn't actually there. This post will go through how to implement HATEOAS Rest service using Spring Boot.

As always lets start out by looking at the dependencies that are required (Lombok + MySQL dependencies have been used but not shown below). `spring-boot-starter-hateoas` contains the `spring-boot-starter-web` dependency so you do not need to include that like you probably would when creating a REST API with Spring Boot.

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-hateoas</artifactId>
</dependency>
```

It is also worth noting that `spring-boot-starter-parent` version `2.0.0.M3` has been used in this post.

Now that we have got the dependencies out of the way, I think the first piece of code we should look at is a cut down version of a rest controller that has implemented HATEOAS.

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
    // GET all
  }

  @GetMapping("/{id}")
  public ResponseEntity<PersonResource> get(@PathVariable final long id) {
    // GET
  }

  @PostMapping
  public ResponseEntity<PersonResource> post(@RequestBody final Person personFromRequest) {
    // POST
  }

  @PutMapping("/{id}")
  public ResponseEntity<PersonResource> put(
      @PathVariable("id") final long id, @RequestBody Person personFromRequest) {
    // PUT
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<?> delete(@PathVariable("id") final long id) {
    // DELETE
  }
}
```

The reason I cut out a lot of the code in this example is so we can look at individual parts without to much noise. So what have we got above? A basic REST service with the rest verbs `GET`, `POST`, `PUT` and `DELETE` implemented along with a retrieve all method. Each endpoint returns a `ResponseEntity` with most of them (not `DELETE`) containing a `PersonResource` / `Resources<PersonResource>`. This is where the HATEOAS service differentiates from the standard REST service which would normally return the `ResponseEntity` containing the object (or the object directly) instead of this resource object. In this scenario it returns `ResponseEntity<PersonResource>` (HATEOAS) instead of `ResponseEntity<Person>` (REST).

So what is this resource object I keep mentioning? It is simply a wrapper that contains both the object you would normally return plus URIs (links) to related endpoints that can be used. One way to make this seem a bit clearer is that the `PersonResource` shown in the above example could also be written as `Resource<Person>` where `Person` is the object you would normally return. Below is JSON would be returned from a `GET` request to a standard REST service followed by the output of a HATEOAS service for the same call.

```
CURL localhost:8090/people/1
```

REST service

```json
{
  "id": 1,
  "firstName": "test",
  "secondName": "one",
  "dateOfBirth": "01/01/0001 01:10",
  "profession": "im a test",
  "salary": 0
}
```

HATEOAS serivce

```json
{
  "person": {
    "id": 1,
    "firstName": "test",
    "secondName": "one",
    "dateOfBirth": "01/01/0001 01:10",
    "profession": "im a test",
    "salary": 0
  },
  "_links": {
    "people": {
      "href": "http://localhost:8090/people"
    },
    "memberships": {
      "href": "http://localhost:8090/people/1/memberships"
    },
    "self": {
      "href": "http://localhost:8090/people/1"
    }
  }
}
```

As you can see there is a lot more going on in the HATEOAS response due to all the links that have been included. The URIs in this example might not be the most useful, but should hopefully demonstrate the idea well enough. From the original request that was made you have links showing where to retrieve all people and all the memberships for this person and finally a "self" link pointing back to the request that was just made. Now that we have a better idea of what the resource object is we can have a look at how `PersonResource` is implemented.

```java
@Getter
public class PersonResource extends ResourceSupport {

  private final Person person;

  public PersonResource(final Person person) {
    this.person = person;
    final long id = person.getId();
    add(linkTo(PersonController.class).withRel("people"));
    add(linkTo(methodOn(GymMembershipController.class).all(id)).withRel("memberships"));
    add(linkTo(methodOn(PersonController.class).get(id)).withSelfRel());
  }
}
```

Theres not much to this class as it only consists of a constructor with the rest of the methods and functionality it needs being provided by `ResourceSupport`. There are two things that happen here, the object that is to be returned is stored with a getter being created (done by Lombok here) and links to related resources are created. Lets break down one of the lines of code that adds a link to the resource to see what is happening.

```java
add(linkTo(methodOn(GymMembershipController.class).all(id)).withRel("memberships"));
```

`add` is a method inherited from `ResourceSupport` which adds the link passed to it. `linkTo` creates the link and `methodOn` gets the URI for the `GymMembershipController.all` method (`people/{id}/memberships`), both of these methods are static methods from `ControlLinkBuilder`. The `id` has been passed into the `all` method allowing the `{id}` in the URI to be replaced by the input value. Once the link is created `withRel` is called to provide a name to the to describe how it is related to the resource. The other lines go about creating links in slightly different ways, one manually creates a new `Link` object and another uses `withSelfRel` which simply names the relation as "self".

Now we have a better understanding of what a resource is we can look at the actual code inside the controller methods, hopefully I have chosen the correct response codes otherwise I am sure someone will try and correct me... I will then go on to explain two of them in more depth as same concept runs through them all.

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

We are going to look at the `all` method first.

```java
@GetMapping
public ResponseEntity<Resources<PersonResource>> all() {
  final List<PersonResource> collection =
      personRepository.findAll().stream().map(PersonResource::new).collect(Collectors.toList());
  final Resources<PersonResource> resources = new Resources<>(collection);
  final String uriString = ServletUriComponentsBuilder.fromCurrentRequest().build().toUriString();
  resources.add(new Link(uriString, "self"));
  return ResponseEntity.ok(resources);
}
```

This method makes use of the `Resources` object to return a collection of (you might of guessed it!) resources, in this case a collection of `PersonResource`. Just like the construction of the `PersonResource` earlier, `Resources` can also have links added to it. In this example a reference of "self" has been added which has been built using the `ServletUriComponentsBuilder`. `fromCurrentRequest` is nice enough to know what request has been made and because this request has been made to retrieve all people, it does not require any extra information. The URI that is then built and the string output created is used in a new `Link` and passed into the `ResponseEntity`. Everything went ok so a response code of `200 ok` was used.

The following request produces the JSON output.

```
CURL localhost:8090/people</pre>
```

```json
{
  "_embedded": {
    "personResourceList": [
      {
        "person": {
          "id": 1,
          "firstName": "test",
          "secondName": "one",
          "dateOfBirth": "01/01/0001 01:10",
          "profession": "im a test",
          "salary": 0
        },
        "_links": {
          "people": {
            "href": "http://localhost:8090/people"
          },
          "memberships": {
            "href": "http://localhost:8090/people/1/memberships"
          },
          "self": {
            "href": "http://localhost:8090/people/1"
          }
        }
      }
    ]
  },
  "_links": {
    "self": {
      "href": "http://localhost:8090/people"
    }
  }
}
```

Note how each person still has their links tied to them as well as the link related to the collection (the `Resources` object). Now onto the `post` method.

```java
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
```

The first thing this method does is create a new version of the `Person` object, preventing the client from persisting data that the service does not want saved initially (such as the id). The constructor I used in this example was made for convenience, but for clarity it sets all values except for the it's id. After the data is persisted a URI needs to be created to be passed into the `ResponseEntity`. This is done slightly differently from the previous example as the URI is created for the persisted data. Therefore a URI that represents a `GET` request is put together using the `MvcUriComponentsBuilder`. `fromController` gets the URI to the controller, appends the path of `/{id}` onto the end of it and using the `buildAndExpand` method replaces the path variable of `{id}` with the person's id. The created URI is then used with a `201 Created` code and a new `PersonResource` is made.

The following request produces the JSON output.

```
CURL -X POST localhost:8090/people
-H "Content-Type: application/json" 
-d '{"firstName":"test",
     "secondName":"one",
     "dateOfBirth":"01/01/0001 01:10", 
     "profession":"im a test", 
     "salary":0
    }'
```

```json
{
  "person": {
    "id": 2,
    "firstName": "test",
    "secondName": "one",
    "dateOfBirth": "01/01/0001 01:10",
    "profession": "im a test",
    "salary": 0
  },
  "_links": {
    "people": {
      "href": "http://localhost:8090/people"
    },
    "memberships": {
      "href": "http://localhost:8090/people/14/memberships"
    },
    "self": {
      "href": "http://localhost:8090/people/14"
    }
  }
}
```

So there we have it, HATEOAS (<strong>H</strong>ypermedia <strong> A</strong>s <strong> T</strong>he <strong> E</strong>ngine <strong> O</strong>f <strong> A</strong>pplication <strong> S</strong>tate) is built upon a REST API to further decouple the client from the server by decreasing the number of hard coded endpoints that the client can access. Instead they are called via links inside resources that are returned by the static endpoints that the server provides. This also decreases the chance of the client breaking when the service changes as it relies of the names of the links rather than their URIs. As always Spring Boot comes equipped with everything we need to get up and running with reasonable speed, assuming the `spring-boot-starter-hateoas` is included of course! On a closing note, whether or not HATEOAS is worth including with a REST API still seems to be up for discussion due to the complexity it adds when designing the service and because it requires the client to be written differently when compared to one that makes requests to a standard REST service. That being said, whether you decide it's worth using or not, at least you now have an understanding in how to create one with Spring Boot!

The code used in this post can be found on my [GitHub](https://github.com/lankydan/spring-boot-hateoas).

If you found this post helpful, please share it and if you want to keep up with my latest posts then you can follow me on Twitter at [@LankyDanDev](https://twitter.com/LankyDanDev).