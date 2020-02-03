"use strict";

let project;
let pubsub;
let publisher;
let subscriber;
let hasWarnedCredentials = false;

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

async function createTopic(topicName) {
  const client = new pubsub.PubSub({projectId: project});
  const topic = client.topic(topicName);
  return topic.get({autoCreate: true});
}

async function deleteTopic(topicName) {
  const topic = publisher.topicPath(project, topicName);
  await publisher.deleteTopic({topic});
  return topicName;
}

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

async function deleteSubscription(subscriptionName) {
  const subscription = subscriber.subscriptionPath(project, subscriptionName);

  return subscriber.deleteSubscription({subscription});
}

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

async function publishJson(topicName, message) {
  const stringifiedData = JSON.stringify(message);
  const updatedMessage = {data: stringifiedData};
  return publish(topicName, updatedMessage);
}

// careful when returnImmediately = false,
// the google library only waits ~5s before rejection
async function pull(subscriptionName, maxMessages = 1, returnImmediately = true) {
  const request = {
    subscription: subscriber.subscriptionPath(project, subscriptionName),
    maxMessages,
    returnImmediately,
  };
  const [response] = await subscriber.pull(request);
  return response.receivedMessages;
}

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

function jsonifyMessageData(message) {
  const {data} = message;
  const jsonString = data.toString("utf8");
  return JSON.parse(jsonString);
}

async function topicExists(topicName) {
  const topic = new pubsub.PubSub().topic(topicName);
  const [exists] = await topic.exists();
  return exists;
}

function getProject() {
  return project;
}

function getPublisher() {
  return publisher;
}

function getSubscriber() {
  return subscriber;
}

async function publishMany(topicName, messages) {
  const promises = [];
  for (let i = 0; i < messages.length; i++) {
    // batching is done internally in the google pub/sub library
    // so this does not necessarily result in multiple requests over the wire
    promises.push(publish(topicName, messages[i]));
  }
  await Promise.all(promises);
}

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
