

module.exports = function(logger) {

  return async function({hName, hFunc, event}) {
    try {
      logger.trace(this.handlerName + ' ' + JSON.stringify(value.event));
      const isIdempotent = await rsRepository.checkIdempotency(fh.getSafeValue('originalPosition', event), hName);
      logger.trace('message for ' + this.handlerName + ' isIdempotent ' + isIdempotent);
      if(!isIdempotent){
        throw new Error("item has already been processed");
      }

      var continuationId = R.view(R.lensProp('continuationId'), fh.getSafeValue('metadata', e));
      var handlerResult await = hFunc(fh.getSafeValue('data', e), continuationId);
      logger.trace('message for ' + this.handlerName + ' was handled ' + value.event.eventName);

      await rsRepository.recordEventProcessed(fh.getSafeValue('originalPosition', event), hName);
      logger.trace('message for ' + this.handlerName + ' recorded as processed ' + value.event.eventName);

      await dispatchNotification("Success", e, handlerResult);
      logger.trace('message for ' + this.handlerName + ' notification disaptched');

    } catch(ex) {
      dispatchNotification("Failure", e, ex)
    }

//TODO pull this out then remove the try catch here and catch in handler above if I still have it that way
//TODO pull this out then remove the try catch here and catch in handler above if I still have it that way
//TODO pull this out then remove the try catch here and catch in handler above if I still have it that way
//TODO pull this out then remove the try catch here and catch in handler above if I still have it that way

    var dispatchNotification = async function(success, e, handlerResult) {
      //notification  string -> string -> Future<string|JSON>
      var notification = () => {
        var data = {
          result: success,
          initialEvent: e,
          handlerResult
        };
        var metadata = {
          continuationId: e.continuationId || null,
          eventName: 'notification',
          streamType: 'notification'
        };
        var _notification = {
          eventName: 'notification',
          data,
          metadata
        };
        return {
          expectedVersion: -2,
          events: [ef.outGoingEvent(_notification)]
        }
      };

      //append  JSON -> Future<string|JSON>
      await eventstore.appendToStreamPromise('notification', notification());
    }
  }
}