/**
 * Created by rharik on 6/10/15.
 */


module.exports = function(eventstore, logger, appfuncs, invariant, uuid, mapAndFilterStream ) {
  return function(_options) {
    let options = {
      readPageSize: 500,
      streamType: 'event'
    };
    options = Object.extend({}, options, _options || {});

    invariant(
      options.readPageSize,
      'repository requires a read size greater than 0'
    );

    let getById = async function(aggregateType, id) {
      let streamName;
      let aggregate;
      let sliceStart = 0;
      let currentSlice;
      try {

        invariant(id, 'id must be a present');
        // invariant(
        //   (version >= 0),
        //   "version number must be greater than or equal to 0"
        // );

        aggregate = aggregateType();
        streamName = `${aggregate.aggregateName()}-${id}`;
        logger.debug(`Getting Aggregate by id with streamname: ${streamName}`);

        do {
          // specify number of events to pull. if number of events too large for one call use limit

          // get all events, or first batch of events from GES
          const connection = await eventstore.gesConnection;
          currentSlice = await connection.readStreamEventsForward(streamName,
            sliceStart,
            options.readPageSize,
            eventstore.credentials);
          //validate
          if (currentSlice.status === 'StreamNotFound') {
            throw new Error('Aggregate not found: ' + streamName);
          }
          //validate
          if (currentSlice.status === 'StreamDeleted') {
            throw new Error('Aggregate Deleted: ' + streamName);
          }

          let mAndF = mapAndFilterStream();

          sliceStart = currentSlice.nextEventNumber;
          currentSlice.events.forEach(e => {
            aggregate.applyEvent(mAndF.transformEvent(e).data);
          });

        } while (!currentSlice.isEndOfStream);
        logger.trace(`state of aggregate returning`);
        logger.trace(JSON.stringify(aggregate));

      } catch (err) {
        logger.error(`Error thrown by eventRepository 'getById' this may have been a check for existing aggregate.`);
        logger.error(err);
      }
      return aggregate;
    };

    let save = async function(aggregate, _metadata) {
      let streamName;
      let newEvents;
      let metadata;
      let originalVersion;
      let events;
      try {
        invariant(
          (aggregate.isAggregateBase && aggregate.isAggregateBase()),
          'aggregateType must compose aggregateBase'
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
        metadata = Object.extend({}, metadata, _metadata);
        streamName = `${aggregate.aggregateName()}-${aggregate.state._id}`;
        newEvents = aggregate.getUncommittedEvents();
        originalVersion = aggregate.state._version - newEvents.length;
        logger.debug(`current aggregate version: ${aggregate.state._version}, original version: ${originalVersion}`);

        logger.trace(`appending ${JSON.stringify(newEvents)} to stream: ${streamName}`);

        events = newEvents.map(e=>
          eventstore.createJsonEventData(uuid.v4(), e, metadata, e.eventName || '')
        );
        const connection = await eventstore.gesConnection;
        await connection.appendToStream(streamName, originalVersion, events, eventstore.credentials);

        aggregate.clearUncommittedEvents();
      } catch (err) {
        logger.error(`Error thrown by event repository save`);
        logger.error(err);
        throw err;
      }
      //largely for testing purposes
      return events;
    };

    return {
      getById,
      save
    };
  };
};
