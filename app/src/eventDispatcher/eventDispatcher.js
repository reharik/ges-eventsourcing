let eventDispatcher = function eventDispatcher(eventstore,
  logger,
  rx,
  R,
  mapAndFilterStream) {
  return async function(position) {
    let connection = await eventstore.gesConnection;

    return {
      startDispatching(streamType) {
        logger.info('startDispatching | startDispatching called');
        const eventAppeared = eventstore.eventEmitterInstance();
        let mAndF = mapAndFilterStream(streamType);
        let subscription = connection.subscribeToAllFrom(
          position,
          false,
          eventAppeared.emitEvent,
          eventstore.liveProcessingStarted,
          eventstore.subscriptionDropped,
          eventstore.credentials);
        logger.info('subscription.isSubscribedToAll: ' + subscription.isSubscribedToAll);

        return rx.Observable.fromEvent(eventAppeared.emitter, 'event')
          .filter(mAndF.isValidStreamType)
          .map(mAndF.transformEvent);
      }
    };
  };
};
module.exports = eventDispatcher;
