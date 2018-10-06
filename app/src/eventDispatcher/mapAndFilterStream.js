module.exports = function mapAndFilterStream(appfuncs, R) {
  return function(streamType) {
    let ef = appfuncs.eventFunctions;
    let fh = appfuncs.functionalHelpers;

    let doesNotStartsWith = R.curry((x, y) => !y.startsWith(x));
    //isNonSystemEvent:: JSON -> Maybe bool
    let isNonSystemEvent = R.compose(
      R.map(doesNotStartsWith('$')),
      R.chain(fh.safeProp('eventType')),
      fh.safeProp('event'));
    //matchesStreamType:: string -> (JSON -> Maybe bool)
    let matchesStreamType = R.compose(
      R.map(R.equals(streamType)),
      R.chain(fh.safeProp('streamType')),
      ef.parseMetadata);
    //hasData:: JSON -> Maybe bool
    let hasData = R.compose( R.map(R.not), R.map(R.isEmpty), ef.parseData);
    //isValidStreamType:: JSON -> Maybe bool
    let isValidStreamType = R.compose(R.identity, x => [isNonSystemEvent, matchesStreamType, hasData]
      .map(fn => R.equals(true, fn(x).getOrElse()))
      .reduce((a, b) => a && b ));

    //eventName:: JSON -> Maybe string
    let eventName = R.compose(R.chain(fh.safeProp('eventType')), fh.safeProp('event'));
    //continuationId:: JSON -> Maybe uuid
    let continuationId = R.compose(R.chain(fh.safeProp('continuationId')), ef.parseMetadata);
    //commitPosition:: JSON -> Maybe JSON
    let commitPosition = R.compose(
      R.chain(fh.safeProp('low')),
      R.chain(fh.safeProp('commitPosition')),
      fh.safeProp('originalPosition'));

    let preparePosition = R.compose(
      R.chain(fh.safeProp('low')),
      R.chain(fh.safeProp('preparePosition')),
      fh.safeProp('originalPosition'));

    //transformEvent:: JSON -> Maybe JSON
    let transformEvent = function(payload) {
      return {
        eventName: eventName(payload).getOrElse(),
        continuationId: continuationId(payload).getOrElse(),
        commitPosition: commitPosition(payload).getOrElse(),
        preparePosition: preparePosition(payload).getOrElse(),
        data: ef.parseData(payload).getOrElse(),
        metadata: ef.parseMetadata(payload).getOrElse()
      };
    };

    return {
      isNonSystemEvent,
      matchesStreamType,
      isValidStreamType,
      eventName,
      continuationId,
      commitPosition,
      transformEvent
    };
  };
};
