/**
 * Created by reharik on 11/13/15.
 */

"use strict";

module.exports = function mapAndFilterStream(appfuncs, R,treis) {
    return function(streamType) {
        var ef = appfuncs.eventFunctions;
        var fh = appfuncs.functionalHelpers;

        var doesNotStartsWith = R.curry((x,y) => !y.startsWith(x));
        //isNonSystemEvent:: JSON -> Maybe bool
        var isNonSystemEvent = R.compose(R.map(doesNotStartsWith('$')), R.chain(fh.safeProp('EventType')), fh.safeProp('Event'));
        //matchesStreamType:: string -> (JSON -> Maybe bool)
        var matchesStreamType = R.compose(R.map(R.equals(streamType)), R.chain(fh.safeProp('streamType')), ef.parseMetadata);
        //hasData:: JSON -> Maybe bool
        var hasData = R.compose(R.map(R.not), R.map(R.isEmpty), ef.parseData);
        //isValidStreamType:: JSON -> Maybe bool
        var isValidStreamType = R.compose(R.identity, x => [isNonSystemEvent, matchesStreamType, hasData]
            .map(fn => R.equals(true, fn(x).getOrElse()))
            .reduce((a, b) => a && b));

        //eventName:: JSON -> Maybe string
        var eventName = R.compose(R.chain(fh.safeProp('EventType')),fh.safeProp('Event'));
        //continuationId:: JSON -> Maybe uuid
        var continuationId = R.compose(R.chain(fh.safeProp('continuationId')), ef.parseMetadata);
        //originalPosition:: JSON -> Maybe JSON
        var originalPosition = fh.safeProp('OriginalPosition');

        //transformEvent:: JSON -> Maybe JSON
        var transformEvent = function(payload) {
            return {
                eventName       : eventName(payload).getOrElse(),
                continuationId  : continuationId(payload).getOrElse(),
                originalPosition: originalPosition(payload).getOrElse(),
                data            : ef.parseData(payload).getOrElse(),
                metadata            : ef.parseMetadata(payload).getOrElse()
            };
        };

        return {
            isNonSystemEvent,
            matchesStreamType,
            isValidStreamType,
            eventName,
            continuationId,
            originalPosition,
            transformEvent
        }
    }
};
