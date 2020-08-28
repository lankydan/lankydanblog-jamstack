---
title: Abstraction, do I need to know this?
date: "2017-01-29"
published: true
tags: [theory, general]
include_date_in_url: true
cover_image: blog-card.png
---

Abstraction is a concept that is that is not only relevant to software engineering but also to many scenarios in the world. According to Wikipedia "The essence of abstractions is preserving information that is relevant in a given context, and forgetting information that is irrelevant in that context". In a very simplified way this means that you don't need to know how everything works.

Examples always make these sort of things easier to understand, if you are driving a car you just need to know things like how turning the wheel turns the car and pressing the accelerator makes the car's speed increase, but you don't need to know how the engine works. You will know that you need the engine and that it is what produces the power that drives the car, but do you need to know how the air and petrol mix in the engine to produce power? No you don't and that's where abstraction comes in. This way you can stop trying to figure out how everything works and just accept somethings as fact.

So how does this apply to software engineering / programming? Your code should be written to consider abstraction so that your code has different concerns properly separated. This makes each layer or class of code to be much more specific only needing to know about what is directly below it so that it can make use of the methods they expose. Private methods are also a form of abstraction as they are only visible to the current class meaning that you expose a selection of public methods to be used by other classes but they cannot see the private methods that will most likely contain a large amount of the workings of the class.

Abstraction is also a useful concept when designing a user interface that is separated from the business logic. A button press should trigger a method to be called from the business logic instead of containing the workings itself. This also allows the logic to be reused as it is in a appropriate place in the code base that it can be used by multiple user interfaces and also allows the original user interface to be changed visually but retain the main chunk of functionality.

In conclusion you don't need to know everything. You need to know enough to implement the functionality that you require, but you don't need to know how every single method you call and the methods they call work. If you tried to understand all of this you would probably never reach the end point and you will undoubtedly forget a lot of it after a while...