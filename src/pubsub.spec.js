const { assertSuccess, assertFailure } = require(`@pheasantplucker/failables`)
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
  createSubscriptionClient,
} = require('./pubsub')
const uuid = require('uuid')

const { GC_PROJECT_ID } = process.env

describe(`pubsub.js`, () => {
  const _createPublisher = (config = {}) => {
    it(`should create a publisher`, async () => {
      const result = createPublisher(GC_PROJECT_ID)
      assertSuccess(result)
    })
  }
  const _createSubscriber = (config = {}) => {
    it(`should create a subscriber`, async () => {
      const result = createSubscriber(GC_PROJECT_ID)
      assertSuccess(result)
    })
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

  describe.only(`createSubscription() & subscriptionExists() & deleteSubscription()`, () => {
    const topicName = `lib_test_topic_${uuid.v4()}`
    const subscriptionName = `lib_test_sub_${uuid.v4()}`
    // If _createSubscriber() is called, you get errors about unable to find resources.
    // With both _createPublisher && _createSubscriber called, the `createTopic` test breaks over
    // unable to find resource stuff.
    // Removing the _createSubscriber call fixes it. This appears due to clashing of the two clients
    // which is obnoxious. They do allow for config to be passed, so directing to different ports may be the key
    // Action Item:
    // => for _only_ the createSubscriber function, pass in config to direct to a different port than that of default.
    // => add back in the call to _createSubscriber below and see if the test `createTopic` in this block passes.
    // => if so, update both functions to have configurable ports, but add defaults that prevent clashing.
    // => if not, then fuckin a man, look at other config options for the pubsub.v1.subscriberclient and pubsub.v1.publisherclient

    _createPublisher()
    // _createSubscriber()

    it(`should fail without a topic`, async () => {
      const result = await createSubscription(topicName, subscriptionName)
      assertFailure(result)
    })

    it(`create a topic -->>>> This is the test that fails when createPublisher and createSubscriber are called`, async () => {
      const result = await createTopic(topicName)
      console.log(`test result:`, result)
      assertSuccess(result)
    })

    it.skip(`should create the subscription`, async () => {
      const result = await createSubscription(topicName, subscriptionName)
      console.log(`result:`, result)
      assertSuccess(result)
    })

    it.skip(`subscription should exist`, async () => {
      const result = await subscriptionExists(subscriptionName)
      assertSuccess(result, true)
    })

    it.skip(`should delete the topic`, async () => {
      const result = await deleteTopic(topicName)
      assertSuccess(result, topicName)
    })

    it.skip(`should delete the subscription`, async () => {
      const result = await deleteSubscription(subscriptionName)
      assertSuccess(result, subscriptionName)
    })

    it.skip(`subscription should not exist`, async () => {
      const result = await subscriptionExists(subscriptionName)
      assertSuccess(result, false)
    })
  })

  describe('publish() & pull()', () => {
    const topicName = `lib_test_${uuid.v4()}`

    _createPublisher()

    it(`create a topic`, async () => {
      const result = await createTopic(topicName)
      assertSuccess(result)
    })

    it(`should publish an object message`, async () => {
      const message = { isMessage: true }
      const result = await publish(topicName, message)
      assertSuccess(result)
    })

    it.skip(`should pull message`, async () => {
      // const result = await pull()
    })

    it(`should publish a string message`, async () => {
      const message = 'hello '
      const result = await publish(topicName, message)
      assertSuccess(result)
    })

    it(`delete the topic`, async () => {
      const result = await deleteTopic(topicName)
      assertSuccess(result)
    })
  })

  describe(`createSubscriptionClient()`, () => {
    it(`should create that client`, async () => {
      const result = await createSubscriptionClient()
      assertSuccess(result)
    })
  })
})
