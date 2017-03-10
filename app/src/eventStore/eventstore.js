"use strict";

module.exports = function(eventstorenode, gesConnection, logger, events ) {
  return function eventstore(options) {
    const configs = options.eventstore;
    const credentialsForAllEventsStream = new eventstorenode.UserCredentials(configs.systemUsers.admin, configs.adminPassword);

    const eventEmitterInstance = () =>  {
      const emitter = new events.EventEmitter();
      const emitEvent = (sub, e) => {
        emitter.emit('event', e);
      };
      return {
        emitter,
        emitEvent
      }
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
    let ges = gesConnection;
    if(typeof gesConnection === 'function'){
      ges = gesConnection(options);
    }
    return {
      eventEmitterInstance,
      liveProcessingStarted,
      subscriptionDropped,
      gesConnection: ges,
      createEventData:eventstorenode.createEventData,
      createJsonEventData:eventstorenode.createJsonEventData,
      expectedVersion: eventstorenode.expectedVersion,
      credentials: credentialsForAllEventsStream
    };
  }
};
