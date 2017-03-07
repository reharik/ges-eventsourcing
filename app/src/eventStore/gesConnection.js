
"use strict";

module.exports = function(esClient, logger, extend) {
    return function(_options) {
        var options = _options && _options.eventstore ? _options.eventstore : {};
        var connected;
        logger.trace('accessing gesConnection');
        if (!connected) {
            logger.trace('IP:' + options.host + ':1113');
            let connection = esClient({},{ hostname: options.host, port: 1113 });
            connected = connection.connect();
        }
        logger.debug('gesConnection: ' + JSON.stringify(connected, null, 4));
        return connected;
    };
};
