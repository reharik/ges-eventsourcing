module.exports = function(eventWorkflow, concurrentqueue) {

  return function(source, handler) {

    const processor = async x => {
      // horrible violation of open-closed principle
      const func = handler[x.eventName];
      const baseFunc = handler.baseHandler ? handler.baseHandler[x.eventName] : undefined;
      let result = Promise.resolve();
      if (baseFunc) {
        result = await eventWorkflow(x, handler.baseHandlerName, baseFunc.bind(handler.baseHandler));
      }
      if (func) {
        result = await eventWorkflow(x, handler.handlerName, func.bind(handler));
      }
      return result;
    };

    const queue = concurrentqueue().limit({ concurrency: 1 }).process(processor);
// put queue.enqued here to list off all items that get put into the queue and the handler name

    source.subscribe(x => queue(x));
  };
};
