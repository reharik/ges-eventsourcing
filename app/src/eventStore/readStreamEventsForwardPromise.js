/**
 * Created by reharik on 6/10/15.
 */
"use strict";

module.exports = function(gesConnection, logger, invariant, Promise, JSON) {
    return function (streamName, skipTake) {
        invariant(
            streamName,
            'must pass a valid stream name'
        );
        invariant(
            skipTake,
            'must provide the skip take'
        );

        logger.trace('wrapping readStreamEventsForward in Promise');
        return new Promise(function (resolve, reject) {
            gesConnection.readStreamEventsForward(streamName, skipTake, function (err, results) {
                // gesConnection2.readStreamEventsForward(streamName,  function (err, results) {
                logger.trace('readStreamEventsForward callback');
                if (err) {
                    logger.error('rejecting readStreamEventsForward Promise with error message: ' + err);
                    reject(err);
                } else {
                    logger.debug('resolving readStreamEventsForward Promise with response: ' + JSON.stringify(results));
                    resolve(results);
                }
            });
        })
    };
};
