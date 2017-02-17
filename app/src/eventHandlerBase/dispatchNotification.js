
module.exports = function(appfuncs, eventstore) {
  return async function (success, event, result, exception) {
    var ef = appfuncs.eventFunctions;
    var notification = () => {
      var data = {
        success: success === 'Success',
        initialEvent: event,
        handlerResult: result
      };
      if(!data.success){
        data.exception = exception;
      }
      var metadata = {
        continuationId: event.continuationId || null,
        eventName: 'notification',
        streamType: 'notification'
      };
      var _notification = {
        eventName: 'notification',
        data,
        metadata
      };

      return {
        expectedVersion: -2, // -2 corresponds to expectedVersion:any
        events: [ef.outGoingEvent(_notification)]
      }
    };
    await eventstore.appendToStreamPromise('notification', notification());
  }
};