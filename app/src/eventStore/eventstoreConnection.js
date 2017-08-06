module.exports = function(nodeeventstoreclient, promiseretry, logger) {
  var ping = async function(options) {
    const _connection = nodeeventstoreclient.createConnection(
      { verbose: options.verbose, log: logger },
      { host: options.host, port: 1113 });
    const connection = await _connection.connect();

    connection.once('connected', tcpEndPoint => {
      logger.debug('gesConnection: ' + connection + ' - ' + tcpEndPoint);
    })
    ;
    connection.on('error', function(err) {
      logger.error('Error occurred on ES connection:', err);
    });

    connection.on('closed', function(reason) {
      logger.info('ES connection closed, reason:', reason);
      connection.connect();
    });
    return connection;
  };
  return () => {
    return promiseretry(function(retry, number) {
      console.log('attempt number', number);
      return ping().catch(retry);
    }, { retries: 10 });
  };
};
