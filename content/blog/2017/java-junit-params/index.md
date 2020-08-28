---
title: Getting started with JUnitParams
date: "2017-03-04"
published: true
tags: [java, junit, testing]
github_url: https://github.com/lankydan/JUnitParamsTutorial
include_date_in_url: true
cover_image: blog-card.png
---

Do you write enough tests? Even if the answer is yes there might be some scenarios where you could add a few more to cover extra possibilities. But do you really want to go through the effort of having to write out another test for the extra inputs you are going to test? JUnitParams provides a solution to this, allowing you to write fewer individual tests while keeping the coverage the same. It does so by defining parameters to pass into each test and then you use these parameters to replace what would have originally been static values.

In this post I will show you a little tutorial on how to use JUnitParams.

As mentioned above parameters are defined to past into tests using the `@Parameters` annotation. Note that not all the tests have to take in parameters and can be left as normal JUnit tests, the test will still run with no problems. There are a few different ways to pass these parameters into the tests, they are included in the examples below.

```java
@RunWith(JUnitParamsRunner.class)
public class JUnitParamsTutorialTest {

    private JUnitParamsTutorial testSubject = new JUnitParamsTutorial();

    // takes parameters from the inside the annotation
    @Test
    @Parameters({"1, 2, 3",
            "3, 4, 7",
            "5, 6, 11",
            "7, 8, 15"})
    public void addProducesCorrectValue_usingAnnotatedParameters(final int a, final int b, final int
            expectedResult) {
        assertEquals(expectedResult, testSubject.add(a, b));
    }

    // takes parameters from the addParameters method
    @Test
    @Parameters(method = "addParameters")
    public void addProducesCorrectValue_usingNamedMethodParameters(final int a, final int b, final int
            expectedResult) {
        assertEquals(expectedResult, testSubject.add(a, b));
    }

    private Object[] addParameters() {
        return new Object[]{
                new Object[]{1, 2, 3},
                new Object[]{3, 4, 7},
                new Object[]{5, 6, 11},
                new Object[]{7, 8, 15}
        };
    }

    // equivalent of version two but no method is defined
    // takes method that is named "parametersFor" + "name of the test"
    @Test
    @Parameters
    public void addProducesCorrectValue_usingMethodParametersWithoutName(final int a, final int b, final int
            expectedResult) {
        assertEquals(expectedResult, testSubject.add(a, b));
    }

    private Object[] parametersForAddProducesCorrectValue_usingMethodParametersWithoutName() {
        return new Object[]{
                new Object[]{1, 2, 3},
                new Object[]{3, 4, 7},
                new Object[]{5, 6, 11},
                new Object[]{7, 8, 15}
        };
    }

    // takes parameters from a CSV file
    @Test
    @FileParameters("resources/JUnitParamsTutorialParameters.csv")
    public void addProducesCorrectValue_usingCSV(final int a, final int b, final int
            expectedResult) {
        assertEquals(expectedResult, testSubject.add(a, b));
    }

    // takes parameters from the containsParameters method
    @Test
    @Parameters(method = "containsParameters")
    public void testContains_usingNamedMethodParameters(final List<String> list, final String a,
                                                        final boolean expectedResult) {
        assertEquals(expectedResult, testSubject.contains(list, a));
    }

    private Object[] containsParameters() {
        return new Object[]{
                new Object[]{Arrays.asList("a", "b", "c", "d", "e"), "c", true},
                new Object[]{Arrays.asList("a", "b", "c", "d", "e"), "e", true},
                new Object[]{Arrays.asList("a", "b"), "e", false},
                new Object[]{Arrays.asList(), "e", false}
        };
    }

    // takes parameters from the methods in MyContainsTestProvider
    @Test
    @Parameters(source = MyContainsTestProvider.class)
    public void testContains_usingSeperateClass(final List<String> list, final String a, final
    boolean expectedResult) {
        assertEquals(expectedResult, testSubject.contains(list, a));
    }

    public static class MyContainsTestProvider {
        public static Object[] provideContainsTrueParameters() {
            return new Object[]{
                    new Object[]{Arrays.asList("a", "b", "c", "d", "e"), "c", true},
                    new Object[]{Arrays.asList("a", "b", "c", "d", "e"), "e", true},
                    new Object[]{Arrays.asList("a", "b"), "b", true},
                    new Object[]{Arrays.asList("a"), "a", true}
            };
        }

        public static Object[] provideContainsFalseParameters() {
            return new Object[]{
                    new Object[]{Arrays.asList("a", "b", "c", "d", "e"), "f", false},
                    new Object[]{Arrays.asList("a", "b", "c", "d", "e"), "z", false},
                    new Object[]{Arrays.asList("a", "b"), "e", false},
                    new Object[]{Arrays.asList(), "e", false}
            };
        }
    }
}
```

And the little class that is the test subject of this unit test.

```java
public class JUnitParamsTutorial {

    public int add(final int a, final int b) {
        return a + b;
    }

    public boolean contains(final List<String> list, final String a) {
        return list.contains(a);
    }

}
```

The first thing to notice in the test class is

```java
@RunWith(JUnitParamsRunner.class)
```

which will run this test with JUnitParams allowing the use of its specific annotations.

Moving on a bit you will see the tests, which each have the `@Test` and `@Parameters` or `@FileParameters` annotations on them. `@Test` is used to define methods as tests. The test methods each have input parameters like you would have in a normal method and are to be used in setting up the tests and possibly contain expected results.

```java
@Test
@Parameters({"1, 2, 3",
        "3, 4, 7",
        "5, 6, 11",
        "7, 8, 15"})
public void addProducesCorrectValue_versionOne(final int a, final int b, final int
        expectedResult) {
    assertEquals(expectedResult, testSubject.add(a, b));
}
```

In this test, four sets of three parameters are being passed into the test. This test will execute four times using each set of parameters per run through. The parameters were used to pass the expected result of each set while the remaining were used to pass into the test subject. If you were expecting all of you results to be `true` then `assertTrue` could be used and the expected result does not need to be passed into the test. This test also demonstrated one of the ways to pass parameters into a test, more methods will be discussed below.

There are a few ways to define parameters for tests. Parameters that are passed into tests using the `@Parameters` annotation must be `Object[]`'s and for tests using the annotation `@FileParameters` must be CSV's. The different means to pass in parameters are shown below.

- In the annotation

  ```java
  @Parameters({"1, 2, 3", "3, 4, 7", "5, 6, 11", "7, 8, 15"})
  ```

  The parameters must be primitive objects such as integers, strings or booleans. Each set of parameters is contained within a single string and will be parsed to their correct values as defined on the test methods signature.

- In a method named in annotation

  ```java
  @Parameters(method = "addParameters")
  ```

  A separate method can be defined and referred to for parameters. This method must return an `Object[]` and can contain normal objects.

- In a method not named in annotation

  ```java
  @Parameters
  ```

  When the annotation is left blank it will look for a method that has the same name of the test it is attached to prefixed with `parametersFor`. So if you method is called `testA` the parameter method will be called `parametersForTestA`.

- In a class

  ```java
  @Parameters(source = MyContainsTestProvider.class)
  ```

  A separate class can be used to define parameters for the test. This test must contain at least one static method that returns an `Object[]` and its name must be prefixed with `provide`. The class could also contain multiple methods that provide parameters to the test, as long as they also meet the required criteria.

- CSV

  ```java
  @FileParameters("resources/JUnitParamsTutorialParameters.csv")
  ```

  A CSV can also be used to contain the parameters for the tests. It is pretty simple to set up as its just a comma separated list, I spent most of the time trying to get the correct path to the file itself...

In summary I quite like using JUnitParams and try to use it when it is applicable to the tests I am writing, normally tests that can have a variety of different inputs or have varying outputs. There is one main thing that annoys me when using JUnitParams though, debugging can be pretty frustrating as you cannot easily run one set of parameters at a time when desired. Forcing me to comment out the parameters I don't want to debug into, which isn't a problem for normal tests which can be run one at a time. Another smaller issue I have is that both Eclipse and Intellij cannot jump to straight to each individual tests when double clicked on in their test views, although Eclipse has a few extra problems with JUnitParams that Intellij doesn't run into.

For more information on JUnitParams have a look at their [Github](https://github.com/Pragmatists/JUnitParams) page, which contains some examples although some of them are a little out of date and are not usable anymore.

The example code that I used in this post can be found [here](https://github.com/lankydan/JUnitParamsTutorial).

 