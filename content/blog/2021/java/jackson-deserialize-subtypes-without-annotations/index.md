---
title: Jackson - Deserialize subtypes without annotations
slug: jackson-deserialize-subtypes-without-annotations
date: "2021-01-30"
published: true
tags: [java, jackson]
cover_image: blog-card.png
---

Sometimes you can't or don't want to use Jackson annotations to control your JSON serialization and deserialization. Unfortunately, Jackson does not behave very nicely when you aren't using annotations everywhere, probably causing you to write code that doesn't work. Which will then lead you to googling solutions, but then you'll find the only answers ever given... Are to use more annotations...

Fine, I get it, that is how Jackson is typically used, and it's also how I also use it most of the time. But it seems that if you are trying to solve a problem where annotations are out of bounds, then you are really screwed.

Anyway, I got a bit screwed... So I have dedicated this post to show you how I unscrewed myself from this situation.

> Jackson 2.11.1 was used for the content of this post.

> I talk about deserializers in this post since they're related to the problem I was trying to solve, but everything here _should_ hold for serializers as well.

## What I needed to do

- I needed to deserialize a class that couldn't have annotations added directly to it.
- The deserializer needed to be constructed manually as it delegated some of its functionality to another class.
- Subtypes of the original class should be deserialized using the same deserializer.
- Allow subtypes to use a separate deserializer if desired.

## Potential solutions

- A Mixin.
- Add a deserializer manually.

### Why a Mixin didn't work

Mixins allow you to specify serializers, deserializers and other Jackson annotations without annotating the original class. You can find further information in the [Jackson docs](https://github.com/FasterXML/jackson-docs/wiki/JacksonMixInAnnotations).

A further benefit that comes from using Mixins is the fact that they support inheritance. From the documentation:

> Mix-ins work as expected within inheritance hierarchy: it is feasible (and useful) to attach mix-in annotations to super-classes -- if so, mix-in annotations can further be overridden by annotations sub-classes (of target) provide.

This all sounds good, but it only meets 3 out of the 4 goals.

<ul class='no-bullets'>
<li>
✅ I needed to deserialize a class that couldn't have annotations added directly to it.
</li>
<li>
❌ The deserializer needed to be constructed manually as it delegated some of its functionality to another class.
</li>
<li>
✅ Subtypes of the original class should be deserialized using the same deserializer.
</li>
<li>
✅ Allow subtypes to use a separate deserializer if desired.
</li>
</ul>

Since Mixins still require annotations, it is impossible to instantiate a deserializer that takes in any dependencies as the deserializer is referenced by its class name, therefore requiring the object to have a default constructor.

As shown by the code below:

```kotlin
@JsonDeserialize(using = JacksonSupport.OpaqueBytesDeserializer::class)
private interface ByteSequenceMixin
```

The `OpaqueBytesDeserializer` has no way to inject dependencies into it, if it requires any, without setting some global properties that it can access.

Unfortunately, it didn't meet all my requirements and was thrown out.

### Why adding a deserializer manually didn't work

You can add a deserializer manually by using `SimpleModule.addDeserializer`, for example:

```kotlin
class CordaModule : SimpleModule("corda-core") {
    init {
        addDeserializer(ByteSequence::class.java, JacksonSupport.OpaqueBytesDeserializer())
    }
}

class OpaqueBytesDeserializer : JsonDeserializer<OpaqueBytes>() {
    override fun deserialize(parser: JsonParser, ctxt: DeserializationContext): OpaqueBytes {
        return OpaqueBytes(parser.text?.toByteArray(UTF_8) ?: parser.binaryValue)
    }
}
```

The deserializer above is created manually and can therefore have any dependencies passed to it.

So how does this stack up against the requirements? Again 3 out of 4.

<ul class='no-bullets'>
<li>
✅ I needed to deserialize a class that couldn't have annotations added directly to it.
</li>
<li>
✅ The deserializer needed to be constructed manually as it delegated some of its functionality to another class.
</li>
<li>
❌ Subtypes of the original class should be deserialized using the same deserializer.
</li>
<li>
✅ Allow subtypes to use a separate deserializer if desired.
</li>
</ul>

After a lot of head-scratching and a bit of debugging, it seems that registering a deserializer in this way does not allow subtypes to be processed by the same deserializer. Instead, another deserializer must be created and registered for each subtype which is suboptimal and a significant downgrade from what Mixins can do in this regards. 

I am unsure why it has this drawback when Mixins can manage inheritance, and honestly, I don't have the effort to figure out why. There's also the possibility I'm wrong or that this drawback has been rectified in later versions of Jackson.

For this reason, manually adding a deserializer did not work for me.

## What I got working

I only listed out 2 potential solutions previously, because they were the only 2 that I _thought_ I would need. Instead, I had to do some playing around and came across a different method of handling deserializers.

`addBeanDeserializerModifier` allows a `BeanDeserializerModifier` to be registered that participates in the constructing of deserializers. Yes, that does sound confusing... I personally find this one hard to understand so I'll show you some code and go through that instead:

```kotlin
class CordaModule : SimpleModule("corda-core") {
    override fun setupModule(context: SetupContext) {
        super.setupModule(context)
        context.addBeanDeserializerModifier(ByteSequenceBeanDeserializerModifier(serializationService))
    }
}

private class ByteSequenceBeanDeserializerModifier(
  serializationService: P2pSerializationService
) : BeanDeserializerModifier() {

    private val serializedBytesDeserializer = SerializedBytesDeserializer(serializationService)
    private val opaqueBytesDeserializer = OpaqueBytesDeserializer()

    override fun modifyDeserializer(
        config: DeserializationConfig,
        description: BeanDescription,
        deserializer: JsonDeserializer<*>
    ): JsonDeserializer<*> {
        val original = super.modifyDeserializer(config, description, deserializer)
        return when {
            SerializedBytes::class.java.isAssignableFrom(description.beanClass) -> serializedBytesDeserializer
            ByteSequence::class.java.isAssignableFrom(description.beanClass) -> {
                return when {
                    SignedTransaction::class.java.isAssignableFrom(description.beanClass) -> original
                    // other branches returning [original]
                    else -> opaqueBytesDeserializer
                }
            }
            else -> original
        }
    }
}
```

A `BeanDeserializerModifier` does not require a generic type allowing it to intercept the construction of deserializers, regardless of the types they handle. The modification of deserializers occurs in `modifyDeserializer` (I mean the name does suggest that), which is overloaded to provide my implementation. `super.modifyDeserializer` is also called to retrieve the original deserializer before making any alterations. 

Finally, for my implementation, I check the type that the deserializer is to be registered for and either return a different deserializer or the original. You could opt to modify the original rather than returning a new one depending on your use-case.

> There are also different versions of `modifyDeserializer`, such as `modifyEnumDeserializer` and `modifyReferenceDeserializer`.

To wrap up this section, I'll have to add the checklist again.

<ul class='no-bullets'>
<li>
✅ I needed to deserialize a class that couldn't have annotations added directly to it.
</li>
<li>
✅ The deserializer needed to be constructed manually as it delegated some of its functionality to another class.
</li>
<li>
✅ Subtypes of the original class should be deserialized using the same deserializer.
</li>
<li>
✅ Allow subtypes to use a separate deserializer if desired.
</li>
</ul>

Perfect!

## If you think you know better

If you're a Jackson savant and know a better solution, then I'm all ears. You can message me on [Twitter (@LankyDanDev)](https://twitter.com/LankyDanDev), and I'll be happy to update my post.