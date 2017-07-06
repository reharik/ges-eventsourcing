module.exports = function(eventWorkflow, concurrentqueue) {

  return function(source, handler) {

    const processor = x => {
      const func = handler[x.eventName];
      if (func) {
        console.log('process event');
        return eventWorkflow(x, handler.handlerName, func.bind(handler));
      }
      return Promise.resolve();
    };

    const queue = concurrentqueue().limit({ concurrency: 1 }).process(processor);

    source.subscribe(x => queue(x));
  };
};
