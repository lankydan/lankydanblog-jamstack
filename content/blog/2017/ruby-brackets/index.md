---
title: When do you use parentheses in Ruby?
date: "2017-05-13"
published: true
tags: [ruby, beginners]
include_date_in_url: true
---

So I am still reasonably new to Ruby and I have only been working on it at home and therefore have had no one review my code and comment on whether I am writing my code in the correct way. The only input I have is from code that I see online and the book I bought about Rails. Now most things are pretty straight forward and being I work as a developer I have a basis on what is readable and what is not which leaves most of my code looking good (in my opinion) but the one problem I have are parentheses. I have no clue when I can omit them and when they should be used and even looking through my book I couldn't find consistency.

After searching on the web it seems the area is a little blurry but pretty much comes down to, if it makes it easier to read add them in otherwise omit them. I tried to find some concrete answers that take this a bit further but every place I looked everyone seemed to have different preferences.

Below I will put down some guidelines that I think makes sense from various other sources which I personally am trying to follow, but these are by no means commandments that must be obeyed.

Calling methods without any parameters

```ruby
def new
  # without -> good
  user = User.new
  # with -> bad
  user = User.new()
end
```

The general consensus is that these brackets are not needed and makes it look nice and tidy without the extra clutter. The downside to this is that one could confuse the method to be an attribute of the object that is being used, but hopefully our methods are named well enough to remove this confusion. As a Java developer I was happy to take this up and write a few less brackets which I'm not allowed to do in Java.

Calling methods with parameters

```ruby
def with_parameters
  # without -> subjective
  variable = object.method other_variable
  # with -> good
  variable = object.method(parameter)
  # without -> bad
  variable = object.method parameter, other_parameter
  # with -> good
  variable = object.method(parameter, other_parameter)
end
```

This is one guideline that I must admit I follow pretty loosely at the moment. The parentheses make it clear what is being passed into the method therefore increasing readability. Although for lines where a single method is being called which is taking in a variable as input I believe it still looks pretty clear without them. These are the sort of blurry areas that I mentioned earlier.

Defining methods

```ruby
# without -> good
def method
  # stuff
end

# with -> bad
def method()
  # stuff
end

# without -> bad
def method parameter
  # stuff
end

# with -> good
def method(parameter)
  # stuff
end

# with -> good
def method(parameter, another_parameter)
  # stuff
end
```

This takes a combination of the examples above where if there no parameters the definition should not have any parentheses but if there are any inputs then they should be included.

Methods that are part of a DSL (such as Rails) or Ruby keywords

```ruby
# with -> bad
validates (:name, presence: true, length: { maximum: 50 })
# without -> good
validates :name, presence: true, length: { maximum: 50 }

# with -> bad
attr_reader (:name, :email)
# without -> good
attr_reader :name, :email
```

This is one that from the information I have gathered that varies the most as there seems to be an equal amount of people that agree and disagree with this possible guideline. Personally within my code I tend to leave out brackets in these situations, although that could change sometime in the future as there seems to be such varying opinion on this.

So that's my take on using parentheses in Ruby. Honestly even after writing this post I am still a bit unsure about what is the standard as everyone seems to have slightly different preferences, which are all technically valid due to the flexibility of the language around parentheses. Therefore if you are still a little confused like me, the main things you need to remember are, to make your code as readable as possible so anyone can follow your code and to be consistent in what you choose to do, if you decide that you are going to add parentheses in certain situations make sure that you stand by that choice throughout your code.

 