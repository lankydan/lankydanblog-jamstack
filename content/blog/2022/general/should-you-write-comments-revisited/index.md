---
title: Should you write comments, revisited
date: "2022-04-11"
published: true
tags: [general]
cover_image: blog-card.png
---

5 years ago, I wrote a blog post about [leaving comments in your code](/2017/01/07/should-you-write-comments?). I leant heavily towards the side of not writing comments, and I see other people writing their own posts agreeing with that assertion. However, during these 5 years, even though my logical foundations of reducing comment usage remain, I have been presented with more and more scenarios where comments are a must-have. As it turns out, even if you write clean, structured and well thought out code, there reaches a point where the complexity is too high to fully process what the code does. In these situations, you must not be scared of writing comments; these are the exact moments that you should be.

It's hard to really define a straightforward rule that one can follow on "when to write a comment"; experience will start to give you that gut feeling and was probably why I had a hardline stance on not writing comments in the past. That, or the software I'm producing, has increased in complexity over time.

I do stand by the two main points I wrote in my [original post](/2017/01/07/should-you-write-comments?), which were:

- Extract code into well-named methods instead of having long continuous streams of code.
- Give variables descriptive names, so they don't need a comment to explain them.

I doubt many people would disagree with those points, but what about everything else? Below are another two general areas where providing some extra information to the readers of your code would be greatly appreciated:

- __Complex interactions between classes__ - Classes can have indirect iterations between each other. Without documenting how they interweave, you will inevitably forget how they impact each other, or that they even do in the first place.
- __Highlighting workarounds due to bugs in other areas of code or dependent libraries__ - You can't guarantee a fix in code that is out of your control. Sometimes you'll have to work around the issue, and it is desirable to include a comment on why it was needed.

Really though, these are amalgamations of the same idea.

When complexity cannot be addressed directly or in a time-effective manner, a well-written comment will save future contributors vast amounts of time and considerably increase their understanding of the code. You could try and refactor the codebase to reduce complexity; however, it is not always worth spending days, weeks or months to do so. You'll have to make a judgement call and decide whether it's worth it on a case by case basis.

Over time, you'll better find the line where you can balance complexity with self-explaining code and comments to fill the gaps, all while maintaining the velocity that your project or company requires from you.

If you have your own identifiers for code that requires commenting, do let me know. I spent a while thinking about this but felt that every situation fit into the two categories I listed here (or the two from my previous post).