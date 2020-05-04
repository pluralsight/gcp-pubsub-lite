# gcp-pubsub-lite
<a href="https://badge.fury.io/js/%40pluralsight%2Fgcp-pubsub-lite"><img src="https://badge.fury.io/js/%40pluralsight%2Fgcp-pubsub-lite.svg" alt="npm version" height="18"></a>
<img alt="GitHub Workflow Status" src="https://github.com/pluralsight/gcp-pubsub-lite/workflows/test%2C%20version%20bump%2C%20tag%2C%20npm%20publish/badge.svg">

This is a convenience library/wrapper for the [official GCP Pub/Sub library](https://github.com/googleapis/nodejs-pubsub). You supply our wrapper with the official GCP Pub/Sub library so you control which version you want to use. This way, our library will not block you from applying e.g. the latest security updates, or pinning to a previous version. We will keep this library up-to-date to be compatible with recent versions of the official library. Currently we support `@google-cloud/pubsub` versions 1.4.1+ and node.js v12+.

The official Google library, while full-featured, requires focused reading to understand and boilerplate to accomplish simple tasks. It uses an OO approach where the same things can be accomplished with different classes, in slightly different ways. By contrast, `gcp-pubsub-lite` uses simple, easy to use, functions. For example, `gcp-pubsub-lite` enables simple subscription polling and sending/receiving JSON data as shown below.

## Installation

```bash
# npm
npm i @google-cloud/pubsub @pluralsight/gcp-pubsub-lite

# yarn
yarn add @google-cloud/pubsub @pluralsight/gcp-pubsub-lite
```

## Usage Example

```javascript
const gcpPubSub = require("@google-cloud/pubsub");
const psLite = require("@pluralsight/gcp-pubsub-lite");

const {GCP_PROJECT_ID: gcpProjectId} = process.env;
psLite.setup(gcpPubSub, gcpProjectId);

const topicName = "topicName";
await psLite.createTopic(topicName); // idempotent

const subName = "subName";
await psLite.createSubscription(topicName, subName); // idempotent

const messageData = {test: true, count: 5, data: "foobar", pi: 3.14};
await psLite.publishJson(topicName, messageData);
let isPolling = true;

while (isPolling) {
    const envelopes = await psLite.pull(subName, 1);
    if (!envelopes.length) {
      // wait 500ms and try again
      await new Promise(resolve => setTimeout(resolve, 500));
      continue;
    }
    const [envelope] = envelopes;
    const {message, ackId} = envelope;
    const copyOfMessageData = psLite.jsonifyMessageData(message);

    console.log("message contains:", copyOfMessageData);
    await psLite.acknowledge(subName, [ackId]);
    isPolling = false;
}

await Promise.all([psLite.deleteSubscription(subName),
                   psLite.deleteTopic(topicName)]);

```

## Documentation
<!--automated documentation goes below here-->
### Functions

<dl>
<dt><a href="#setup">setup(gcpPubSub, projectId)</a></dt>
<dd><p>Sets up the library. This must be called before other functions in this library.</p>
</dd>
<dt><a href="#createTopic">createTopic(topicName)</a> ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code></dt>
<dd><p>Creates a Pub/Sub Topic. Idempotent.</p>
</dd>
<dt><a href="#deleteTopic">deleteTopic(topicName)</a> ⇒ <code>Promise.&lt;string&gt;</code></dt>
<dd><p>Deletes a Pub/Sub Topic.</p>
</dd>
<dt><a href="#createSubscription">createSubscription(topicName, subscriptionName, [options])</a> ⇒ <code>Promise.&lt;object&gt;</code></dt>
<dd><p>Create a Pub/Sub subscription. Idempotent.</p>
</dd>
<dt><a href="#deleteSubscription">deleteSubscription(subscriptionName)</a> ⇒ <code>Promise</code></dt>
<dd><p>Delete a Pub/Sub subscription.</p>
</dd>
<dt><a href="#publish">publish(topicName, message)</a> ⇒ <code>Promise.&lt;object&gt;</code></dt>
<dd><p>publish a message to a topic</p>
</dd>
<dt><a href="#publishJson">publishJson(topicName, message)</a> ⇒ <code>Promise.&lt;object&gt;</code></dt>
<dd><p>publish a json message to a topic</p>
</dd>
<dt><a href="#pull">pull(subscriptionName, [maxMessages], [returnImmediately])</a> ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code></dt>
<dd><p>pull messages from a topic</p>
</dd>
<dt><a href="#acknowledge">acknowledge(subscriptionName, ackIds)</a> ⇒ <code>Promise</code></dt>
<dd><p>acknowledge completion of a pulled message</p>
</dd>
<dt><a href="#subscriptionExists">subscriptionExists(subscriptionName)</a> ⇒ <code>Promise.&lt;boolean&gt;</code></dt>
<dd><p>Whether or not a subscription exists</p>
</dd>
<dt><a href="#jsonifyMessageData">jsonifyMessageData(message)</a> ⇒ <code>*</code></dt>
<dd><p>Takes a JSON pub/sub message and returns the data part as a native javascript value</p>
</dd>
<dt><a href="#topicExists">topicExists(topicName)</a> ⇒ <code>Promise.&lt;boolean&gt;</code></dt>
<dd><p>Checks whether a topic exists</p>
</dd>
<dt><a href="#getProject">getProject()</a> ⇒ <code>string</code></dt>
<dd><p>inspects this module, get what gcp project is being used</p>
</dd>
<dt><a href="#getPublisher">getPublisher()</a> ⇒ <code>PublisherClient</code></dt>
<dd><p>inspects this module, get internal google pub/sub publisher client</p>
</dd>
<dt><a href="#getSubscriber">getSubscriber()</a> ⇒ <code>SubscriberClient</code></dt>
<dd><p>inspects this module, get internal google pub/sub subscriber client</p>
</dd>
<dt><a href="#publishMany">publishMany(topicName, messages)</a> ⇒ <code>Promise.&lt;Array.&lt;PublishResponse&gt;&gt;</code></dt>
<dd><p>Publish many messages to a topic</p>
</dd>
<dt><a href="#publishManyJson">publishManyJson(topicName, messages)</a> ⇒ <code>Promise.&lt;Array.&lt;PublishResponse&gt;&gt;</code></dt>
<dd><p>Publish many json messages to a topic</p>
</dd>
</dl>

<a name="setup"></a>

### setup(gcpPubSub, projectId)
Sets up the library. This must be called before other functions in this library.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| gcpPubSub | <code>object</code> | Google Pub/Sub Library from `require("@google-cloud/pubsub")` |
| projectId | <code>string</code> | GCP project id |

<a name="createTopic"></a>

### createTopic(topicName) ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>
Creates a Pub/Sub Topic. Idempotent.

**Kind**: global function  
**Returns**: <code>Promise.&lt;Array.&lt;object&gt;&gt;</code> - returns response from Google library's topic.get(): [Topic, apiResponse], see https://googleapis.dev/nodejs/pubsub/latest/global.html#GetTopicCallback  

| Param | Type | Description |
| --- | --- | --- |
| topicName | <code>string</code> | Name of topic to create |

<a name="deleteTopic"></a>

### deleteTopic(topicName) ⇒ <code>Promise.&lt;string&gt;</code>
Deletes a Pub/Sub Topic.

**Kind**: global function  
**Returns**: <code>Promise.&lt;string&gt;</code> - returns deleted topicName  

| Param | Type | Description |
| --- | --- | --- |
| topicName | <code>string</code> | Name of topic to delete |

<a name="createSubscription"></a>

### createSubscription(topicName, subscriptionName, [options]) ⇒ <code>Promise.&lt;object&gt;</code>
Create a Pub/Sub subscription. Idempotent.

**Kind**: global function  
**Returns**: <code>Promise.&lt;object&gt;</code> - returns {success: true}  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| topicName | <code>string</code> |  | Name of topic to which the subscription attaches. Topic must exist. |
| subscriptionName | <code>string</code> |  | Name of subscription to create |
| [options] | <code>object</code> | <code>{}</code> | Options passed to GCP Lib's subscriber.createSubscription(). see https://googleapis.github.io/gax-nodejs/interfaces/CallOptions.html |

<a name="deleteSubscription"></a>

### deleteSubscription(subscriptionName) ⇒ <code>Promise</code>
Delete a Pub/Sub subscription.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| subscriptionName | <code>string</code> | Name of subscription to delete |

<a name="publish"></a>

### publish(topicName, message) ⇒ <code>Promise.&lt;object&gt;</code>
publish a message to a topic

**Kind**: global function  
**Returns**: <code>Promise.&lt;object&gt;</code> - Pub/Sub PublishResponse object, see https://googleapis.dev/nodejs/pubsub/latest/google.pubsub.v1.html#.PublishResponse  

| Param | Type | Description |
| --- | --- | --- |
| topicName | <code>string</code> | Name of topic to publish the message to |
| message | <code>PubsubMessage</code> | Message object, see https://googleapis.dev/nodejs/pubsub/latest/google.pubsub.v1.html#.PubsubMessage |
| message.data | <code>buffer</code> \| <code>object</code> \| <code>string</code> | Message data, must be compatible with Buffer.from() https://nodejs.org/docs/latest-v12.x/api/buffer.html |

<a name="publishJson"></a>

### publishJson(topicName, message) ⇒ <code>Promise.&lt;object&gt;</code>
publish a json message to a topic

**Kind**: global function  
**Returns**: <code>Promise.&lt;object&gt;</code> - Pub/Sub PublishResponse object, see https://googleapis.dev/nodejs/pubsub/latest/google.pubsub.v1.html#.PublishResponse  

| Param | Type | Description |
| --- | --- | --- |
| topicName | <code>string</code> | Name of topic to publish the message to |
| message | <code>\*</code> | javascript data to publish. Must be compatible with JSON.stringify() https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify |

<a name="pull"></a>

### pull(subscriptionName, [maxMessages], [returnImmediately]) ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>
pull messages from a topic

**Kind**: global function  
**Returns**: <code>Promise.&lt;Array.&lt;object&gt;&gt;</code> - receivedMessages, see: https://googleapis.dev/nodejs/pubsub/latest/google.pubsub.v1.html#.PullResponse  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| subscriptionName | <code>string</code> |  | Name of subscription |
| [maxMessages] | <code>number</code> | <code>1</code> | Maximum number of messages to pull |
| [returnImmediately] | <code>boolean</code> | <code>true</code> | Whether or not to return immediately. If false, waits about 5 seconds then the promise rejects |

<a name="acknowledge"></a>

### acknowledge(subscriptionName, ackIds) ⇒ <code>Promise</code>
acknowledge completion of a pulled message

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| subscriptionName | <code>string</code> | Name of subscription |
| ackIds | <code>Array.&lt;string&gt;</code> | The acknowledgment ID for the messages being acknowledged that was returned by the Pub/Sub system in the Pull response. Must not be empty. |

<a name="subscriptionExists"></a>

### subscriptionExists(subscriptionName) ⇒ <code>Promise.&lt;boolean&gt;</code>
Whether or not a subscription exists

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| subscriptionName | <code>string</code> | Name of subscription |

<a name="jsonifyMessageData"></a>

### jsonifyMessageData(message) ⇒ <code>\*</code>
Takes a JSON pub/sub message and returns the data part as a native javascript value

**Kind**: global function  
**Returns**: <code>\*</code> - native javascript value  

| Param | Type | Description |
| --- | --- | --- |
| message | <code>receivedMessage</code> | https://googleapis.dev/nodejs/pubsub/latest/google.pubsub.v1.html#.ReceivedMessage |

<a name="topicExists"></a>

### topicExists(topicName) ⇒ <code>Promise.&lt;boolean&gt;</code>
Checks whether a topic exists

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| topicName | <code>string</code> | name of the topic to check |

<a name="getProject"></a>

### getProject() ⇒ <code>string</code>
inspects this module, get what gcp project is being used

**Kind**: global function  
<a name="getPublisher"></a>

### getPublisher() ⇒ <code>PublisherClient</code>
inspects this module, get internal google pub/sub publisher client

**Kind**: global function  
**Returns**: <code>PublisherClient</code> - https://googleapis.dev/nodejs/pubsub/latest/v1.PublisherClient.html  
<a name="getSubscriber"></a>

### getSubscriber() ⇒ <code>SubscriberClient</code>
inspects this module, get internal google pub/sub subscriber client

**Kind**: global function  
**Returns**: <code>SubscriberClient</code> - https://googleapis.dev/nodejs/pubsub/latest/v1.SubscriberClient.html  
<a name="publishMany"></a>

### publishMany(topicName, messages) ⇒ <code>Promise.&lt;Array.&lt;PublishResponse&gt;&gt;</code>
Publish many messages to a topic

**Kind**: global function  
**Returns**: <code>Promise.&lt;Array.&lt;PublishResponse&gt;&gt;</code> - Pub/Sub PublishResponse objects, see https://googleapis.dev/nodejs/pubsub/latest/google.pubsub.v1.html#.PublishResponse  

| Param | Type | Description |
| --- | --- | --- |
| topicName | <code>string</code> | Name of the topic to publish to |
| messages | <code>Array.&lt;PubsubMessage&gt;</code> | Message objects to publish, see https://googleapis.dev/nodejs/pubsub/latest/google.pubsub.v1.html#.PubsubMessage |

<a name="publishManyJson"></a>

### publishManyJson(topicName, messages) ⇒ <code>Promise.&lt;Array.&lt;PublishResponse&gt;&gt;</code>
Publish many json messages to a topic

**Kind**: global function  
**Returns**: <code>Promise.&lt;Array.&lt;PublishResponse&gt;&gt;</code> - Pub/Sub PublishResponse objects, see https://googleapis.dev/nodejs/pubsub/latest/google.pubsub.v1.html#.PublishResponse  

| Param | Type | Description |
| --- | --- | --- |
| topicName | <code>string</code> | Name of the topic to publish to |
| messages | <code>Array.&lt;object&gt;</code> | message objects to publish. data value be compatible with JSON.stringify() see https://googleapis.dev/nodejs/pubsub/latest/google.pubsub.v1.html#.PubsubMessage |

<!--automated documentation goes above here-->

## Contributions
Pull Requests are welcome.
