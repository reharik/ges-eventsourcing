/**
 * Created by reharik on 8/13/15.
 */
"use strict";

module.exports = function(appendToStreamPromise, readStreamEventsForwardPromise, gesConnection, gesclient, extend ) {
    return function eventstore(_options) {
        return {
            appendToStreamPromise         : appendToStreamPromise,
            readStreamEventsForwardPromise: readStreamEventsForwardPromise,
            subscribeToAllFrom            : gesConnection.subscribeToAllFrom.bind(gesConnection),
            gesClientHelpers              : {
                getStreamMetadata   : gesConnection.getStreamMetadata.bind(gesConnection),
                setStreamMetadata   : gesConnection.setStreamMetadata.bind(gesConnection),
                createStreamMetadata: gesclient.createStreamMetadata,
                systemRoles         : gesclient.systemRoles,
                systemUsers         : gesclient.systemUsers
            },
            //this is for debug purposes only please remove
            gesConnection                 : gesConnection
        };
    }
};
