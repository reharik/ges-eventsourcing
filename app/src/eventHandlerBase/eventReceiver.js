module.exports = function (eventHandlerWrapper, logger) {

    return function (source, handler) {
        source.subscribe(async function (x) {
            const func = handler[x.eventName];
            if (func) {
                await eventHandlerWrapper(handler.handlerName, func, x);
            }
        })
    }
}
  