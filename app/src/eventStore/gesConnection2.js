
"use strict";

module.exports = function(eventstoreclient, logger, extend) {
    return function(_options) {
        var options = _options && _options.eventstore ? _options.eventstore : {};
        var connection;
        logger.trace('accessing gesConnection');
        if (!connection) {
            logger.debug('creatextending gesConnection');
            logger.trace('IP:' + options.host + ':1113');
            connection = eventstoreclient({
                host: options.host,
                port: 1113
            })
        }
        logger.debug('gesConnection: ' + JSON.stringify(connection, null, 4));
        return connection;
    };
};
