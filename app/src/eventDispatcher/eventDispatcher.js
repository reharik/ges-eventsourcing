/**
 * Created by rharik on 6/18/15.
 */
"use strict";

var eventDispatcher = function eventDispatcher(eventstore,
                                               logger,
                                               rx,
                                               R,
                                               mapAndFilterStream,
                                               serveToHandlers,treis) {
    return function(_handlers) {
        return {
            startDispatching: function(streamType) {
                logger.info('startDispatching | startDispatching called');

                var mAndF  = mapAndFilterStream(streamType);
                var _s     = serveToHandlers(_handlers);
                var stream = rx.Observable.fromEvent(eventstore.subscribeToAllFrom(), 'event')
                    .filter(mAndF.isValidStreamType)
                    .map(mAndF.transformEvent   );

                stream.subscribe(_s.serveEventToHandlers);
            }
        }
    };
};
module.exports = eventDispatcher;

// /**
//  * Created by rharik on 6/18/15.
//  */
// "use strict";
//
// var eventDispatcher = function eventDispatcher(eventstore,
//                                                logger,
//                                                rx,
//                                                R,
//                                                mapAndFilterStream,
//                                                serveToHandlers,treis) {
//     return function(_handlers) {
//         return {
//             startDispatching: function(streamType) {
//                 logger.info('startDispatching | startDispatching called');
//
//                 var mAndF  = mapAndFilterStream(streamType);
//                 var _s     = serveToHandlers(_handlers);
//                 var stream = rx.Observable.fromCallback(eventstore.subscribeToAllFrom("$all", 0, {
//                     'username': "admin",
//                     'password': "changeit"
//                 }, x=> {return x;})
//                     .filter(mAndF.isValidStreamType)
//                     .map(mAndF.transformEvent   );
//
//                 stream.subscribe(_s.serveEventToHandlers);
//             }
//         }
//     };
// };
// module.exports = eventDispatcher;
//
