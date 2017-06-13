module.exports = function(dispatchNotification,
                          eventHelperRepository,
                          appfuncs,
                          R,
                          logger) {

  return async function eventWorkflow(event, handlerName, hnadlerFunction) {
    let fh = appfuncs.functionalHelpers;

    const processMessage = async (hnadlerFunction, event, continuationId, retry = 0) => {
      console.log(`==========event=========`);
      console.log(retry);
      console.log(event);
      console.log(`==========END event=========`);

      try {
        return await hnadlerFunction(fh.getSafeValue('data', event), continuationId);
      } catch (err) {
        retry++;
        if (retry < 4 && err.message.includes('WrongExpectedVersion')) {
          logger.info(err.message);
          logger.info(`retry attempt: ${retry}`);
          return await hnadlerFunction(fh.getSafeValue('data', event), continuationId, retry);
        }
        throw err;
      }
    };

    try {
      logger.trace(handlerName + ' ' + JSON.stringify(event));
      const isIdempotent = await eventHelperRepository
        .checkIdempotency(fh.getSafeValue('commitPosition', event), handlerName);
      logger.trace(`message ${event.eventName} for ${handlerName} isIdempotent ${JSON.stringify(isIdempotent)}`);
      if (!isIdempotent.isIdempotent) {
        throw new Error('item has already been processed');
      }

      let continuationId = R.view(R.lensProp('continuationId'), fh.getSafeValue('metadata', event));
      const handlerResult = processMessage(hnadlerFunction, event, continuationId);
      logger.trace(`message for ${handlerName} was handled ${event.eventName}`);

      await eventHelperRepository.recordEventProcessed(fh.getSafeValue('commitPosition', event), handlerName);
      logger.trace('message for ' + handlerName + ' recorded as processed ' + event.eventName);

      await dispatchNotification('Success', event, handlerResult);
      logger.trace(`message ${event.eventName} for ${handlerName} notification disaptched`);

    } catch (ex) {
      if (ex.message === 'item has already been processed') { return; }
      logger.error(`An exception processing event ${event.eventName} in workflow: ${handlerName} was thrown`);
      logger.error(ex);

      // here we need to determin if this is a catastrophic failure, and if so best to throw
      // also need to figure out how to parse the exception to get a usable error
      await dispatchNotification('Failure', event, ex.message, ex);
    }
  };
};
