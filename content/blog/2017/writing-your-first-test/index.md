---
title: Writing your F.I.R.S.T unit tests
slug: writing-your-f-i-r-s-t-unit-tests
date: "2017-03-04"
published: true
tags: [testing, basics, beginner]
include_date_in_url: true
---

Unit tests are required to test singular sections of code. In java this would normally be a class. They provide confidence to programmers allowing changes to be made and by running tests throughout development any changes that break the tests can be reevaluated, whether that results in the production code being corrected or altering the test to make it pass. In this post I will discuss the FIRST rules that are defined in the [Clean Code](https://sites.google.com/site/unclebobconsultingllc/books) book written by uncle Bob Martin.

FIRST means that tests should be:

- __Fast__ - Tests should be be fast enough that you wont be discouraged to use them. If you are making changes to a class or method that has a few tests attached to them you are much more likely to run those tests after making changes if they take about a second to run, compared to slower tests which can not only take a while to initialise but each test case could also take over 1 second to run. For example I have ran integration tests that would take 20 seconds plus to run and I hated having to run them after code changes. Unit tests however do not have to test multiple components like integration tests and therefore keeping them running in under 1 second should be possible.
- __Independent__ - Tests should not depend on the state of the previous test, whether that is the state of an object or mocked methods. This allows you to run each test individually when needed, which is likely to happen if a test breaks as you will want to debug into the method and not have to run the other tests before you can see what is going wrong. If you have a test that is looking for the existence of some data, then that data should be created in the setup of the test and preferably removed afterwards as not to affect the later tests.
- __Repeatable__ - Tests should be repeatable in any environment without varying results. If they do not depend on a network or database then it removes possible reasons for the tests failing as the only thing they depend on is the code in the class or method that is being tested. If the test fails then the method is not working correctly or the test is setup wrong and nothing else.
- __Self-Validating__ - Each test will have a single boolean output of pass or fail. It should not be up to you to check the output of the method is correct each time the test is ran. The test should tell you if the result of the test was valid or not. This is normally done using asserts such as `assertTrue` or `assertEquals` which will cause the test to pass or fail depending on their results.
- __Timely__ - Unit tests should be written just before the production code that makes the test pass. This is something that you would follow if you were doing TDD (Test Driven Development) but otherwise it might not apply. I personally do not use TDD and therefore I always write my tests after writing my production code. Although I can see the reasons for following this I believe this is the rule that could be skipped if not appropriate.
Below is a little unit test that I wrote follows the above rules, please note this is just a simple test and if you think there scenarios that are being not tested, you are correct but I'm being a bit lazy.

```java
@RunWith(JUnit4.class)
public class PersonValidatorTest {

    private PersonValidator testSubject = new PersonValidator();

    private Person person;

    // tests if the person is called Dan Newton
    @Test
    public void personCalledDanNewtonIsNotValid() {
        person = new Person("Dan","Newton",23,1000);
        assertFalse(testSubject.isValid(person));
    }

    // tests if the person is not called Dan Newton
    @Test
    public void personNotCalledDanNewtonIsValid() {
        person = new Person("Bob","Martin",60,170);
        assertTrue(testSubject.isValid(person));
    }

    // tests if the person is older than 25
    @Test
    public void personIsOlderThanTwentyFiveIsValid() {
        person = new Person("Bob","Martin",60,170);
        assertTrue(testSubject.isValid(person));
    }

    // tests if the person is younger than 25
    @Test
    public void personIsYoungerThanTwentyFiveIsNotValid() {
        person = new Person("Bob","Martin",10,170);
        assertFalse(testSubject.isValid(person));
    }

    // tests if the person is 25
    @Test
    public void personIsTwentyFiveIsNotValid() {
        person = new Person("Bob","Martin",25,170);
        assertFalse(testSubject.isValid(person));
    }

}
```

```java
public class PersonValidator {

    public boolean isValid(final Person person) {
        return isNotCalledDanNewton(person) && person.getAge() > 25 && person.getHeight() < 180;

    }

    private boolean isNotCalledDanNewton(final Person person) {
        return !person.getFirstName().equals("Dan") || !person.getLastName().equals("Newton");
    }

}
```

So do these tests follow FIRST?

- __Fast__ - They do not do much so obviously they are quick to run.
- __Independent__ - Each test sets up a new person and passes in all the parameters that are required for the test.
- __Repeatable__ - This test does not depend on any other classes, or require a connection to a network or database.
- __Self-Validating__ - Each test has a single assert which will determine whether the test passes or fails.
- __Timely__ - Failure!! I did not write these tests before writing the code in `PersonValidator`, but again this is because I do not use TDD.

By following the FIRST rules in this post your unit tests should see some improvement. I am not saying that by following these rules alone will make your unit tests perfect as there are still other factors that come into making a good test, but you will have a good foundation to build upon.

As mentioned earlier a good place to look for more information into this subject, writing unit tests in general and much more have a look at the [Clean Code](https://sites.google.com/site/unclebobconsultingllc/books) book.