"use strict";

const assert = require("assert");

const gcpPubSub = require("@google-cloud/pubsub");

const pubsub = require("../src/pubsub");

const {GCP_PROJECT_ID: gcpProjectId} = process.env;

pubsub.setup(gcpPubSub, gcpProjectId);

function makeRandInt(min = 1, max = 1000000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

describe("pubsub topic creation and subscription", function des() {
  this.timeout(20000);

  const testNum = makeRandInt(1, 1000000);
  const pubsubTopic = `exp.test.pubsub.dvs.anastomosis.${testNum}`;
  const pubsubSub = `exp.test.pubsub.dvs.anastomosis.${testNum}`;

  before(async () => {
    await pubsub.createTopic(pubsubTopic);
    await pubsub.createSubscription(pubsubTopic, pubsubSub);
  });

  after(async () => {
    await Promise.all([pubsub.deleteSubscription(pubsubSub), pubsub.deleteTopic(pubsubTopic)]);
  });

  const originalMessage = {test: true, count: 5, data: "foobar", pi: 3.14};

  it("read and write to pubsub", async () => {
    await pubsub.publishJson(pubsubTopic, originalMessage);
    const [envelope] = await pubsub.pull(pubsubSub, 1, false);
    const message = pubsub.jsonifyMessageData(envelope.message);
    assert.deepStrictEqual(message, originalMessage);
  });
});

describe(`pubsub.js`, function des() {
  this.timeout(20000);

  it(`should create a publisher and subscriber`, () => {
    pubsub.setup(gcpPubSub, gcpProjectId);
    assert(pubsub.getProject());
    assert(pubsub.getPublisher());
    assert(pubsub.getSubscriber());
  });

  describe(`pubsub.createTopic() & pubsub.topicExists() & pubsub.deleteTopic()`, () => {
    const testNum = makeRandInt(1, 1000000);
    const topicName = `pubsubWrapper-system-test-${testNum}`;

    after(async () => {
      await pubsub.deleteTopic(topicName).catch(() => {});
    });

    it(`should create the topic`, async () => {
      await pubsub.createTopic(topicName);
    });

    it(`should exist`, async () => {
      const exists = await pubsub.topicExists(topicName);
      assert(exists === true);
    });

    it(`should delete the topic`, async () => {
      await pubsub.deleteTopic(topicName);
    });

    it(`should not exist anymore`, async () => {
      const exists = await pubsub.topicExists(topicName);
      assert(exists === false);
    });

    it(`should fail with no topic name`, async () => {
      try {
        await pubsub.createTopic();
      } catch (error) {
        assert(error);
      }
    });
  });

  describe(`pubsub.createSubscription() & pubsub.subscriptionExists() & pubsub.deleteSubscription()`, () => {
    this.timeout(20000);
    const testNum = makeRandInt(1, 1000000);

    const topicName = `pubsubWrapper-system-test-topic-${testNum}`;
    const subscriptionName = `pubsubWrapper-system-test-sub-${testNum}`;
    const onTheFlyTopic = "ontheflytopic";

    after(async () => {
      await Promise.all([
        pubsub.deleteSubscription(subscriptionName),
        pubsub.deleteTopic(topicName),
      ]).catch(() => {});
    });

    it(`should set the project`, () => {
      pubsub.setup(gcpPubSub, gcpProjectId);
      assert(pubsub.getProject());
      assert(pubsub.getPublisher());
      assert(pubsub.getSubscriber());
    });

    it(`should fail without a topic`, async () => {
      let error;
      try {
        await pubsub.createSubscription("", subscriptionName);
      } catch (e) {
        error = e;
      }
      assert(error);
    });

    it(`should not create the topic if it does not exist`, async () => {
      let error;

      try {
        await pubsub.createSubscription(onTheFlyTopic, subscriptionName);
      } catch (e) {
        error = e;
      }
      assert(error);
    });

    it(`should create a topic`, async () => {
      await pubsub.createTopic(topicName);
    });

    it(`should create the subscription`, async () => {
      await pubsub.createSubscription(topicName, subscriptionName);
    });

    it(`subscription should exist`, async () => {
      const exists = await pubsub.subscriptionExists(subscriptionName);
      assert(exists === true);
    });

    it(`should delete the topic`, async () => {
      await pubsub.deleteTopic(topicName);
    });

    it(`should delete the subscription`, async () => {
      await pubsub.deleteSubscription(subscriptionName);
    });

    it(`subscription should not exist`, async () => {
      const exists = await pubsub.subscriptionExists(subscriptionName);
      assert(exists === false);
    });
  });

  describe("publish() & pubsub.pull() & acknowledge()", () => {
    this.timeout(20000);

    const testNum = makeRandInt(1, 1000000);
    const topicName = `pubsubWrapper-system-test-${testNum}`;
    const subscriptionName = `pubsubWrapper-system-test-${testNum}`;

    after(async () => {
      await Promise.all([
        pubsub.deleteSubscription(subscriptionName),
        pubsub.deleteTopic(topicName),
      ]).catch(() => {});
    });

    it(`should set the project`, () => {
      pubsub.setup(gcpPubSub, gcpProjectId);
      assert(pubsub.getProject());
      assert(pubsub.getPublisher());
      assert(pubsub.getSubscriber());
    });

    it(`should create a topic`, async () => {
      await pubsub.createTopic(topicName);
    });

    it(`should create the subscription`, async () => {
      await pubsub.createSubscription(topicName, subscriptionName);
    });

    it(`should publish an object message`, async () => {
      const message = {
        data: "la la la I am a string",
        attributes: {bikes: "cool"},
      };
      await pubsub.publish(topicName, message);
    });

    let ackId;
    it(`should pull message`, async () => {
      const maxMessages = 1;
      const returnImmediately = true;
      const [envelope] = await pubsub.pull(subscriptionName, maxMessages, returnImmediately);
      ackId = envelope.ackId;
      assert(ackId);
    });

    it(`should acknowledge the message`, async () => {
      await pubsub.acknowledge(subscriptionName, ackId);
    });

    it(`should have no messages`, async () => {
      const maxMessages = 1;
      const returnImmediately = true;
      const envelopes = await pubsub.pull(subscriptionName, maxMessages, returnImmediately);
      assert(envelopes.length === 0);
    });

    it(`delete the topic`, async () => {
      await pubsub.deleteTopic(topicName);
    });

    it(`should delete the subscription`, async () => {
      await pubsub.deleteSubscription(subscriptionName);
    });
  });

  describe(`pubsub.publishMany()`, () => {
    this.timeout(20000);

    const testNum = makeRandInt();
    const topicName = `pubsubWrapper-system-test-${testNum}`;
    const subscriptionName = `pubsubWrapper-system-test-${testNum}`;

    after(async () => {
      await Promise.all([
        pubsub.deleteSubscription(subscriptionName),
        pubsub.deleteTopic(topicName),
      ]).catch(() => {});
    });

    it(`should set the project`, () => {
      pubsub.setup(gcpPubSub, gcpProjectId);
      assert(pubsub.getProject());
      assert(pubsub.getPublisher());
      assert(pubsub.getSubscriber());
    });

    it(`should create a topic`, async () => {
      await pubsub.createTopic(topicName);
    });

    it(`should create the subscription`, async () => {
      await pubsub.createSubscription(topicName, subscriptionName);
    });

    it(`should publish many messages`, async () => {
      const message1 = {
        data: "bleep blop bloop",
        attributes: {today: "friday"},
      };
      const message2 = {
        data: "hazah hazah hazah",
        attributes: {today: "saturday"},
      };

      await pubsub.publishMany(topicName, [message1, message2]);
    });

    it(`should pull message`, async () => {
      const maxMessages = 2;
      const returnImmediately = true;
      const envelopes = await pubsub.pull(subscriptionName, maxMessages, returnImmediately);
      assert(envelopes.length === 2);
    });

    it(`delete the topic`, async () => {
      await pubsub.deleteTopic(topicName);
    });

    it(`should delete the subscription`, async () => {
      await pubsub.deleteSubscription(subscriptionName);
    });
  });

  describe(`pubsub.publishManyJson()`, () => {
    this.timeout(20000);

    const testNum = makeRandInt();
    const topicName = `pubsubWrapper-system-test-${testNum}`;
    const subscriptionName = `pubsubWrapper-system-test-${testNum}`;
    const message1 = {
      data: {isOne: true},
      attributes: {today: "friday"},
    };
    const message2 = {
      data: {isOne: false},
      attributes: {today: "saturday"},
    };

    after(async () => {
      await Promise.all([
        pubsub.deleteSubscription(subscriptionName),
        pubsub.deleteTopic(topicName),
      ]).catch(() => {});
    });

    it(`should set the project`, () => {
      pubsub.setup(gcpPubSub, gcpProjectId);
      assert(pubsub.getProject());
      assert(pubsub.getPublisher());
      assert(pubsub.getSubscriber());
    });

    it(`should create a topic`, async () => {
      await pubsub.createTopic(topicName);
    });

    it(`should create the subscription`, async () => {
      await pubsub.createSubscription(topicName, subscriptionName);
    });

    it(`should publish many messages`, async () => {
      await pubsub.publishManyJson(topicName, [message1, message2]);
    });

    it(`should pull messages`, async () => {
      const expected1 = {...message1, data: Buffer.from(JSON.stringify(message1.data))};
      const expected2 = {...message2, data: Buffer.from(JSON.stringify(message2.data))};
      const maxMessages = 2;
      const returnImmediately = true;
      const envelopes = await pubsub.pull(subscriptionName, maxMessages, returnImmediately);
      const [env1, env2] = envelopes;
      const {message: env1Body} = env1;
      const {message: env2Body} = env2;
      assert.deepStrictEqual(expected1, {data: env1Body.data, attributes: env1Body.attributes});
      assert.deepStrictEqual(expected2, {data: env2Body.data, attributes: env2Body.attributes});
    });

    it(`delete the topic`, async () => {
      await pubsub.deleteTopic(topicName);
    });

    it(`should delete the subscription`, async () => {
      await pubsub.deleteSubscription(subscriptionName);
    });
  });

  describe("pubsub.publishJson()", () => {
    this.timeout(20000);

    const testNum = makeRandInt();
    const topicName = `pubsubWrapper-system-test-${testNum}`;
    const subscriptionName = `pubsubWrapper-system-test-${testNum}`;

    it(`should set the project`, () => {
      pubsub.setup(gcpPubSub, gcpProjectId);
      assert(pubsub.getProject());
      assert(pubsub.getPublisher());
      assert(pubsub.getSubscriber());
    });

    it(`should create a topic`, async () => {
      await pubsub.createTopic(topicName);
    });

    it(`should create the subscription`, async () => {
      await pubsub.createSubscription(topicName, subscriptionName);
    });

    it(`should publish an object message`, async () => {
      const message = {
        data: {isMessage: true},
        attributes: {metal: "is sick"},
      };
      await pubsub.publishJson(topicName, message);
    });

    it(`should pull message`, async () => {
      const maxMessages = 1;
      const returnImmediately = true;
      await pubsub.pull(subscriptionName, maxMessages, returnImmediately);
    });

    it(`delete the topic`, async () => {
      await pubsub.deleteTopic(topicName);
    });

    it(`should delete the subscription`, async () => {
      await pubsub.deleteSubscription(subscriptionName);
    });
  });
});
