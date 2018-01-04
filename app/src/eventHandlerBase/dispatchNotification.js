
module.exports = function(eventstore, uuid) {
  return async function(success, event, result, exception) {
    let data = {
      success: success === 'Success',
      initialEvent: event,
      handlerResult: result
    };
    if (!data.success) {
      data.exception = exception;
    }
    let metadata = {
      continuationId: event.continuationId || null,
      eventName: 'notification',
      streamType: 'notification'
    };

    let notification = eventstore.createJsonEventData(uuid.v4(), data, metadata, 'notification');
    const connection = eventstore.gesConnection();
    await connection.appendToStream(
      'notification',
      eventstore.expectedVersion.any,
      [notification],
      eventstore.credentials);
  };
};
