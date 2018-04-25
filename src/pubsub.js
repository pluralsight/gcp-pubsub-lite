const { failure, success } = require(`@pheasantplucker/failables`)
const PubSub = require('@google-cloud/pubsub')

let client
let topics = {}
let subscriptions = {}

const createClient = config => {
  try {
    client = new PubSub(config)
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
    topics[topicName] = topicPolicy
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
    const topic = topics[topicName]
    const result = await topic.exists()
    const [exists] = result
    return success(exists)
  } catch (e) {
    return failure(e.toString())
  }
}

const deleteTopic = async topicName => {
  try {
    const topic = topics[topicName]
    const result = await topic.delete()
    return success(topicName)
  } catch (e) {
    return failure(e.toString())
  }
}

const createSubscription = async (topicName, subscriptionName) => {
  try {
    const topic = topics[topicName]
    const result = await topic.createSubscription(subscriptionName, {})
    const [policy, subscription] = result
    subscriptions[subscriptionName] = policy
    return success(subscription)
  } catch (e) {
    return failure(e.toString())
  }
}

const deleteSubscription = async subscriptionName => {
  try {
    const subscription = subscriptions[subscriptionName]
    const result = await subscription.delete()
    return success(subscriptionName)
  } catch (e) {
    return failure(e.toString())
  }
}

const subscriptionExists = async subscriptionName => {
  try {
    const subscription = subscriptions[subscriptionName]
    const result = await subscription.exists()
    const [exists] = result
    return success(exists)
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
}
