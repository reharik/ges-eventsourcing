module.exports = function(nodeeventstoreclient, logger) {
  const getConnection = options => {

    let connection = nodeeventstoreclient.createConnection(
      {verbose: options.verbose, log: logger},
      {host: options.host, port: 1113});

    connection.on('closed', reason => {
      logger.info(`ES connection: ${connection._connectionName} closed, reason:`, reason);
      throw new Error(reason);
    });

    return connection.connect()
      .then(() => new Promise(res => {
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

  return {
    getConnection
  };
};
