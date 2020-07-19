---
title: Mapping a path in Spring Data Neo4j
date: "2020-07-19"
published: true
tags: [spring, spring data, spring data neo4j, neo4j, java]
github_url: https://github.com/lankydan/spring-data-neo4j
---

Spring data does a lot to help you focus on writing your cypher queries while it handles mapping the results for you. However, when your queries become more complex, it starts to struggle. This is where you need to step in and explicitly map the query results into your domain objects.

In this post, we will look at how you can query a path and map the results using Spring Data Neo4j.

## Simple queries are mapped for you

For simple queries, you can get away with only defining the relevant entity and relationship classes, Spring will do the rest.

Let's use a `findAll` function (returns all nodes):

```java
@Query("MATCH (n:City) RETURN n LIMIT 25")
Iterable<City> findAll();
```

The `City` entity needs to defined, as such:

```java
@NodeEntity(value = "City")
public class City {

  @Id
  @GeneratedValue
  private Long id;
  private String name;
  private double longitude;
  private double latitude;

  @Relationship(type = "NEXT")
  private Set<Connection> connections = Collections.emptySet();

  public City(
      Long id,
      String name,
      double longitude,
      double latitude,
      Set<Connection> connections
  ) {
    this.id = id;
    this.name = name;
    this.longitude = longitude;
    this.latitude = latitude;
    this.connections = connections;
  }

  public City() { }

  // getters + setters
}
```

`City` also has a relationship, so that needs to be defined as well:

```java
@RelationshipEntity("NEXT")
public class Connection {

  @Id
  @GeneratedValue
  private long id;
  @StartNode
  private City start;
  @EndNode
  private City end;

  public Connection(long id, City start, City end) {
    this.id = id;
    this.start = start;
    this.end = end;
  }

  public Connection() { }

  // getters + setters
}
```

Calling the `findAll` function will correctly collect the cities from the database and map them for you. 

Everything is good at this point. 

Another example of setting up a Neo4j entity class can be found in the [Spring Data Neo4j - getting started documentation](https://spring.io/guides/gs/accessing-data-neo4j/).

## Extracting paths requires your assistance

The code above is not suitable for a cypher query that returns a path.

The following query will be used for this section (taken from the [Apoc plugin's documentation](https://neo4j.com/docs/labs/apoc/current/misc/spatial/)):

```sql
MATCH (a:City {name:'bruges'}), (b:City {name:'dresden'})
MATCH p=(a)-[*]->(b)
WITH collect(p) as paths
CALL apoc.spatial.sortByDistance(paths) YIELD path, distance
RETURN path, distance
```

This query returns the path between two cities and the total distance of that path.

Unfortunately, there is no way to represent this information using the entity and relationship classes defined earlier. Furthermore, there is no way to currently do this using Spring Data Neo4j full stop. It personally took me a long time to realise this fact, until I came across this excerpt in their [documentation](https://docs.spring.io/spring-data/neo4j/docs/current/reference/html/#reference_programming_model_annotatedQueries).

> Custom queries do not support a custom depth. Additionally, @Query does not support mapping a path to domain entities, as such, a path should not be returned from a Cypher query. Instead, return nodes and relationships to have them mapped to domain entities.

Somehow I managed to keep brushing over this information when I went through the docs...

This means you cannot do something like this:

```java
public interface PathRepository extends Neo4jRepository<City, Long> {

  @Query("MATCH (a:City {name:$departure}), (b:City {name:$arrival})\n"
      + "MATCH p=(a)-[*]->(b)\n"
      + "WITH collect(p) as paths\n"
      + "CALL apoc.spatial.sortByDistance(paths) YIELD path, distance\n"
      + "RETURN path, distance")
  List<Path> getAllPaths(String departure, String arrival);
}
```

Where `Path` contains the following:

```java
@QueryResult
public class Path {
  public List<City> path;
  public double distance;

  public Path(List<City> path, double distance) {
    this.path = path;
    this.distance = distance;
  }
}
```

> The `@QueryResult` annotation allows you to define a custom object to contain the results of your cypher query, more can be found in the [Spring docs](https://docs.spring.io/spring-data/neo4j/docs/current/reference/html/#reference_programming-model_mapresult)

If you do this, it will still execute, but there will be no information about the cities filled in.

## How to manually map a path

To be able to map the path shown in the previous section, you need to manually assign the results from the cypher query into objects.

This can be done with the following code (large snippet incoming):

```java
@Repository
// Class instead of interface
// Extend [SimpleNeo4jRepository] instead of [Neo4jRepository]
public class PathRepository extends SimpleNeo4jRepository<City, Long> {

  private static final String GET_ALL_PATHS_QUERY =
      "MATCH (a:City {name:$departure}), (b:City {name:$arrival})\n"
          + "MATCH p=(a)-[*]->(b)\n"
          + "WITH collect(p) as paths\n"
          + "CALL apoc.spatial.sortByDistance(paths) YIELD path, distance\n"
          + "RETURN path, distance";

  // Needed to be able to query the database
  private final Session session;

  // Inject in the session
  // No need to create the session yourself, Spring has already created it
  public PathRepository(Session session) {
    super(City.class, session);
    this.session = session;
  }

  public List<Path> getAllPaths(String departure, String arrival) {
    Map<String, String> parameters = Map.of(
        "departure", departure,
        "arrival", arrival
    );

    // Execute the query and retrieve the result
    Result rows = session.query(GET_ALL_PATHS_QUERY, parameters);

    List<Path> results = new ArrayList<>();
    for (Map<String, Object> row : rows) {
      results.add(convertRow(row));
    }

    return results;
  }

  private Path convertRow(Map<String, Object> row) {
    InternalPath.SelfContainedSegment[] connections =
        (InternalPath.SelfContainedSegment[]) row.get("path");

    List<City> cities = new ArrayList<>();
    // Iterate through the segments in the path
    for (InternalPath.SelfContainedSegment connection : connections) {
      cities.add(convert(connection));
    }

    double distance = (Double) row.get("distance");
    return new Path(cities, distance);
  }

  private City convert(InternalPath.SelfContainedSegment connection) {
    // Extract the information about the [City] from the path segment
    // Information about the start node and the relationship could also be accessed
    return new City(
        connection.end().id(),
        connection.end().get("name").asString(),
        connection.end().get("latitude").asDouble(),
        connection.end().get("longitude").asDouble()
    );
  }
}
```

This iteration of `PathRepository` extends `SimpleNeo4jRepository` to inherit some of the more common queries without requiring you to implement them yourself. You do not _need_ to extend this class, but I suggest you do.

I don't think there is any need to explain the rest of the example, I tidied up the code as best I could and added comments for clarity. Hopefully, they are enough!

## Conclusion

As I eventually found out and have now mentioned to you, at the time of writing this post, Spring Data Neo4j does not support the automatic mapping of queries containing paths. Therefore you will need to take your fate into your own hands and extract the data yourself. The code in the penultimate section (the long code snippet) shows you how to do this. Using a similar structure, you should be able to adapt this for your own use to solve your own problems. I hope this saves you some time as it took me a while to realise this was the only way to retrieve a path, when using Spring Data Neoj4 anyway...

----

If you enjoyed this post or found it helpful (or both) then please feel free to follow me on Twitter at [@LankyDanDev](https://twitter.com/LankyDanDev) and remember to share with anyone else who might find this useful!