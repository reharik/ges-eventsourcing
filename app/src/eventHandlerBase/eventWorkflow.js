

module.exports = function(dispatchNotification,
                          rsRepository,
                          logger) {
  
  return async function (event, handlerName, hnadlerFunction) {
    try {
      logger.trace(this.handlerName + ' ' + JSON.stringify(event));
      const isIdempotent = await
      rsRepository.checkIdempotency(fh.getSafeValue('originalPosition', event), handlerName);
      logger.trace('message for ' + this.handlerName + ' isIdempotent ' + isIdempotent);
      if (!isIdempotent) {
        throw new Error("item has already been processed");
      }

      var continuationId = R.view(R.lensProp('continuationId'), fh.getSafeValue('metadata', e));
      var handlerResult = await hnadlerFunction(fh.getSafeValue('data', e), continuationId);
      logger.trace('message for ' + this.handlerName + ' was handled ' + event.eventName);

      await rsRepository.recordEventProcessed(fh.getSafeValue('originalPosition', event), handlerName);
      logger.trace('message for ' + this.handlerName + ' recorded as processed ' + event.eventName);

      await dispatchNotification("Success", e, handlerResult);
      logger.trace('message for ' + this.handlerName + ' notification disaptched');

    } catch (ex) {
      // here we need to determin if this is a catastrophic failure, and if so best to throw
      dispatchNotification("Failure", event, ex)
    }
  }
};