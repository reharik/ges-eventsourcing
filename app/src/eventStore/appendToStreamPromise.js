/**
 * Created by rharik on 6/12/15.
 */
"use strict";

module.exports = function appendToStreamPromise(gesConnection, logger, invariant, Promise, R, JSON) {
    return R.curry(function (streamName, data) {
        invariant(
            streamName,
            'must pass a valid stream name'
        );
        invariant(
            data.expectedVersion,
            'must pass data with an expected version of aggregate'
        );
        invariant(
            data.events && data.events.length > 0,
            'must pass data with at least one event'
        );
        logger.trace('wrapping appendToStream in Promise');

        return new Promise(function (resolve, reject) {
            gesConnection.appendToStream(streamName, data, function (err, result) {
                logger.trace('appendToStream callback');
                if (err) {
                    logger.debug('rejecting appendToStream Promise with error message: ' + err);
                    reject(err);
                } else {
                    logger.debug('resolving appendToStream Promise with response: ' + JSON.stringify(result));
                    resolve(result);
                }
            });
        });
    });
};

