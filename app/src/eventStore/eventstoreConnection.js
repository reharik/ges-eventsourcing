module.exports = function(nodeeventstoreclient, promiseretry, logger) {
  let connection;
  let connectionState = '';
  const getConnection = options => {
    if (connectionState === 'connected') {
      return connection;
    }

    if (!connection || connectionState === 'closed') {
      connection = nodeeventstoreclient.createConnection(
        {verbose: options.verbose, log: logger},
        {host: options.host, port: 1113});
    }

    connection.connect();

    connection.once('connected', tcpEndPoint => {
      connectionState = 'connected';
      console.log(`=========='connected'=========`);
      console.log('connected to eventstore');
      console.log(`==========END 'connected'=========`);
      logger.trace(`gesConnection: ${JSON.stringify(connection, null, 4)} - ${JSON.stringify(tcpEndPoint, null, 4)}`);
    });

    connection.on('error', function(err) {
      connectionState = 'error';
      logger.error('Error occurred on ES connection:', err);
    });

    connection.on('closed', function(reason) {
      connectionState = 'closed';
      console.log(`==========CLOSED!!!!=========`);
      console.log('CLOSED!!!!');
      console.log(`==========END CLOSED!!!!=========`);

      logger.info('ES connection closed, reason:', reason);
      return getConnection(options);
    });

    connection.on('disconnected', function(reason) {
      connectionState = 'closed';
      console.log(`=========="DISCONNECTED!!!"=========`);
      console.log('DISCONNECTED!!!');
      console.log(`==========END "DISCONNECTED!!!"=========`);

      logger.info('ES connection closed, reason:', reason);
      return getConnection(options);
    });

    return connection;
  };
  return getConnection;
};
