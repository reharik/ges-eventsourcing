///**
// * Created by reharik on 11/3/15.
// */
//
//
let demand = require('must');
let R = require('ramda');
let _fantasy = require('ramda-fantasy');
let Maybe = _fantasy.Maybe;
let buffer = require('buffer');
let logger = require('corelogger');
let mut = require('../../src/applicationFunctions/functionalHelpers')(R, _fantasy, buffer, logger);

let noEventTypeEvent = {};

let incomingEvent = {
  Event: { EventType: 'event' },
  commitPosition: '123',
  OriginalEvent: {
    Metadata: {
      eventName: 'someEventNotificationOn',
      streamType: 'event'
    },
    Data: {some: 'data'}
  }
};

let noMetadataEvent = {
  Event: {EventType: 'event'}
};

let noDataEvent = {
  Event: {EventType: 'event'},
  OriginalEvent: {
    Metadata: {
      eventName: 'someEventNotificationOn',
      streamType: 'event'
    }
  }
};

let sysEvent = {
  Event: { EventType: '$event' }
};


describe('FUNCTIONAL HELPERS', function() {
  before(function() {
  });

  beforeEach(function() {
  });

  context('when calling parseBuffer on a buffer', function() {
    it('should return a maybe of the parsed data', function() {
      let buffer = new Buffer(JSON.stringify(noMetadataEvent), 'utf8');
      mut.safeParseBuffer(buffer).must.eql(Maybe.of(noMetadataEvent));
    });
  });

  context('when calling parseBuffer on a string', function() {
    it('should return a maybe Nothing', function() {
      mut.safeParseBuffer(noMetadataEvent).must.eql(Maybe.Nothing());
    });
  });

});
