'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const {
  failure,
  success,
  isFailure,
  payload
} = require('@pheasantplucker/failables-node6');
const PubSub = require('@google-cloud/pubsub');
const { pluck, contains } = require('ramda');

let client;
let project;
let publisher;
let subscriber;
const topics = {};
const subscriptions = {};

const getSubscription = subscriptionName => subscriptions[subscriptionName];
const setSubscription = (subscriptionName, subscription) => subscriptions[subscriptionName] = subscription;
const getTopic = topicName => topics[topicName];
const setTopic = (topicName, topic) => topics[topicName] = topic;

const constructTopicPath = (project, topicName) => {
  try {
    const topicPath = publisher.topicPath(project, topicName);
    return success(topicPath);
  } catch (e) {
    return failure(e.toString());
  }
};

const constructSubscriptionPath = (project, subscriptionName) => {
  try {
    const subscriptionPath = subscriber.subscriptionPath(project, subscriptionName);
    return success(subscriptionPath);
  } catch (e) {
    return failure(e.toString());
  }
};
/*

Refactor use of createPublisher and createSubscriber.
Have a setup function that does all the various client creations
and sets projectId and all that.

Have each client fn return the client and
then the top level fn assigns them accordingly

*/
const createPublisher = projectId => {
  project = projectId;
  try {
    publisher = new PubSub.v1.PublisherClient();
    return success(publisher);
  } catch (e) {
    return failure(e.toString());
  }
};

const createSubscriber = projectId => {
  project = projectId;
  try {
    subscriber = new PubSub.v1.SubscriberClient();
    return success(subscriber);
  } catch (e) {
    return failure(e.toString());
  }
};

const createClient = config => {
  try {
    client = new PubSub();
    return success(client);
  } catch (e) {
    return failure(e.toString());
  }
};

const createTopic = (() => {
  var _ref = _asyncToGenerator(function* (topicName) {
    try {
      const gcTopicNameResult = constructTopicPath(project, topicName);
      if (isFailure(gcTopicNameResult)) return gcTopicNameResult;
      const topicPath = payload(gcTopicNameResult);
      const [topic] = yield publisher.createTopic({ name: topicPath });
      const { name } = topic;
      setTopic(topicName, name);
      return success(topicName);
    } catch (e) {
      return failure(e.toString());
    }
  });

  return function createTopic(_x) {
    return _ref.apply(this, arguments);
  };
})();

const getAllTopics = (() => {
  var _ref2 = _asyncToGenerator(function* () {
    try {
      const projectPath = publisher.projectPath(project);
      const [resources] = yield publisher.listTopics({ project: projectPath });
      return success(resources);
    } catch (e) {
      return failure(e.toString());
    }
  });

  return function getAllTopics() {
    return _ref2.apply(this, arguments);
  };
})();

const topicExists = (() => {
  var _ref3 = _asyncToGenerator(function* (topicName) {
    const topic = getTopic(topicName);
    const getAllTopicsResult = yield getAllTopics();
    if (isFailure(getAllTopicsResult)) return getAllTopicsResult;
    const allTopics = payload(getAllTopicsResult);

    return success(propertyMatches(allTopics, 'name', topic));
  });

  return function topicExists(_x2) {
    return _ref3.apply(this, arguments);
  };
})();

const deleteTopic = (() => {
  var _ref4 = _asyncToGenerator(function* (topicName) {
    try {
      const topic = getTopic(topicName);
      yield publisher.deleteTopic({ topic });
      return success(topicName);
    } catch (e) {
      return failure(e.toString());
    }
  });

  return function deleteTopic(_x3) {
    return _ref4.apply(this, arguments);
  };
})();

const createSubscription = (() => {
  var _ref5 = _asyncToGenerator(function* (topicName, subscriptionName) {
    const gcSubscriptionPathResult = constructSubscriptionPath(project, subscriptionName);

    if (isFailure(gcSubscriptionPathResult)) return gcSubscriptionPathResult;
    const subscriptionPath = payload(gcSubscriptionPathResult);

    const topicPath = getTopic(topicName);
    try {
      const options = {
        name: subscriptionPath,
        topic: topicPath
      };
      const [subscription] = yield subscriber.createSubscription(options);
      const { name } = subscription;
      setSubscription(subscriptionName, name);
      return success(subscription);
    } catch (e) {
      return failure(e.toString());
    }
  });

  return function createSubscription(_x4, _x5) {
    return _ref5.apply(this, arguments);
  };
})();

const deleteSubscription = (() => {
  var _ref6 = _asyncToGenerator(function* (subscriptionName) {
    try {
      const subscription = getSubscription(subscriptionName);
      yield subscriber.deleteSubscription({ subscription });
      return success(subscriptionName);
    } catch (e) {
      return failure(e.toString());
    }
  });

  return function deleteSubscription(_x6) {
    return _ref6.apply(this, arguments);
  };
})();

const getAllSubscriptions = (() => {
  var _ref7 = _asyncToGenerator(function* () {
    try {
      const projectPath = subscriber.projectPath(project);
      const [resources] = yield subscriber.listSubscriptions({
        project: projectPath
      });
      return success(resources);
    } catch (e) {
      return failure(e.toString());
    }
  });

  return function getAllSubscriptions() {
    return _ref7.apply(this, arguments);
  };
})();

const subscriptionExists = (() => {
  var _ref8 = _asyncToGenerator(function* (subscriptionName) {
    const subscription = getSubscription(subscriptionName);
    const getAllSubscriptionsResult = yield getAllSubscriptions();
    if (isFailure(getAllSubscriptionsResult)) return getAllSubscriptionsResult;
    const allSubscriptions = payload(getAllSubscriptionsResult);

    return success(propertyMatches(allSubscriptions, 'name', subscription));
  });

  return function subscriptionExists(_x7) {
    return _ref8.apply(this, arguments);
  };
})();

const propertyMatches = (list, property, name) => {
  const justNames = pluck(property, list);
  return contains(name, justNames);
};

const publish = (() => {
  var _ref9 = _asyncToGenerator(function* (topicName, message) {
    const topic = getTopic(topicName);
    const request = {
      topic: topic,
      messages: [message]
    };
    try {
      const result = yield publisher.publish(request);
      return success(result);
    } catch (e) {
      return failure(e.toString());
    }
  });

  return function publish(_x8, _x9) {
    return _ref9.apply(this, arguments);
  };
})();

const pull = (() => {
  var _ref10 = _asyncToGenerator(function* (subscriptionName, maxMessages = 1) {
    const request = {
      subscription: getSubscription(subscriptionName),
      maxMessages
    };
    try {
      const result = yield subscriber.pull(request);
      return success(result);
    } catch (e) {
      return failure(e.toString());
    }
  });

  return function pull(_x10) {
    return _ref10.apply(this, arguments);
  };
})();

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
  pull
};