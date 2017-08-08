module.exports = function(eventWorkflow, concurrentqueue) {

  return function(source, handler) {

    const processor = x => {
      const func = handler[x.eventName];
      if (func) {
        return eventWorkflow(x, handler.handlerName, func.bind(handler));
      }
      return Promise.resolve();
    };

    const queue = concurrentqueue().limit({ concurrency: 1 }).process(processor);
// put queue.enqued here to list off all items that get put into the queue and the handler name

    source.subscribe(x => queue(x));
  };
};
