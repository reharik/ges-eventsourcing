module.exports = function(dispatchNotification,
  rsRepository,
  appfuncs,
  R,
  promiseretry,
  logger) {

  return async function eventWorkflow(event, handlerName, handlerFunction) {
    let fh = appfuncs.functionalHelpers;

    const processMessage = async continuationId => {
      return await handlerFunction(fh.getSafeValue('data', event), continuationId);
    };

    const attemptProcessMessage = continuationId => {
      return promiseretry(function(retry, number) {
        if (number > 1) { logger.info(`retry attempt: ${number - 1}`); }
        return processMessage(continuationId).catch(err => {
          logger.info(err.message);
          retry(err);
        });
      }, { retries: 3, factor: 1 });
    };

    try {
      logger.debug(`handling ${event.eventName} event in ${handlerName}`);
      logger.trace(handlerName + ' ' + JSON.stringify(event));
      const isIdempotent = await rsRepository
        .checkIdempotency(fh.getSafeValue('commitPosition', event), handlerName);
      logger.trace(`message ${event.eventName} for ${handlerName} isIdempotent ${JSON.stringify(isIdempotent)}`);
      if (!isIdempotent.isIdempotent) {
        throw new Error('item has already been processed');
      }

      let continuationId = R.view(R.lensProp('continuationId'), fh.getSafeValue('metadata', event));
      const handlerResult = await attemptProcessMessage(continuationId);
      logger.trace(`message for ${handlerName} was handled ${event.eventName}`);
      await rsRepository.recordEventProcessed(fh.getSafeValue('commitPosition', event), handlerName);
      logger.trace(`message ${event.eventName} for ${handlerName} recorded as processed`);


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
