/**
 * Created by rharik on 6/10/15.
 */
"use strict";

module.exports = function(eventstore, logger, appfuncs, invariant, uuid, extend ) {
    return function(_options) {
        var ef      = appfuncs.eventFunctions;
        var options = {
            readPageSize: 500,
            streamType  : 'event'
        };
        extend(options, _options || {});

        invariant(
            options.readPageSize,
            "repository requires a read size greater than 0"
        );

        var getById = async function(aggregateType, id) {
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

            invariant(id, "id must be a present");
            // invariant(
            //   (version >= 0),
            //   "version number must be greater than or equal to 0"
            // );

            streamName = aggregateType.aggregateName() + id;
            console.log(`==========getById streamName=========`);
            console.log(streamName);
            console.log(`==========END streamName=========`);
            // this might be problematic
            aggregate = new aggregateType();


            // for (let i = 0; i < docs.length; i++) {
            //   let doc = docs[i];
            //   await db.post(doc);
            // }


            do {
              // specify number of events to pull. if number of events too large for one call use limit

              // sliceCount = sliceStart + options.readPageSize <= options.readPageSize ? options.readPageSize : version - sliceStart + 1;
              // get all events, or first batch of events from GES

              currentSlice = await eventstore.readStreamEventsForwardPromise(streamName, {
                start: sliceStart,
                count: options.readPageSize
              });
              //validate
              if (currentSlice.Status == 'StreamNotFound') {
                throw new Error('Aggregate not found: ' + streamName);
              }
              //validate
              if (currentSlice.Status == 'StreamDeleted') {
                throw new Error('Aggregate Deleted: ' + streamName);
              }

              console.log('==========currentSlice.Events=========');
              console.log(currentSlice.Events);
              console.log('==========END currentSlice.Events=========');

              sliceStart = currentSlice.NextEventNumber;
              currentSlice.Events.forEach(e => {
                aggregate.applyEvent(ef.incomingEvent(e))
              });

            } while (!currentSlice.IsEndOfStream);
            console.log('==========aggregate=========');
            console.log(aggregate);
            console.log('==========END aggregate=========');

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
          var events;
          var appendData;
          var result;
          try {
            invariant(
              (aggregate.isAggregateBase && aggregate.isAggregateBase()),
              "aggregateType must inherit from AggregateBase"
            );
            // standard data for metadata portion of persisted event
            metadata = {
              // handy tracking id
              commitIdHeader: uuid.v4(),
              // type of aggregate being persisted
              aggregateTypeHeader: aggregate.constructor.name,
              // stream type
              streamType: options.streamType
            };

            // add extra data to metadata portion of persisted event
            metadata = extend(metadata, _metadata);
            streamName = aggregate.type + aggregate._id;
            newEvents = aggregate.getUncommittedEvents();
            originalVersion = aggregate._version - newEvents.length;
            console.log('==========aggregate._version=========');
            console.log(aggregate._version);
            console.log('==========END aggregate._version=========');

            console.log('==========originalVersion=========');
            console.log(originalVersion);
            console.log('==========END originalVersion=========');

            events = newEvents.map(e=> {
              e.metadata = metadata;
              return ef.outGoingEvent(e)
            });

            appendData = {
              expectedVersion: originalVersion,
              events: events
            };
            await eventstore.appendToStreamPromise(streamName, appendData);

            aggregate.clearUncommittedEvents();
          } catch (err) {
            console.log('==========err=========');
            console.log(err);
            console.log('==========ENDerr=========');
          }
          //largely for testing purposes
          return appendData;
        };

        return {
            getById: getById,
            save   : save
        }
    };
};
