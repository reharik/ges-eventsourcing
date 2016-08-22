/**
 * Created by rharik on 6/10/15.
 */
"use strict";

module.exports = function(eventstore, logger, appfuncs, invariant, uuid, extend,co ) {
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

        var getById = function(aggregateType, id, version) {
            var streamName;
            var aggregate;
            var sliceStart = 0;
            var currentSlice;
            var sliceCount;
            co(function*() {
                invariant(
                    (aggregateType.isAggregateBase && aggregateType.isAggregateBase()),
                    "aggregateType must inherit from AggregateBase"
                );
                invariant(
                    id.length === (36),
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

                    currentSlice = yield eventstore.readStreamEventsForwardPromise(streamName, {
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

                    currentSlice.Events.forEach(e => aggregate.applyEvent(ef.incomingEvent(e)));

                } while (version >= currentSlice.NextEventNumber && !currentSlice.IsEndOfStream);
                return aggregate;
            }.bind(this)).catch(function(err) {
                console.log('==========err=========');
                console.log(err);
                console.log('==========ENDerr=========');
            });
        };

        var save = function(aggregate, _metadata) {
            var streamName;
            var newEvents;
            var metadata;
            var originalVersion;
            var expectedVersion;
            var events;
            var appendData;
            var result;
            co(function*() {
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
                var metadata = extend(metadata, _metadata);
                streamName = aggregate.constructor.name + aggregate._id;
                newEvents  = aggregate.getUncommittedEvents();

                originalVersion = aggregate._version - newEvents.length;
                expectedVersion = originalVersion == 0 ? -1 : originalVersion - 1;

                events = newEvents.map(e=> { e.metadata = metadata; return ef.outGoingEvent(e) });

                appendData = {
                    expectedVersion: expectedVersion,
                    events         : events
                };
                result     = yield eventstore.appendToStreamPromise(streamName, appendData);

                aggregate.clearUncommittedEvents();
            }.bind(this)).catch(function(err) {
                console.log('==========err=========');
                console.log(err);
                console.log('==========ENDerr=========');
            });
            //largely for testing purposes
            return appendData;
        };

        return {
            getById: getById,
            save   : save
        }
    };
};
