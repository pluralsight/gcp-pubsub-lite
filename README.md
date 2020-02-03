# gcp-pubsub-lite
Wrapper for GCP Pub/Sub library. The aim is to be easier and simpler to use than the [official GCP Pub/Sub library](https://github.com/googleapis/nodejs-pubsub) [(docs)](https://googleapis.dev/nodejs/pubsub/latest/index.html). You supply the GCP pubsub library so you control which version you want to use. Look at `packages.json` to see what we've tested against.

In particular, this library enables simple subscription polling and sending/receiving JSON data as shown below.

## Installation

```bash
npm i @google-cloud/pubsub gcp-pubsub-lite
```


## Usage Example

```javascript
const gcpPubSub = require("@google-cloud/pubsub");
const pubsub = require("@pluralsight/gcp-pubsub-lite");

const {GCP_PROJECT_ID: gcpProjectId} = process.env;

const topicName = "topicName";
const subName = "subName";
pubsub.setup(gcpPubSub, gcpProjectId);

await pubsub.createTopic(topicName);
await pubsub.createSubscription(topicName, subName);

const messageData = {test: true, count: 5, data: "foobar", pi: 3.14};
await pubsub.publishJson(topicName, messageData);
let isPolling = true

while (isPolling) {
    let envelopes = []
    envelopes = await pubsub.pull(subName, 1);
    if (!envelopes.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
      continue;
    }
    const [envelope] = envelopes;
    const {message, ackId} = envelope;
    const copyOfMessageData = pubsub.jsonifyMessageData(message);

    console.log("message", copyOfMessageData);
    await pubsub.acknowledge(subName, [ackId]);
}

await Promise.all([pubsub.deleteSubscription(subName),
                   pubsub.deleteTopic(topicName)]);

```
