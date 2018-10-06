let eventDispatcher = function eventDispatcher(eventstore,
  logger,
  rsRepository,
  rx,
  R,
  mapAndFilterStream) {
  return async function(eventHandlerName) {
    let connection = await eventstore.gesConnection;
    const rsRepo = await rsRepository;
    let query = 'SELECT * from "lastProcessedPosition" where "handlerType" = \'' + eventHandlerName + '\'';
    const response = await rsRepo.saveQuery(query);
    const row = response.rows[0];
    const commitPosition = row && row.commitPosition ? row.commitPosition : null;
    const preparePosition = row && row.preparePosition ? row.preparePosition : null;
    const position = commitPosition && preparePosition
      ? new eventstore.Position(commitPosition, preparePosition)
      : null;
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
