'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const { assertSuccess, assertFailure } = require(`@pheasantplucker/failables-node6`);
const {
  createPublisher,
  createSubscriber,
  createTopic,
  topicExists,
  deleteTopic,
  createSubscription,
  deleteSubscription,
  subscriptionExists,
  publish,
  pull
} = require('./pubsub');
const uuid = require('uuid');

const { GC_PROJECT_ID } = process.env;

describe(`pubsub.js`, function () {
  const _createPublisher = (config = {}) => {
    const result = createPublisher(GC_PROJECT_ID);
    assertSuccess(result);
  };
  const _createSubscriber = (config = {}) => {
    const result = createSubscriber(GC_PROJECT_ID);
    assertSuccess(result);
  };

  describe(`createPublisher()`, () => {
    it(`should create a publisher`, () => {
      _createPublisher();
    });
  });

  describe(`createTopic() & topicExists() & deleteTopic()`, () => {
    const topicName = `lib_test_${uuid.v4()}`;

    _createPublisher();

    it(`should create the topic`, _asyncToGenerator(function* () {
      const result = yield createTopic(topicName);
      assertSuccess(result);
    }));

    it(`should exist`, _asyncToGenerator(function* () {
      const result = yield topicExists(topicName);
      assertSuccess(result, true);
    }));

    it(`should delete the topic`, _asyncToGenerator(function* () {
      const result = yield deleteTopic(topicName);
      assertSuccess(result, topicName);
    }));

    it(`should not exist anymore`, _asyncToGenerator(function* () {
      const result = yield topicExists(topicName);
      assertSuccess(result, false);
    }));

    it(`should fail with no topic name`, _asyncToGenerator(function* () {
      const result = yield createTopic();
      assertFailure(result);
    }));
  });

  describe(`createSubscription() & subscriptionExists() & deleteSubscription()`, () => {
    const topicName = `lib_test_topic_${uuid.v4()}`;
    const subscriptionName = `lib_test_sub_${uuid.v4()}`;
    it(`should create publisher`, _asyncToGenerator(function* () {
      _createPublisher();
    }));
    it(`should create subscriber`, _asyncToGenerator(function* () {
      _createSubscriber();
    }));

    it(`should fail without a topic`, _asyncToGenerator(function* () {
      const result = yield createSubscription('', subscriptionName);
      assertFailure(result);
    }));

    it(`should create a topic`, _asyncToGenerator(function* () {
      const result = yield createTopic(topicName);
      assertSuccess(result);
    }));

    it(`should create the subscription`, _asyncToGenerator(function* () {
      const result = yield createSubscription(topicName, subscriptionName);
      assertSuccess(result);
    }));

    it(`subscription should exist`, _asyncToGenerator(function* () {
      const result = yield subscriptionExists(subscriptionName);
      assertSuccess(result, true);
    }));

    it(`should delete the topic`, _asyncToGenerator(function* () {
      const result = yield deleteTopic(topicName);
      assertSuccess(result, topicName);
    }));

    it(`should delete the subscription`, _asyncToGenerator(function* () {
      const result = yield deleteSubscription(subscriptionName);
      assertSuccess(result, subscriptionName);
    }));

    it(`subscription should not exist`, _asyncToGenerator(function* () {
      const result = yield subscriptionExists(subscriptionName);
      assertSuccess(result, false);
    }));
  });

  describe('publish() & pull()', () => {
    const topicName = `lib_test_${uuid.v4()}`;
    const subscriptionName = `lib_test_${uuid.v4()}`;

    it(`create subscriber`, () => {
      _createSubscriber();
    });
    it(`create publisher`, () => {
      _createPublisher();
    });

    it(`should create a topic`, _asyncToGenerator(function* () {
      const result = yield createTopic(topicName);
      assertSuccess(result);
    }));

    it(`should create the subscription`, _asyncToGenerator(function* () {
      const result = yield createSubscription(topicName, subscriptionName);
      assertSuccess(result);
    }));

    it(`should publish an object message`, _asyncToGenerator(function* () {
      const message = {
        data: Buffer.from(JSON.stringify({ isMessage: true })),
        attributes: { tim: 'not in sd' }
      };
      const result = yield publish(topicName, message);
      assertSuccess(result);
    }));

    it(`should pull message`, _asyncToGenerator(function* () {
      const maxMessages = 1;
      const result = yield pull(subscriptionName, maxMessages);
      assertSuccess(result);
    }));

    it(`delete the topic`, _asyncToGenerator(function* () {
      const result = yield deleteTopic(topicName);
      assertSuccess(result);
    }));
  });
});