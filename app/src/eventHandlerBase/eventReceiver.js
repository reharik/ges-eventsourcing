module.exports = function (eventWorkflow, logger) {

    return function (source, handler) {
        source.subscribe(async function (x) {
            const func = handler[x.eventName].bind(handler);
            if (func) {
                await eventWorkflow(x, handler.handlerName, func);
            }
        })
    }
}