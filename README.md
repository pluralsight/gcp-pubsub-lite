# gcp-pubsub-lite
<a href="https://badge.fury.io/js/%40pluralsight%2Fgcp-pubsub-lite"><img src="https://badge.fury.io/js/%40pluralsight%2Fgcp-pubsub-lite.svg" alt="npm version" height="18"></a>
<img alt="GitHub Workflow Status" src="https://github.com/pluralsight/gcp-pubsub-lite/workflows/test%2C%20version%20bump%2C%20tag%2C%20npm%20publish/badge.svg">

This is a convenience library/wrapper for the [official GCP Pub/Sub library](https://github.com/googleapis/nodejs-pubsub). You supply our wrapper with the official GCP Pub/Sub library so you control which version you want to use. This way, our library will not block you from applying e.g. the latest security updates. We will keep this library up-to-date to be compatible with recent versions of the official library. Currently `@google-cloud/pubsub` versions 1.4.1+ are supported.

The official library, while full-featured, requires some deeper understanding and boilerplate to accomplish common tasks. `gcp-pubsub-lite`, for example, enables simple subscription polling and sending/receiving JSON data as shown below.

## Installation

```bash
npm i @google-cloud/pubsub @pluralsight/gcp-pubsub-lite
```


## Usage Example

```javascript
const gcpPubSub = require("@google-cloud/pubsub");
const pubsub = require("@pluralsight/gcp-pubsub-lite");

const {GCP_PROJECT_ID: gcpProjectId} = process.env;
pubsub.setup(gcpPubSub, gcpProjectId);

const topicName = "topicName";
await pubsub.createTopic(topicName);

const subName = "subName";
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
## Contributions
Pull Requests are welcome.