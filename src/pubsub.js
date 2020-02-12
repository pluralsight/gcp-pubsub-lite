"use strict";

let project;
let pubsub;
let publisher;
let subscriber;
let hasWarnedCredentials = false;

/**
 * Sets up the library. This must be called before other functions in this library.
 * @param {object} gcpPubSub Google Pub/Sub Library from `require("@google-cloud/pubsub")`
 * @param {string} projectId GCP project id
 */
function setup(gcpPubSub, projectId) {
  if (!gcpPubSub) {
    throw new Error("gcpPubSub required");
  }
  if (!projectId) {
    throw new Error("projectId required");
  }
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !hasWarnedCredentials) {
    // auth may also be accomplished via GCP scopes or application defaults, so warn instead of throw:
    console.warn(
      `GOOGLE_APPLICATION_CREDENTIALS env var missing, if not authed via application defaults or GCP scopes, see:
https://cloud.google.com/docs/authentication/getting-started#setting_the_environment_variable`,
    );
    hasWarnedCredentials = true;
  }

  project = projectId;
  pubsub = gcpPubSub;
  publisher = new pubsub.v1.PublisherClient();
  subscriber = new pubsub.v1.SubscriberClient();
}

/**
 * Creates a Pub/Sub Topic. Idempotent.
 * @param {string} topicName Name of topic to create
 * @returns {Promise<object[]>} returns response from Google library's topic.get(): [Topic, apiResponse], see https://googleapis.dev/nodejs/pubsub/latest/global.html#GetTopicCallback
 */
async function createTopic(topicName) {
  const client = new pubsub.PubSub({projectId: project});
  const topic = client.topic(topicName);
  return topic.get({autoCreate: true});
}

/**
 * Deletes a Pub/Sub Topic.
 * @param {string} topicName Name of topic to delete
 * @returns {Promise<string>} returns deleted topicName
 */
async function deleteTopic(topicName) {
  const topic = publisher.topicPath(project, topicName);
  await publisher.deleteTopic({topic});
  return topicName;
}

/**
 * Create a Pub/Sub subscription. Idempotent.
 * @param {string} topicName Name of topic to which the subscription attaches. Topic must exist.
 * @param {string} subscriptionName Name of subscription to create
 * @param {object} [options={}] Options passed to GCP Lib's subscriber.createSubscription(). see https://googleapis.github.io/gax-nodejs/interfaces/CallOptions.html
 * @returns {Promise<object>} returns {success: true}
 */
async function createSubscription(topicName, subscriptionName, options = {}) {
  const subscritionExists = await subscriptionExists(subscriptionName);
  if (subscritionExists) {
    console.info(`pubsub subscription ${subscriptionName} already exists`);
    return {success: true};
  }

  const request = {
    name: subscriber.subscriptionPath(project, subscriptionName),
    topic: publisher.topicPath(project, topicName),
  };
  const allOptions = {...request, ...options};
  await subscriber.createSubscription(allOptions);
  return {success: true};
}

/**
 * Delete a Pub/Sub subscription.
 * @param {string} subscriptionName Name of subscription to delete
 * @returns {Promise}
 */
async function deleteSubscription(subscriptionName) {
  const subscription = subscriber.subscriptionPath(project, subscriptionName);

  return subscriber.deleteSubscription({subscription});
}

/**
 * publish a message to a topic
 * @param {string} topicName Name of topic to publish the message to
 * @param {PubsubMessage} message Message object, see https://googleapis.dev/nodejs/pubsub/latest/google.pubsub.v1.html#.PubsubMessage
 * @param {buffer|object|string} message.data Message data, must be compatible with Buffer.from() https://nodejs.org/docs/latest-v12.x/api/buffer.html
 * @returns {Promise<object>} Pub/Sub PublishResponse object, see https://googleapis.dev/nodejs/pubsub/latest/google.pubsub.v1.html#.PublishResponse
 */
async function publish(topicName, message) {
  const topic = publisher.topicPath(project, topicName);
  const {data: messageData} = message;
  const bufferedData = Buffer.from(messageData);
  const bufferedMessage = {...message, data: bufferedData};
  const request = {
    topic,
    messages: [bufferedMessage],
  };

  return publisher.publish(request);
}

/**
 * publish a json message to a topic
 * @param {string} topicName Name of topic to publish the message to
 * @param {*} message javascript data to publish. Must be compatible with JSON.stringify() https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
 * @returns {Promise<object>} Pub/Sub PublishResponse object, see https://googleapis.dev/nodejs/pubsub/latest/google.pubsub.v1.html#.PublishResponse
 */
async function publishJson(topicName, message) {
  const stringifiedData = JSON.stringify(message);
  const updatedMessage = {data: stringifiedData};
  return publish(topicName, updatedMessage);
}

/**
 * pull messages from a topic
 * @param {string} subscriptionName Name of subscription
 * @param {number} [maxMessages=1] Maximum number of messages to pull
 * @param {boolean} [returnImmediately=true] Whether or not to return immediately. If false, waits about 5 seconds then the promise rejects
 * @returns {Promise<object[]>} receivedMessages, see: https://googleapis.dev/nodejs/pubsub/latest/google.pubsub.v1.html#.PullResponse
 */
async function pull(subscriptionName, maxMessages = 1, returnImmediately = true) {
  const request = {
    subscription: subscriber.subscriptionPath(project, subscriptionName),
    maxMessages,
    returnImmediately,
  };
  const [response] = await subscriber.pull(request);
  return response.receivedMessages;
}

/**
 * acknowledge completion of a pulled message
 * @param {string} subscriptionName Name of subscription
 * @param {string[]} ackIds The acknowledgment ID for the messages being acknowledged that was returned by the Pub/Sub system in the Pull response. Must not be empty.
 * @returns {Promise}
 */
async function acknowledge(subscriptionName, ackIds) {
  if (!Array.isArray(ackIds)) {
    ackIds = [ackIds];
  }
  const request = {
    subscription: subscriber.subscriptionPath(project, subscriptionName),
    ackIds,
  };
  return subscriber.acknowledge(request);
}

/**
 * Whether or not a subscription exists
 * @param {string} subscriptionName Name of subscription
 * @returns {Promise<boolean>}
 */
async function subscriptionExists(subscriptionName) {
  const subscriptionPath = subscriber.subscriptionPath(project, subscriptionName);
  // https://github.com/grpc/grpc/blob/master/doc/statuscodes.md
  const GRPC_ERROR_NOT_FOUND = 5;
  const [subscription] = await subscriber
    .getSubscription({subscription: subscriptionPath})
    .catch(err => {
      if (err.code === GRPC_ERROR_NOT_FOUND) {
        return [null];
      }
      throw err;
    });
  return Boolean(subscription);
}

/**
 * Takes a pub/sub message and returns the data part in json format
 * @param {receivedMessage} message https://googleapis.dev/nodejs/pubsub/latest/google.pubsub.v1.html#.ReceivedMessage
 * @returns {*} json-formatted message data
 */
function jsonifyMessageData(message) {
  const {data} = message;
  const jsonString = data.toString("utf8");
  return JSON.parse(jsonString);
}

/**
 * Checks whether a topic exists
 * @param {string} topicName name of the topic to check
 * @returns {Promise<boolean>}
 */
async function topicExists(topicName) {
  const topic = new pubsub.PubSub().topic(topicName);
  const [exists] = await topic.exists();
  return exists;
}

/**
 * inspects this module, get what gcp project is being used
 * @returns {string}
 */
function getProject() {
  return project;
}

/**
 * inspects this module, get internal google pub/sub publisher client
 * @returns {PublisherClient} https://googleapis.dev/nodejs/pubsub/latest/v1.PublisherClient.html
 */
function getPublisher() {
  return publisher;
}

/**
 * inspects this module, get internal google pub/sub subscriber client
 * @returns {SubscriberClient} https://googleapis.dev/nodejs/pubsub/latest/v1.SubscriberClient.html
 */
function getSubscriber() {
  return subscriber;
}

/**
 * Publish many messages to a topic
 * @param {string} topicName Name of the topic to publish to
 * @param {PubsubMessage[]} messages Message objects to publish, see https://googleapis.dev/nodejs/pubsub/latest/google.pubsub.v1.html#.PubsubMessage
 * @returns {Promise<PublishResponse[]>} Pub/Sub PublishResponse objects, see https://googleapis.dev/nodejs/pubsub/latest/google.pubsub.v1.html#.PublishResponse
 */
async function publishMany(topicName, messages) {
  const promises = [];
  for (let i = 0; i < messages.length; i++) {
    // batching is done internally in the google pub/sub library
    // so this does not necessarily result in multiple requests over the wire
    promises.push(publish(topicName, messages[i]));
  }
  await Promise.all(promises);
}

/**
 * Publish many json messages to a topic
 * @param {string} topicName Name of the topic to publish to
 * @param {object[]} messages message objects to publish. data value be compatible with JSON.stringify() see https://googleapis.dev/nodejs/pubsub/latest/google.pubsub.v1.html#.PubsubMessage
 * @returns {Promise<PublishResponse[]>} Pub/Sub PublishResponse objects, see https://googleapis.dev/nodejs/pubsub/latest/google.pubsub.v1.html#.PublishResponse
 */
async function publishManyJson(topicName, messages) {
  const updatedMessages = messages.map(m => ({...m, data: JSON.stringify(m.data)}));
  return publishMany(topicName, updatedMessages);
}

module.exports = {
  acknowledge,
  createSubscription,
  createTopic,
  deleteSubscription,
  deleteTopic,
  getProject,
  getPublisher,
  getSubscriber,
  jsonifyMessageData,
  publish,
  publishJson,
  publishMany,
  publishManyJson,
  pull,
  setup,
  subscriptionExists,
  topicExists,
};
