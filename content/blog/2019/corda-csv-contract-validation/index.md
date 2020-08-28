---
title: Verifying a Contract with CSV data
date: "2019-05-05"
published: true
tags: [corda, corda 4, kotlin, dlt, distributed ledger technology, blockchain]
github_url: https://github.com/lankydan/corda-csv-contract-validation
cover_image: blog-card.png
---

Attachments in Corda can be more than just PDFs sent along with a transaction. They can actually be used programmatically when running a flow or even inside of a contract's `verify` function. Why would you want to do that though? 🤔 The answer makes a lot of sense when you think about it. Let's take an attachment containing CSV data as an example. Actually, that is what this post is about. Anyway. The attachment could contain all the valid IDs (or whatever else) that a state is allowed to have. Now, that could be done within your code, but this is not practical for a system that needs to change over time. Maybe there are new IDs that need to be added. If they live inside the code then an updated CorDapp needs to be compiled and distributed whenever new values are allowed. Not entirely practical. But, uploading a new version of the file containing the data allows the validation to change over time, without the need for recompilation. That is an idea that makes perfect sense 👏.

Now that we agree that validating the contents of a transaction against attachment data is a good idea. The next question is where is the best place to put this validation. As mentioned before, there are two options. Inside the flow or in the contract. Putting it inside the contract makes the most sense here because all parties receiving the transaction have to run the attachment's validation. Guarantying that they all reach consensus on the validity of the transaction 🤝.

Knowing that you can use attachments to validate a contract is great and all, but there is still some code to write before it becomes a reality. Don't worry though, I got you 👍.

## Building a transaction with an Attachment

Going to keep this one short and sweet since more information on this can be found in the [docs](https://docs.corda.net/tutorial-attachments.html). Below is some code from a flow that builds a transaction containing an attachment (it assumes the attachment already exists):

```kotlin
private fun transaction(): TransactionBuilder =
  TransactionBuilder(notary()).apply {
    val attachmentId = attachment()
    addOutputState(message)
    addCommand(Command(Send(attachmentId), message.participants.map(Party::owningKey)))
    addAttachment(attachmentId)
  }

private fun attachment(): AttachmentId {
  return serviceHub.attachments.queryAttachments(
    AttachmentQueryCriteria.AttachmentsQueryCriteria(
      filenameCondition = Builder.equal(
        attachmentName
      )
    )
  ).first()
}
```

Adding the attachment to the transaction does not include any fancy code. Retrieving the attachment is a bit more involved but is not hard to put together either. In this example the attachment is being queried by name and the returned `AttachmentId` is then passed to the `TransactionBuilder`'s `addAttachment` (it takes the `AttachmentId` not the attachment itself). Using the name of the attachment is my preference but passing in the `AttachmentId` is also possible, assuming you know it beforehand.

There is one other sneaky piece of code that you might not have caught. I passed in the `AttachmentId` into the `Send` command. Doing so allow the attachment's hash to be known and makes retrieving it from the transaction later far easier. I'll quickly show you how I did that:

```kotlin
class MessageContract : Contract {

  interface Commands : CommandData {
    class Send(attachmentId: AttachmentId) : CommandWithAttachmentId(attachmentId), Commands
  }

  abstract class CommandWithAttachmentId(val attachmentId: AttachmentId) : CommandData {
    override fun equals(other: Any?) = other?.javaClass == javaClass
    override fun hashCode() = javaClass.name.hashCode()
  }
}
```

## Verifying the Contract

This is where the magic 🧙‍♀️ happens. By using the attachment previously added to the transaction, the data inside of it can be pulled out and used to validate the states in the transaction. Below is the contract's `verify` function:

```kotlin
override fun verify(tx: LedgerTransaction) {
  val command = tx.commands.requireSingleCommand<Commands>()
  when (command.value) {
    is Commands.Send -> requireThat {
      "No inputs should be consumed when sending a message." using (tx.inputs.isEmpty())
      "Only one output state should be created when sending a message." using (tx.outputs.size == 1)
    }
    is Commands.Reply -> requireThat {
      "One input should be consumed when replying to a message." using (tx.inputs.size == 1)
      "Only one output state should be created when replying to a message." using (tx.outputs.size == 1)
    }
  }
  require(isMessageInCsv(tx)) {
    "The output message must be contained within the csv of valid messages. " +
            "See attachment with hash = ${tx.attachments.first().id} for its contents"
  }
}

private fun isMessageInCsv(tx: LedgerTransaction): Boolean {
  val message = tx.outputsOfType<MessageState>().first()
  val attachmentId = tx.commandsOfType<CommandWithAttachmentId>().single().value.attachmentId
  return tx.getAttachment(attachmentId).openAsJAR().use { zipInputStream: JarInputStream ->
    zipInputStream.nextJarEntry.name
    val csv = CSVFormat.DEFAULT.withHeader("valid_messages")
      .withFirstRecordAsHeader()
      .parse(InputStreamReader(zipInputStream))
    csv.records.any { row -> row.get("valid messages") == message.contents }
  }
}
```

The interesting content in this example is found inside the `isMessageInCsv` function. It might look a bit daunting, but perhaps I just need to tidy it up a bit 😩... Forget I said that 😉. It just needs a little explanation (or maybe some code comments 🤔).

Attachments can be retrieved from a transaction via its `commands` property or via the `getAttachment` function (taking a position or `AttachmentId`/`SecureHash`). In this example, the attachment containing the CSV data is retrieved using `getAttachment` along with the id that was previously passed into the command.

The attachment has been retrieved by this point. Now the CSV data inside of it needs to be parsed and compared to the transaction's states. To make this much simpler, I have used [Apache Commons CSV](https://mvnrepository.com/artifact/org.apache.commons/commons-csv/1.6). The attachment is opened using `openAsJAR` (the attachment is stored as a zip) and the library is utilised to read the data inside of it. As each row is read, it checks whether the `contents` of the `MessageState` matches the current row. If any do, then great. The state passes the test and the contract is deemed valid. If none match, the following error is output and you will need to try again 😈.

```
net.corda.core.contracts.TransactionVerificationException$ContractRejection: Contract verification failed: 
The output message must be contained within the csv of valid messages. See attachment with hash = 3E3031BA98F3F01843E8FD0A1B34E21C599C9C8F09765C2F820E45D6E8770948 for its contents, 
contract: com.lankydanblog.tutorial.contracts.MessageContract, transaction: 5C8963497E493684A78C0A95A30E4C30029E6C36A792DE8A1B1733DE5358BB15
```

This code does assume that the contents of the CSV follows some sort of format. In other words, `"valid messages"` is hardcoded to be a header in the file. If it is not there, then the validation becomes a bit pointless. It will fail if this happens, which is actually a good thing but if you remember back to what I said in the introduction. This introduces more hard coding and reduces the flexibility of the contract. If you wanted to improve this, you could pass in the name of the row you wish to use into the command, in the same way I added the `AttachmentId` to it earlier on.

## Wrapping up

As you have seen, validating a transaction using data from a CSV attachment does not require too much effort. In fact, I bet that if you wanted to implement this yourself, your code would look almost identical to mine. I mean, there are only so many ways to do this. By delegating to a library most of the work will be done for you. 

To summarise the steps needs to validate a transaction with some CSV data:

- Upload the CSV to the node
- Inside the flow, retrieve it and add it to a transaction
- Inside the contract, take the CSV from the transaction and finally compare the contents of the transaction to it. 

Doing this will allow your verification to change over time without the need to recompile your CorDapp. That sounds great right? I think so. If you don't, then you should, because it is definitely great 😎.

The code used in this post can be found on my [GitHub](https://github.com/lankydan/corda-csv-contract-validation).

If you enjoyed this post or found it helpful (or both) then please feel free to follow me on Twitter at [@LankyDanDev](https://twitter.com/LankyDanDev) and remember to share with anyone else who might find this useful!