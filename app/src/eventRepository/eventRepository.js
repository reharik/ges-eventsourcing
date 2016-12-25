/**
 * Created by rharik on 6/10/15.
 */
"use strict";

module.exports = function(eventstore, logger, appfuncs, invariant, uuid, extend ) {
    return function(_options) {
        var ef      = appfuncs.eventFunctions;
        var options = {
            readPageSize: 1,
            streamType  : 'event'
        };
        extend(options, _options || {});

        invariant(
            options.readPageSize,
            "repository requires a read size greater than 0"
        );

        var getById = async function(aggregateType, id, version = 0) {
            var streamName;
            var aggregate;
            var sliceStart = 0;
            var currentSlice;
            var sliceCount;
            try {
                invariant(
                  (aggregateType.isAggregateBase && aggregateType.isAggregateBase()),
                  "aggregateType must inherit from AggregateBase"
                );

                invariant(
                  id && id.length === (36),
                  "id must be a valid uuid"
                );
                invariant(
                  (version >= 0),
                  "version number must be greater than or equal to 0"
                );

                streamName = aggregateType.aggregateName() + id;
                // this might be problematic
                aggregate = new aggregateType();
                do {
                    // specify number of events to pull. if number of events too large for one call use limit

                    sliceCount = sliceStart + options.readPageSize <= options.readPageSize ? options.readPageSize : version - sliceStart + 1;
                    // get all events, or first batch of events from GES

                    currentSlice = await eventstore.readStreamEventsForwardPromise(streamName, {
                        start: sliceStart,
                        count: sliceCount
                    });
                    //validate
                    if (currentSlice.Status == 'StreamNotFound') {
                        throw new Error('Aggregate not found: ' + streamName);
                    }
                    //validate
                    if (currentSlice.Status == 'StreamDeleted') {
                        throw new Error('Aggregate Deleted: ' + streamName);
                    }

                    sliceStart = currentSlice.NextEventNumber;
console.log('==========currentSlice.Events=========');
console.log(currentSlice.Events);
console.log('==========END currentSlice.Events=========');

                    currentSlice.Events.forEach(e => aggregate.applyEvent(ef.incomingEvent(e)));

                } while (version >= currentSlice.NextEventNumber && !currentSlice.IsEndOfStream);
                return aggregate;
            } catch (err) {
                console.log('==========err=========');
                console.log(err);
                console.log('==========ENDerr=========');
            }
        };

        var save = async function(aggregate, _metadata) {
            var streamName;
            var newEvents;
            var metadata;
            var originalVersion;
            var expectedVersion;
            var events;
            var appendData;
            var result;
            try {
                invariant(
                    (aggregate.isAggregateBase && aggregate.isAggregateBase()),
                    "aggregateType must inherit from AggregateBase"
                );
                // standard data for metadata portion of persisted event
                metadata   = {
                    // handy tracking id
                    commitIdHeader     : uuid.v4(),
                    // type of aggregate being persisted
                    aggregateTypeHeader: aggregate.constructor.name,
                    // stream type
                    streamType         : options.streamType
                };

                // add extra data to metadata portion of persisted event
                console.log('==========_metadata=========');
                console.log(_metadata);
                console.log('==========END _metadata=========');
                metadata = extend(metadata, _metadata);
                streamName = aggregate.type + aggregate._id;
                newEvents  = aggregate.getUncommittedEvents();
console.log('==========streamName=========');
console.log(streamName);
console.log('==========END streamName=========');

                originalVersion = aggregate._version - newEvents.length;
                // expectedVersion = originalVersion == 0 ? -1 : originalVersion -1;
console.log('==========aggregagte._version=========');
console.log(aggregate._version);
console.log('==========END aggregagte._version=========');
console.log('==========newEvents.length=========');
console.log(newEvents.length);
console.log('==========END newEvents.length=========');
console.log('==========expectedVersion=========');
console.log(originalVersion);
console.log('==========END expectedVersion=========');

                events = newEvents.map(e=> { e.metadata = metadata; return ef.outGoingEvent(e) });

                appendData = {
                        expectedVersion: originalVersion,
                    events         : events
                };
                result     = await eventstore.appendToStreamPromise(streamName, appendData);

                aggregate.clearUncommittedEvents();
            } catch(err) {
                console.log('==========err=========');
                console.log(err);
                console.log('==========ENDerr=========');
            };
            //largely for testing purposes
            return appendData;
        };

        return {
            getById: getById,
            save   : save
        }
    };
};
