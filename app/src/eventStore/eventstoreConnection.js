module.exports = function(nodeeventstoreclient, pingES, logger) {
  return {
    gesConnection: async options => {
      await pingES(options);

      let gesConnection = nodeeventstoreclient.createConnection(
        {verbose: options.verbose, log: logger},
        {host: options.host, port: 1113});

      await gesConnection.connect();
      return new Promise((res, rej) => {
        gesConnection.once('closed', rej);
        gesConnection.once('connected', tcpEndPoint => {
          gesConnection.removeListener('closed', rej);
          console.log(`=========='connected'=========`);
          console.log('connected to eventstore');
          console.log(`==========END 'connected'=========`);
          logger.trace(`gesConnection: ${gesConnection._connectionName}
 - ${JSON.stringify(tcpEndPoint, null, 4)}`);
          gesConnection.on('closed', reason => {
            logger.info(`ES gesConnection: ${gesConnection._connectionName} closed, reason:`, reason);
            logger.info('Connection to GES lost. Terminating this process.');
            process.exit(-1); //eslint-disable-line no-process-exit
          });
          return res(gesConnection);
        });
      })
        .catch(err =>
          logger.error(`Error occurred on ES _connectionName: ${gesConnection._connectionName}`, err)
        );
    }
  };
};
