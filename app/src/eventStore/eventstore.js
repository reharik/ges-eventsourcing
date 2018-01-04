module.exports = function(nodeeventstoreclient, eventstoreConnection, logger, events, uuid) {
  return function eventstore(options) {
    const configs = options.eventstore;
    const credentialsForAllEventsStream =
      new nodeeventstoreclient.UserCredentials(configs.systemUsers.admin, configs.systemUsers.adminPassword);

    const eventEmitterInstance = () => {
      const emitter = new events.EventEmitter();
      const emitEvent = (sub, e) => {
        emitter.emit('event', e);
      };
      return {
        emitter,
        emitEvent
      };
    };

    const liveProcessingStarted = () => {
      logger.trace('Caught up with previously stored events. Listening for new events.');
    };

    const subscriptionDropped = (subscription, reason, error) => {
      if (error) {
        logger.error(error);
      }
      logger.info('Subscription dropped.');
    };

    let connection = eventstoreConnection(configs);

    const commandPoster = async function(command, commandName, continuationId) {
      // fortify commands with metadata like date and user
      let conn = await connection;
      command.createDate = new Date();
      let event = nodeeventstoreclient.createJsonEventData(
        uuid.v4(),
        command,
        {eventName: commandName, continuationId, streamType: 'command'},
        commandName);
      await conn.appendToStream(
        'command',
        nodeeventstoreclient.expectedVersion.any,
        [event],
        credentialsForAllEventsStream);
    };

    return {
      eventEmitterInstance,
      liveProcessingStarted,
      subscriptionDropped,
      gesConnection: connection,
      createEventData: nodeeventstoreclient.createEventData,
      createJsonEventData: nodeeventstoreclient.createJsonEventData,
      expectedVersion: nodeeventstoreclient.expectedVersion,
      credentials: credentialsForAllEventsStream,
      commandPoster
    };
  };
};
