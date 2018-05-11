const {
  failure,
  success,
  isFailure,
  payload,
  anyFailed,
  firstFailure,
} = require('@pheasantplucker/failables')
const PubSub = require('@google-cloud/pubsub')
const { pluck, contains, map } = require('ramda')

let client
let project
let publisher
let subscriber
const topics = {}
const subscriptions = {}

const getSubscription = subscriptionName => subscriptions[subscriptionName]
const setSubscription = (subscriptionName, subscription) =>
  (subscriptions[subscriptionName] = subscription)
const getTopic = topicName => topics[topicName]
const setTopic = (topicName, topic) => (topics[topicName] = topic)

const constructTopicPath = (project, topicName) => {
  try {
    const topicPath = publisher.topicPath(project, topicName)
    return success(topicPath)
  } catch (e) {
    return failure(e.toString())
  }
}

const constructSubscriptionPath = (project, subscriptionName) => {
  try {
    const subscriptionPath = subscriber.subscriptionPath(
      project,
      subscriptionName
    )
    return success(subscriptionPath)
  } catch (e) {
    return failure(e.toString())
  }
}
/*

Refactor use of createPublisher and createSubscriber.
Have a setup function that does all the various client creations
and sets projectId and all that.

Have each client fn return the client and
then the top level fn assigns them accordingly

*/
const createPublisher = projectId => {
  project = projectId
  try {
    publisher = new PubSub.v1.PublisherClient()
    return success(publisher)
  } catch (e) {
    return failure(e.toString())
  }
}

const createSubscriber = projectId => {
  project = projectId
  try {
    subscriber = new PubSub.v1.SubscriberClient()
    return success(subscriber)
  } catch (e) {
    return failure(e.toString())
  }
}

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
    const gcTopicNameResult = constructTopicPath(project, topicName)
    if (isFailure(gcTopicNameResult)) return gcTopicNameResult
    const topicPath = payload(gcTopicNameResult)
    const [topic] = await publisher.createTopic({ name: topicPath })
    const { name } = topic
    setTopic(topicName, name)
    return success(topicName)
  } catch (e) {
    return failure(e.toString())
  }
}

const getAllTopics = async () => {
  try {
    const projectPath = publisher.projectPath(project)
    const [resources] = await publisher.listTopics({ project: projectPath })
    return success(resources)
  } catch (e) {
    return failure(e.toString())
  }
}

const topicExists = async topicName => {
  const topic = getTopic(topicName)
  const getAllTopicsResult = await getAllTopics()
  if (isFailure(getAllTopicsResult)) return getAllTopicsResult
  const allTopics = payload(getAllTopicsResult)

  return success(propertyMatches(allTopics, 'name', topic))
}

const deleteTopic = async topicName => {
  try {
    const topic = getTopic(topicName)
    await publisher.deleteTopic({ topic })
    return success(topicName)
  } catch (e) {
    return failure(e.toString())
  }
}

const createSubscription = async (topicName, subscriptionName) => {
  const gcSubscriptionPathResult = constructSubscriptionPath(
    project,
    subscriptionName
  )

  if (isFailure(gcSubscriptionPathResult)) return gcSubscriptionPathResult
  const subscriptionPath = payload(gcSubscriptionPathResult)

  const topicPath = getTopic(topicName)
  try {
    const options = {
      name: subscriptionPath,
      topic: topicPath,
    }
    const [subscription] = await subscriber.createSubscription(options)
    const { name } = subscription
    setSubscription(subscriptionName, name)
    return success(subscription)
  } catch (e) {
    return failure(e.toString())
  }
}

const deleteSubscription = async subscriptionName => {
  try {
    const subscription = getSubscription(subscriptionName)
    await subscriber.deleteSubscription({ subscription })
    return success(subscriptionName)
  } catch (e) {
    return failure(e.toString())
  }
}

const getAllSubscriptions = async () => {
  try {
    const projectPath = subscriber.projectPath(project)
    const [resources] = await subscriber.listSubscriptions({
      project: projectPath,
    })
    return success(resources)
  } catch (e) {
    return failure(e.toString())
  }
}

const subscriptionExists = async subscriptionName => {
  const subscription = getSubscription(subscriptionName)
  const getAllSubscriptionsResult = await getAllSubscriptions()
  if (isFailure(getAllSubscriptionsResult)) return getAllSubscriptionsResult
  const allSubscriptions = payload(getAllSubscriptionsResult)

  return success(propertyMatches(allSubscriptions, 'name', subscription))
}

const propertyMatches = (list, property, name) => {
  const justNames = pluck(property, list)
  return contains(name, justNames)
}

const publish = async (topicName, message) => {
  const topic = getTopic(topicName)
  const { data: messageData } = message
  const bufferedData = Buffer.from(messageData)
  const bufferedMessage = Object.assign({}, message, {
    data: bufferedData,
  })
  const request = {
    topic: topic,
    messages: [bufferedMessage],
  }
  try {
    const result = await publisher.publish(request)
    return success(result)
  } catch (e) {
    return failure(e.toString())
  }
}

const publishJson = async (topicName, message) => {
  const { data: messageData } = message
  const stringifiedData = JSON.stringify(messageData)
  const updatedMessage = Object.assign({}, message, { data: stringifiedData })
  return publish(topicName, updatedMessage)
}

const publishMany = async (topicName, messages) => {
  const promises = map(m => publish(topicName, m), messages)
  const results = await Promise.all(promises)
  if (anyFailed(results)) return firstFailure(results)
  return success(messages.length)
}

const publishManyJson = async (topicName, messages) => {
  const updatedMessages = map(
    m => Object.assign({}, m, { data: JSON.stringify(m.data) }),
    messages
  )
  return publishMany(topicName, updatedMessages)
}

const pull = async (subscriptionName, maxMessages = 1) => {
  const request = {
    subscription: getSubscription(subscriptionName),
    maxMessages,
  }
  try {
    const result = await subscriber.pull(request)
    return success(result)
  } catch (e) {
    return failure(e.toString())
  }
}

module.exports = {
  createPublisher,
  createSubscriber,
  createClient,
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
}
