module.exports = function(eventWorkflow, concurrentqueue) {

  return function(source, handler) {

    const processor = x => {
      const func = handler[x.eventName];
      if (func) {
        console.log(`process ${x.eventName}`);
        const result = eventWorkflow(x, handler.handlerName, func.bind(handler));
        console.log(`result for ${x.eventName}`);
        console.log(result);
        return result;
      }
      return Promise.resolve();
    };

    const queue = concurrentqueue().limit({ concurrency: 1 }).process(processor);

    source.subscribe(x => queue(x));
  };
};
