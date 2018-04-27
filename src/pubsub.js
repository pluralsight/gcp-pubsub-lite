const { failure, success } = require('@pheasantplucker/failables')
const PubSub = require('@google-cloud/pubsub')

let client
const topics = {}
const subscriptions = {}

const getSubscription = subscriptionName => subscriptions[subscriptionName]
const setSubscription = (subscriptionName, subscription) =>
  (subscriptions[subscriptionName] = subscription)
const getTopic = topicName => topics[topicName]
const setTopic = (topicName, topic) => (topics[topicName] = topic)

const createClient = config => {
  try {
    client = new PubSub()
    return success(client)
  } catch (e) {
    return failure(e.toString())
  }
}

const createTopic = async topicName => {
  try {
    const result = client.topic(topicName)
    const createResult = await result.create()
    const [topicPolicy, topic] = createResult
    const { name } = topic
    setTopic(topicName, topicPolicy)
    return success(name)
  } catch (e) {
    return failure(e.toString())
  }
}

const createTopic2 = async topic => {
  try {
    const result = await client.createTopic(topic)
    return success(result)
  } catch (e) {
    return failure(e.toString())
  }
}

const topicExists = async topicName => {
  try {
    const topic = getTopic(topicName)
    const result = await topic.exists()
    const [exists] = result
    return success(exists)
  } catch (e) {
    return failure(e.toString())
  }
}

const deleteTopic = async topicName => {
  try {
    const topic = getTopic(topicName)
    await topic.delete()
    return success(topicName)
  } catch (e) {
    return failure(e.toString())
  }
}

const createSubscription = async (topicName, subscriptionName) => {
  try {
    const topic = getTopic(topicName)
    const result = await topic.createSubscription(subscriptionName, {})
    const [policy, subscription] = result
    setSubscription(subscriptionName, policy)
    return success(subscription)
  } catch (e) {
    return failure(e.toString())
  }
}

const deleteSubscription = async subscriptionName => {
  try {
    const subscription = getSubscription(subscriptionName)
    await subscription.delete()
    return success(subscriptionName)
  } catch (e) {
    return failure(e.toString())
  }
}

const subscriptionExists = async subscriptionName => {
  try {
    const subscription = getSubscription(subscriptionName)
    const result = await subscription.exists()
    const [exists] = result
    return success(exists)
  } catch (e) {
    return failure(e.toString())
  }
}

const publish = async (topicName, message) => {
  const buffered = Buffer.from(JSON.stringify(message))
  try {
    const topic = getTopic(topicName)
    const publisher = topic.publisher()
    const result = await publisher.publish(buffered)
    return success({ messageId: result })
  } catch (e) {
    return failure(e.toString())
  }
}

const createSubscriptionClient = async () => {
  try {
    const client = new PubSub.v1.SubscriberClient()
    return success(client)
  } catch (e) {
    return failure(e.toString())
  }
}

module.exports = {
  createClient,
  createTopic,
  topicExists,
  deleteTopic,
  createSubscription,
  deleteSubscription,
  subscriptionExists,
  publish,
  createSubscriptionClient,
}
