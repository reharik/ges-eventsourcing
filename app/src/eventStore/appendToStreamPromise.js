/**
 * Created by rharik on 6/12/15.
 */
"use strict";

module.exports = function appendToStreamPromise(gesConnection, logger, invariant, Promise, R, JSON, appfuncs) {
    return R.curry(function (streamName, data) {
        var ef = appfuncs.eventFunctions;

        invariant(
            streamName,
            'must pass a valid stream name'
        );
        logger.trace(`appending ${data} to stream: ${streamName}`);

        invariant(
            data.expectedVersion != undefined,
            'must pass data with an expected version of aggregate'
        );
        invariant(
            data.events && data.events.length > 0,
            'must pass data with at least one event'
        );

        return new Promise(function (resolve, reject) {
            gesConnection.appendToStream(streamName, data, function (err, result) {
                if (err) {
                    logger.debug('rejecting appendToStream Promise with error message: ' + err);
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    });
};

