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

let project
let publisher
let subscriber

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

const createTopic = async topicName => {
  try {
    const topic = publisher.topicPath(project, topicName)
    const result = await publisher.createTopic({ name: topic })
    return success(result)
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
  const topic = publisher.topicPath(project, topicName)
  const getAllTopicsResult = await getAllTopics()
  if (isFailure(getAllTopicsResult)) return getAllTopicsResult
  const allTopics = payload(getAllTopicsResult)

  return success(propertyMatches(allTopics, 'name', topic))
}

const deleteTopic = async topicName => {
  try {
    const topic = publisher.topicPath(project, topicName)
    await publisher.deleteTopic({ topic })
    return success(topicName)
  } catch (e) {
    return failure(e.toString())
  }
}

const createSubscription = async (topicName, subscriptionName) => {
  try {
    const options = {
      name: subscriber.subscriptionPath(project, subscriptionName),
      topic: publisher.topicPath(project, topicName),
    }
    const result = await subscriber.createSubscription(options)
    return success(result)
  } catch (e) {
    return failure(e.toString())
  }
}

const deleteSubscription = async subscriptionName => {
  try {
    const subscription = subscriber.subscriptionPath(project, subscriptionName)
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
  const subscription = subscriber.subscriptionPath(project, subscriptionName)
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
  const topic = publisher.topicPath(project, topicName)
  const { data: messageData } = message
  const bufferedData = Buffer.from(messageData)
  const bufferedMessage = Object.assign({}, message, {
    data: bufferedData,
  })
  const request = {
    topic,
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

const pull = async (
  subscriptionName,
  maxMessages = 1,
  returnImmediately = true
) => {
  const request = {
    subscription: subscriber.subscriptionPath(project, subscriptionName),
    maxMessages,
    returnImmediately,
  }
  try {
    const result = await subscriber.pull(request)
    return success(result)
  } catch (e) {
    return failure(e.toString())
  }
}

const acknowledge = async (subscriptionName, ackIds) => {
  const request = {
    subscription: subscriber.subscriptionPath(project, subscriptionName),
    ackIds,
  }
  try {
    const result = await subscriber.acknowledge(request)
    return success(result)
  } catch (e) {
    return failure(e.toString())
  }
}

module.exports = {
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
}
