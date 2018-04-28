const {
  failure,
  success,
  isFailure,
  payload,
} = require('@pheasantplucker/failables')
const PubSub = require('@google-cloud/pubsub')
const { pluck, contains } = require('ramda')

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
    console.log(`name:`, name)
    console.log(`topic:`, topic)
    console.log(`topicName:`, topicName)
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
  try {
    const justNames = pluck('name', allTopics)
    const exists = contains(topic, justNames)
    return success(exists)
  } catch (e) {
    return failure(e.toString())
  }
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
  const gcTopicPathResult = constructTopicPath(project, topicName)
  if (isFailure(gcTopicPathResult)) return gcTopicPathResult
  const topicPath = payload(gcTopicPathResult)
  try {
    const options = {
      name: subscriptionPath,
      topic: topicPath,
    }
    const [subscription] = subscriber.createSubscription(options)
    return success(subscription)
    // setSubscription(subscriptionName, policy)
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
  createSubscriptionClient,
}
