const {
  payload,
  assertSuccess,
  assertFailure,
} = require(`@pheasantplucker/failables`)
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
  publishJson,
  publishMany,
  publishManyJson,
  pull,
} = require('./pubsub')
const uuid = require('uuid')

const { GC_PROJECT_ID } = process.env

describe(`pubsub.js`, function() {
  const _createPublisher = (config = {}) => {
    const result = createPublisher(GC_PROJECT_ID)
    assertSuccess(result)
  }
  const _createSubscriber = (config = {}) => {
    const result = createSubscriber(GC_PROJECT_ID)
    assertSuccess(result)
  }

  describe(`createPublisher()`, () => {
    it(`should create a publisher`, () => {
      _createPublisher()
    })
  })

  describe(`createTopic() & topicExists() & deleteTopic()`, () => {
    const topicName = `lib_test_${uuid.v4()}`

    _createPublisher()

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
    it(`should create publisher`, async () => {
      _createPublisher()
    })
    it(`should create subscriber`, async () => {
      _createSubscriber()
    })

    it(`should fail without a topic`, async () => {
      const result = await createSubscription('', subscriptionName)
      assertFailure(result)
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
      const result = await deleteTopic(topicName)
      assertSuccess(result, topicName)
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

  describe('publish() & pull()', () => {
    const topicName = `lib_test_${uuid.v4()}`
    const subscriptionName = `lib_test_${uuid.v4()}`

    it(`create subscriber`, () => {
      _createSubscriber()
    })
    it(`create publisher`, () => {
      _createPublisher()
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

    it(`should pull message`, async () => {
      const maxMessages = 1
      const result = await pull(subscriptionName, maxMessages)
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

  describe(`publishMany()`, () => {
    const topicName = `lib_test_${uuid.v4()}`
    const subscriptionName = `lib_test_${uuid.v4()}`

    it(`create subscriber`, () => {
      _createSubscriber()
    })
    it(`create publisher`, () => {
      _createPublisher()
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
      const result = await pull(subscriptionName, maxMessages)
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

    it(`create subscriber`, () => {
      _createSubscriber()
    })
    it(`create publisher`, () => {
      _createPublisher()
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
        data: { isOne: true },
        attributes: { today: 'friday' },
      }
      const message2 = {
        data: { isOne: false },
        attributes: { today: 'saturday' },
      }

      const result = await publishManyJson(topicName, [message1, message2])
      assertSuccess(result, 2)
    })

    it(`should pull message`, async () => {
      const maxMessages = 2
      const result = await pull(subscriptionName, maxMessages)
      const [response] = payload(result)
      const { receivedMessages } = response
      const [msg1, msg2] = receivedMessages
      const { message: msg1Body } = msg1
      /*

      { attributes: { today: 'friday' },
            data: <Buffer 7b 22 69 73 4f 6e 65 22 3a 74 72 75 65 7d>,
            messageId: '89708341685311',
            publishTime: { seconds: '1526049152', nanos: 594000000 } }

      */
      console.log(`result:`, payload(result))
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

  describe('publishJson()', () => {
    const topicName = `lib_test_${uuid.v4()}`
    const subscriptionName = `lib_test_${uuid.v4()}`

    it(`create subscriber`, () => {
      _createSubscriber()
    })
    it(`create publisher`, () => {
      _createPublisher()
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
      const result = await pull(subscriptionName, maxMessages)
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
