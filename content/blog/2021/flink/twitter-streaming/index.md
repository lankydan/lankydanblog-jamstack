---
title: Processing tweets with Apache Flink and the Twitter API
date: "2021-01-31"
published: true
tags: [java, apache flink, flink, twitter, stream processing]
cover_image: blog-card.png
github_url: https://github.com/lankydan/apache-flink-twitter-streaming
---

Recently I have been playing around with Apache Flink and decided to use the Twitter API as a datasource for my endeavor. 

This post is going to be an extremely short summary of what I did and leave you to look at the code if you're interested.

The code mentioned in this post is linked above but I'll put it here as well - [apache-flink-twitter-streaming](https://github.com/lankydan/apache-flink-twitter-streaming).

## What I did

I wrote a Flink streaming application that does the following:

- Takes new tweets from Twitter.
- Gets recent tweets from the streamed tweet's author.
- Keep tweets that contain similar mentions to the streamed tweet.
- Prints out the remaining tweets, including their metrics, such as the retweet count.

## How I did it

I used the [flink-twitter-connector](https://ci.apache.org/projects/flink/flink-docs-stable/dev/connectors/twitter.html) to pull tweets from Twitter. This connector, at the time of writing, uses the v1 Twitter API rather than v2. Originally I was going to use [Kafka Connect Twitter](https://www.confluent.io/hub/jcustenborder/kafka-connect-twitter) but didn't want to set up another service when I was primarily interested in Flink itself.

The Twitter connector ingested tweets into my application for processing, where I then requested further information from Twitters v2 API such as, recent tweets, author/user information and tweet metrics.

To be honest, since I was focused on learning Flink, the functionality of my code is not particularly interesting but it provided a decent learning experience. Although, a significant portion of my time was spent trying to understand the Twitter APIs...

## If you're still interested by this point

Since you've managed to read this far you might as well look at the code, otherwise you're not going to take away anything useful from this post.

Here's the link to the [repository](https://github.com/lankydan/apache-flink-twitter-streaming) again.