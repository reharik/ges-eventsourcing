module.exports = function(nodeeventstoreclient, logger) {
  let connection;
  let connectionState = '';
  const getConnection = options => {
    if (connectionState === 'connected') {
      return Promise.resolve(connection);
    }

    if (!connection || connectionState === 'closed') {
      connection = nodeeventstoreclient.createConnection(
        {verbose: options.verbose, log: logger},
        {host: options.host, port: 1113});
    }


    connection.on('error', function(err) {
      connectionState = 'error';
      logger.error(`Error occurred on ES connection: ${connection._connectionName}`, err);
    });

    connection.on('closed', function(reason) {
      connectionState = 'closed';
      console.log(`==========CLOSED!!!!=========`);
      console.log('CLOSED!!!!');
      console.log(`==========END CLOSED!!!!=========`);

      logger.info(`ES connection: ${connection._connectionName} closed, reason:`, reason);
      connection = getConnection(options);
    });

    connection.on('disconnected', function(reason) {
      connectionState = 'closed';
      console.log(`=========="DISCONNECTED!!!"=========`);
      console.log('DISCONNECTED!!!');
      console.log(`==========END "DISCONNECTED!!!"=========`);

      logger.info(`ES connection: ${connection._connectionName} disconnected, reason:`, reason);
      connection = getConnection(options);
    });

    return connection.connect()
      .then(() => new Promise(function(res) {
        connectionState = 'connected';
        return connection.once('connected', tcpEndPoint => {
          console.log(`=========='connected'=========`);
          console.log('connected to eventstore');
          console.log(`==========END 'connected'=========`);
          logger.trace(`gesConnection: ${connection._connectionName}
 - ${JSON.stringify(tcpEndPoint, null, 4)}`);
          return res(connection);
        });
      }))
      .catch(err =>
        logger.error(`Error occurred on ES connection: ${connection._connectionName}`, err)
      );
  };
  return getConnection;
};
