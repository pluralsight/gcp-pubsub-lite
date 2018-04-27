const equal = require('assert').deepEqual
const {
  assertSuccess,
  assertFailure,
  payload,
} = require(`@pheasantplucker/failables`)
const {
  createClient,
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

// const { GC_PROJECT_ID } = process.env

describe(`pubsub.js`, () => {
  const _createClient = (config = {}) => {
    // this is an example since the docs were not my favorite to navigate
    // const configExample = {
    //   projectId: '123',
    //   keyFileName: process.env.GOOGLE_APPLICATION_CREDENTIALS
    // }
    const result = createClient()
    assertSuccess(result)
  }

  describe(`createClient()`, () => {
    it(`should create a client`, () => {
      _createClient()
    })
  })

  describe(`createTopic() & topicExists() & deleteTopic()`, () => {
    const topicName = `lib_test_${uuid.v4()}`

    _createClient()

    it(`should create the topic`, async () => {
      const result = await createTopic(topicName)
      assertSuccess(result)
      // Not sure how I feel about this assertion. Gist is there, but should
      //  probably assert true equality?
      // Is referencing GC project names all over code a bad idea?
      equal(true, payload(result).includes(topicName))
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

    _createClient()

    it(`should fail without a topic`, async () => {
      const result = await createSubscription(topicName, subscriptionName)
      assertFailure(result)
    })

    it(`create a topic`, async () => {
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

    _createClient()

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
