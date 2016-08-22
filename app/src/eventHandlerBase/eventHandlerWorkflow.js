/**
 * Created by reharik on 11/19/15.
 */
"use strict";

module.exports = function(readstorerepository,
                          appfuncs,
                          eventstore,
                          R,
                          _fantasy,
                          uuid,
                          buffer,
                          co, logger) {

    return function(){
        var ef = appfuncs.eventFunctions;
        var fh = appfuncs.functionalHelpers;
        var Future  = _fantasy.Future;

        //ifNotIdemotent:: bool -> JSON
        var ifNotIdemotent = x => x.getOrElse(false) !== true
            ? {
            success   : false,
            errorLevel: 'low',
            message   : "item has already been processed"
        }
            : x.getOrElse(false);

        //isIdempotent:: JSON -> bool
        var isIdempotent = R.compose(R.lift(R.equals(true)), fh.safeProp('isIdempotent'));

        //checkDbForIdempotency  JSON -> Future<string|JSON>
        var checkDbForIdempotency=  R.curry((hName,event) => readstorerepository.checkIdempotency(fh.getSafeValue('originalPosition', event), hName));

        //checkIfProcessed:: JSON -> Future<string|JSON>
        var checkIdempotency = (event,hName) => R.compose(R.map(ifNotIdemotent), R.map(isIdempotent), checkDbForIdempotency(hName))(event);

        var wrapHandlerFunction = (e, f) => {
            var contLens = R.lensProp('continuationId');
            var continuationId = R.view(contLens, fh.getSafeValue('metadata', e));
            co(f(fh.getSafeValue('data', e), continuationId))
                .catch(function(err) {
                    logger.error('error thrown: ' + err);
                    return {
                        success   : false,
                        errorLevel: 'severe',
                        message   : 'event handler was unable to complete process: ' + err
                    };
                });
        };

        //recordEventProcessed  bool -> Future<string|JSON>
        var recordEventProcessed = (event,hName) =>  readstorerepository.recordEventProcessed(fh.getSafeValue('originalPosition', event), hName);

        //notification  string -> string -> Future<string|JSON>
        var notification = R.curry((e,y,x) => {
            var data     = {
                result      : y,
                message     : x,
                initialEvent: e
            };
            var metadata = {
                continuationId: e.continuationId || null,
                eventName     : 'notification',
                streamType    : 'notification'
            };
            notification = {
                eventName: 'notification',
                data,
                metadata
            };
            return {
                expectedVersion: -2,
                events         : [ef.outGoingEvent(notification)]
            }
        });

        //append  JSON -> Future<string|JSON>
        var append = R.curry((x) => eventstore.appendToStreamPromise('notification',x));

        //dispatchSuccess  JSON -> Future<string|JSON>
        var dispatchSuccess = (event,message) => append(notification(event,'Success', message));

        //dispatchFailure  JSON -> Future<string|JSON>
        var dispatchFailure = (event,message) => append(notification(event,'Failure', message));

        Future.prototype.then = function(res,rej){
            return this.fork(e => res(e), r => { res(r)})
        };

        return {
            checkIdempotency,
            wrapHandlerFunction,
            recordEventProcessed,
            notification,
            dispatchSuccess,
            dispatchFailure
        }
    }
};