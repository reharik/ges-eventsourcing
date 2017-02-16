/**
 * Created by reharik on 6/10/15.
 */
"use strict";

module.exports = function(gesConnection, logger, invariant, Promise) {
    return function (streamName, skipTake) {

        invariant(
            streamName,
            'must pass a valid stream name'
        );
        invariant(
            skipTake,
            'must provide the skip take'
        );

        return new Promise(function (resolve, reject) {
            gesConnection.readStreamEventsForward(streamName, skipTake, function (err, results) {
                if (err) {
                    logger.error('rejecting readStreamEventsForward Promise with error message: ' + err);
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        })
    };
};
