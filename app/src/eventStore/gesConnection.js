
"use strict";

module.exports = function() {
    return function(_options, eventstorenode, logger) {
        var options = _options && _options.eventstore ? _options.eventstore : {};
        var connection;
        logger.trace('accessing gesConnection');
        if (!connection) {
            logger.trace('IP:' + options.host + ':1113');
            connection = eventstorenode.createConnection({},{ hostname: options.host, port: 1113 });
            connection.connect();
            connection.once('connected', (tcpEndPoint) => {
              logger.debug('gesConnection: ' + JSON.stringify(connection, null, 4));
            })
        }
      connection.on('error', function (err) {
        logger.error('Error occurred on ES connection:', err);
      });

      connection.on('closed', function (reason) {
        logger.info('ES connection closed, reason:', reason);
      });
        return connection;
    };
};
