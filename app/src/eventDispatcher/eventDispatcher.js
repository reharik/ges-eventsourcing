var eventDispatcher = function eventDispatcher(gesConnection,
                                               logger,
                                               rx,
                                               R,
                                               mapAndFilterStream) {
    return function() {
        return {
            startDispatching: function(streamType) {
                logger.info('startDispatching | startDispatching called');

                var mAndF  = mapAndFilterStream(streamType);
                return rx.Observable.fromEvent(eventstore.subscribeToAllFrom(), 'event')
                  .filter(mAndF.isValidStreamType)
                  .map(mAndF.transformEvent)
                  .share();
            }
        }
    };
};
module.exports = eventDispatcher;
