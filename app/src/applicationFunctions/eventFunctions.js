
module.exports = function(R, uuid, functionalHelpers){
  var fh = functionalHelpers;
  var parseMetadata = R.compose(R.chain(fh.safeParseBuffer), R.chain(fh.safeProp('metadata')), fh.safeProp('event'));
  var parseData = R.compose(R.chain(fh.safeParseBuffer), R.chain(fh.safeProp('data')), fh.safeProp('event'));
  var incomingEvent = event => {
    return {
      eventName : (R.compose(R.chain(fh.safeProp('eventType')), fh.safeProp('event'))(event)).getOrElse(),
      metadata: parseMetadata(event).getOrElse({}),
      data: parseData(event).getOrElse({}),
      originalPosition: fh.safeProp('originalPosition', event).getOrElse({})
    };
  };

  return {
    parseMetadata,
    parseData,
    incomingEvent
  }
};