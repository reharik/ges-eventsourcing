"use strict";

module.exports = function(esClient, gesConnection, logger ) {
  return function eventstore(options) {

    const credentialsForAllEventsStream = new esClient.UserCredentials(options.systemUsers.admin, options.adminPassword);

    const eventEmitterInstance = () => (event) => {
    const em = new events.EventEmitter();
      em.emit('event', event);
    };

    const liveProcessingStarted = () => {
      logger.trace("Caught up with previously stored events. Listening for new events.");
    };

    const subscriptionDropped = (subscription, reason, error) => {
      if (error) {
        logger.error(error);
      }
      logger.info('Subscription dropped.');
    };

    return {
      eventEmitterInstance,
      liveProcessingStarted,
      subscriptionDropped,
      gesConnection: gesConnection(options, esClient, logger),
      createEventData:esClient.createEventData,
      createJsonEventData:esClient.createJsonEventData,
      expectedVersion: esClient.expectedVersion,
      credentials: credentialsForAllEventsStream
    };
  }
};
