module.exports = function(eventWorkflow, concurrentqueue) {

  return function(source, handler) {

    const processor = x => {
      // horrible violation of open-closed principle
      const func = handler[x.eventName];
      const baseFunc = handler.baseHandler ? handler.baseHandler[x.eventName] : undefined;
      let all = [];
      if (baseFunc) {
        all.push(eventWorkflow(x, handler.baseHandlerName, baseFunc.bind(handler.baseHandler)));
      }
      if (func) {
        all.push(eventWorkflow(x, handler.handlerName, func.bind(handler)));
      }
      if (baseFunc || func) {
        return Promise.all(all);
      }
      return Promise.resolve();
    };

    const queue = concurrentqueue().limit({ concurrency: 1 }).process(processor);
// put queue.enqued here to list off all items that get put into the queue and the handler name

    source.subscribe(x => queue(x));
  };
};
