module.exports = function(nodeeventstoreclient, promiseretry, logger) {
  let connection;
  const ping = async function(options) {
    if (!connection) {
      connection = nodeeventstoreclient.createConnection(
        {verbose: options.verbose, log: logger},
        {host: options.host, port: 1113});
    }
    if (connection._handler._state === 'init') {
      await connection.connect();
    }

    if (connection._handler._state === 'connected') {

      connection.once('connected', tcpEndPoint => {
        logger.debug('gesConnection: ' + connection + ' - ' + tcpEndPoint);
      })
      ;
      connection.on('error', function(err) {
        logger.error('Error occurred on ES connection:', err);
      });

      connection.on('closed', function(reason) {
        logger.info('ES connection closed, reason:', reason);
        logger.debug(connection);
        return connection.connect();
      });
      console.log(`=========='connected'=========`);
      console.log('connected to eventstore');
      console.log(`==========END 'connected'=========`);
      return connection;
    }
    return Promise.reject();
  };
  return options => {
    return promiseretry(function(retry, number) {
      console.log('es connect attempt number', number);
      return ping(options).catch(retry);
    }, {retries: 10});
  };
};
