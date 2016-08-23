"use strict";


module.exports = function(coqueue, eventHandlerWorkflow, logger, co, JSON) {
    return class eventHandler {
        constructor() {
            this.queue       = new coqueue();
            this.handlerName = '';
            this.workflow = eventHandlerWorkflow();

            co(function*() {
                while (true) {
                    var value = yield this.queue.next();
                    logger.trace(this.handlerName + ' ' + JSON.stringify(value.event));
                    var isIdempotent = this.handlerReturn(yield this.workflow.checkIdempotency(value.event, this.handlerName));
                    logger.trace('message for ' + this.handlerName + ' isIdempotent ' + isIdempotent);

                    if(isIdempotent === true){
                        this.handlerReturn(yield this.workflow.wrapHandlerFunction(value.event,value.handlerFunction));
                        logger.trace('message for ' + this.handlerName + ' was handled ' + value.event.eventName);
                        this.handlerReturn(yield this.workflow.recordEventProcessed(value.event, this.handlerName));
                        logger.trace('message for ' + this.handlerName + ' recorded as processed ' + value.event.eventName);
                        this.handlerReturn(yield this.workflow.dispatchSuccess(value.event, 'event processed successfully'));
                        logger.trace('message for ' + this.handlerName + ' notification disaptched');
                    }
                }
            }.bind(this)).catch(function(err) {
                logger.error(this.handlerName + ' threw error ' + err);
                this.workflow.dispatchFailure(value.event, 'event failed: '+err);
            }.bind(this));
        }

        handlerReturn( result ) {
            if(!result){
                throw(new Error( "function failed to complete."))
            }
            if(result.success === false && result.errorLevel === 'severe'){
                throw(new Error(result.message));
            }

            if(result.success === false && result.errorLevel === 'low'){
                logger.error(this.handlerName + ' return this result for message ' + result.message);
                return result.message;
            }
            return result;
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