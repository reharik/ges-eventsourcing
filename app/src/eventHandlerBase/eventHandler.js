"use strict";


module.exports = function(coqueue, eventHandlerWrapper, logger) {
    return class eventHandler {
        async init() {
            this.queue       = new coqueue();
            this.handlerName = '';
            this.workflow = eventHandlerWorkflow();
            
            while (true) {
                var value = await this.queue.next();
                await eventHandlerWrapper(value)
            }
        }

        handleEvent(event) {
            var handlerFunction = this[event.eventName];
            this.queue.push({
                event,
                handlerFunction
            });
        }
    };
};