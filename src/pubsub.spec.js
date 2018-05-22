const equal = require('assert').deepEqual
const {
  payload,
  assertSuccess,
  assertFailure,
} = require(`@pheasantplucker/failables`)
const {
  setProject,
  createPublisher,
  createSubscriber,
  createTopic,
  topicExists,
  deleteTopic,
  createSubscription,
  deleteSubscription,
  subscriptionExists,
  publish,
  publishJson,
  publishMany,
  publishManyJson,
  pull,
  acknowledge,
} = require('./pubsub')
const uuid = require('uuid')

const { GC_PROJECT_ID } = process.env

describe(`pubsub.js`, function() {
  describe(`createPublisher()`, () => {
    it(`should create a publisher`, () => {
      const result = createPublisher()
      assertSuccess(result)
    })
  })

  describe(`createSubscriber()`, () => {
    it(`should create a subscriber`, () => {
      const result = createSubscriber()
      assertSuccess(result)
    })
  })

  describe(`createTopic() & topicExists() & deleteTopic()`, () => {
    const topicName = `lib_test_${uuid.v4()}`

    it(`should set the project`, () => {
      setProject(GC_PROJECT_ID)
    })

    it(`should create the topic`, async () => {
      const result = await createTopic(topicName)
      assertSuccess(result)
    })

    it(`should exist`, async () => {
      const result = await topicExists(topicName)
      assertSuccess(result, true)
    })

    it(`should delete the topic`, async () => {
      const result = await deleteTopic(topicName)
      assertSuccess(result, topicName)
    })

    it(`should not exist anymore`, async () => {
      const result = await topicExists(topicName)
      assertSuccess(result, false)
    })

    it(`should fail with no topic name`, async () => {
      const result = await createTopic()
      assertFailure(result)
    })
  })

  describe(`createSubscription() & subscriptionExists() & deleteSubscription()`, () => {
    const topicName = `lib_test_topic_${uuid.v4()}`
    const subscriptionName = `lib_test_sub_${uuid.v4()}`
    const onTheFlyTopic = 'ontheflytopic'
    it(`should set the project`, () => {
      setProject(GC_PROJECT_ID)
    })

    it(`should fail without a topic`, async () => {
      const result = await createSubscription('', subscriptionName)
      assertFailure(result)
    })

    it(`should create the topic if it does not exist`, async () => {
      const result = await createSubscription(onTheFlyTopic, subscriptionName)
      assertSuccess(result)
    })

    it(`should have created the topic`, async () => {
      const result = await topicExists(onTheFlyTopic)
      assertSuccess(result)
    })

    it(`should create a topic`, async () => {
      const result = await createTopic(topicName)
      assertSuccess(result)
    })

    it(`should create the subscription`, async () => {
      const result = await createSubscription(topicName, subscriptionName)
      assertSuccess(result)
    })

    it(`subscription should exist`, async () => {
      const result = await subscriptionExists(subscriptionName)
      assertSuccess(result, true)
    })

    it(`should delete the topic`, async () => {
      const r1 = await deleteTopic(topicName)
      assertSuccess(r1, topicName)
      const r2 = await deleteTopic(onTheFlyTopic)
      assertSuccess(r2, onTheFlyTopic)
    })

    it(`should delete the subscription`, async () => {
      const result = await deleteSubscription(subscriptionName)
      assertSuccess(result, subscriptionName)
    })

    it(`subscription should not exist`, async () => {
      const result = await subscriptionExists(subscriptionName)
      assertSuccess(result, false)
    })
  })

  describe('publish() & pull() & acknowledge()', () => {
    const topicName = `lib_test_${uuid.v4()}`
    const subscriptionName = `lib_test_${uuid.v4()}`

    it(`should set the project`, () => {
      setProject(GC_PROJECT_ID)
    })

    it(`should create a topic`, async () => {
      const result = await createTopic(topicName)
      assertSuccess(result)
    })

    it(`should create the subscription`, async () => {
      const result = await createSubscription(topicName, subscriptionName)
      assertSuccess(result)
    })

    it(`should publish an object message`, async () => {
      const message = {
        data: 'la la la I am a string',
        attributes: { bikes: 'cool' },
      }
      const result = await publish(topicName, message)
      assertSuccess(result)
    })

    let ackId
    it(`should pull message`, async () => {
      const maxMessages = 1
      const returnImmediately = true
      const result = await pull(
        subscriptionName,
        maxMessages,
        returnImmediately
      )
      ackId = payload(result)[0].receivedMessages[0].ackId
      assertSuccess(result)
    })

    it(`should acknowledge the message`, async () => {
      const messageIds = [ackId]
      const result = await acknowledge(subscriptionName, messageIds)
      assertSuccess(result)
    })

    it(`should have no messages`, async () => {
      const maxMessages = 1
      const returnImmediately = true
      const result = await pull(
        subscriptionName,
        maxMessages,
        returnImmediately
      )
      const response = payload(result)
      const { receivedMessages } = response[0]
      assertSuccess(result)
      equal(receivedMessages.length, 0)
    })

    it(`delete the topic`, async () => {
      const result = await deleteTopic(topicName)
      assertSuccess(result)
    })

    it(`should delete the subscription`, async () => {
      const result = await deleteSubscription(subscriptionName)
      assertSuccess(result, subscriptionName)
    })
  })

  describe(`publishMany()`, () => {
    const topicName = `lib_test_${uuid.v4()}`
    const subscriptionName = `lib_test_${uuid.v4()}`

    it(`should set the project`, () => {
      setProject(GC_PROJECT_ID)
    })

    it(`should create a topic`, async () => {
      const result = await createTopic(topicName)
      assertSuccess(result)
    })

    it(`should create the subscription`, async () => {
      const result = await createSubscription(topicName, subscriptionName)
      assertSuccess(result)
    })

    it(`should publish many messages`, async () => {
      const message1 = {
        data: 'bleep blop bloop',
        attributes: { today: 'friday' },
      }
      const message2 = {
        data: 'hazah hazah hazah',
        attributes: { today: 'saturday' },
      }

      const result = await publishMany(topicName, [message1, message2])
      assertSuccess(result, 2)
    })

    it(`should pull message`, async () => {
      const maxMessages = 2
      const returnImmediately = true
      const result = await pull(
        subscriptionName,
        maxMessages,
        returnImmediately
      )
      assertSuccess(result)
    })

    it(`delete the topic`, async () => {
      const result = await deleteTopic(topicName)
      assertSuccess(result)
    })

    it(`should delete the subscription`, async () => {
      const result = await deleteSubscription(subscriptionName)
      assertSuccess(result, subscriptionName)
    })
  })

  describe(`publishManyJson()`, () => {
    const topicName = `lib_test_${uuid.v4()}`
    const subscriptionName = `lib_test_${uuid.v4()}`
    const message1 = {
      data: { isOne: true },
      attributes: { today: 'friday' },
    }
    const message2 = {
      data: { isOne: false },
      attributes: { today: 'saturday' },
    }

    it(`should set the project`, () => {
      setProject(GC_PROJECT_ID)
    })

    it(`should create a topic`, async () => {
      const result = await createTopic(topicName)
      assertSuccess(result)
    })

    it(`should create the subscription`, async () => {
      const result = await createSubscription(topicName, subscriptionName)
      assertSuccess(result)
    })

    it(`should publish many messages`, async () => {
      const result = await publishManyJson(topicName, [message1, message2])
      assertSuccess(result, 2)
    })

    it(`should pull message`, async () => {
      // This. Test. Is. Hideous. But I feel it needs to validate both maxMessages
      // and I don't know how I want to flatten the ugly message from GC yet.
      const expected1 = Object.assign({}, message1, {
        data: Buffer.from(JSON.stringify(message1.data)),
      })
      const expected2 = Object.assign({}, message2, {
        data: Buffer.from(JSON.stringify(message2.data)),
      })
      const maxMessages = 2
      const returnImmediately = true
      const result = await pull(
        subscriptionName,
        maxMessages,
        returnImmediately
      )
      const [response] = payload(result)
      const { receivedMessages } = response
      const [msg1, msg2] = receivedMessages
      const { message: msg1Body } = msg1
      const { message: msg2Body } = msg2
      assertSuccess(result)
      equal(expected1, { data: msg1Body.data, attributes: msg1Body.attributes })
      equal(expected2, { data: msg2Body.data, attributes: msg2Body.attributes })
    })

    it(`delete the topic`, async () => {
      const result = await deleteTopic(topicName)
      assertSuccess(result)
    })

    it(`should delete the subscription`, async () => {
      const result = await deleteSubscription(subscriptionName)
      assertSuccess(result, subscriptionName)
    })
  })

  describe('publishJson()', () => {
    const topicName = `lib_test_${uuid.v4()}`
    const subscriptionName = `lib_test_${uuid.v4()}`

    it(`should set the project`, () => {
      setProject(GC_PROJECT_ID)
    })

    it(`should create a topic`, async () => {
      const result = await createTopic(topicName)
      assertSuccess(result)
    })

    it(`should create the subscription`, async () => {
      const result = await createSubscription(topicName, subscriptionName)
      assertSuccess(result)
    })

    it(`should publish an object message`, async () => {
      const message = {
        data: { isMessage: true },
        attributes: { metal: 'is sick' },
      }
      const result = await publishJson(topicName, message)
      assertSuccess(result)
    })

    it(`should pull message`, async () => {
      const maxMessages = 1
      const returnImmediately = true
      const result = await pull(
        subscriptionName,
        maxMessages,
        returnImmediately
      )
      assertSuccess(result)
    })

    it(`delete the topic`, async () => {
      const result = await deleteTopic(topicName)
      assertSuccess(result)
    })

    it(`should delete the subscription`, async () => {
      const result = await deleteSubscription(subscriptionName)
      assertSuccess(result, subscriptionName)
    })
  })
})
