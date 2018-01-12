module.exports = function(nodeeventstoreclient, promiseretry, logger) {
  return options => {

    let gesConnection = nodeeventstoreclient.createConnection(
      {verbose: options.verbose, log: logger},
      {host: options.host, port: 1113});

    gesConnection.on('closed', reason => {
      logger.info(`ES gesConnection: ${gesConnection._connectionName} closed, reason:`, reason);
      throw new Error(reason);
    });

    const ping = () => {
      return gesConnection.connect()
        .then(() => new Promise(res => {
          return gesConnection.once('connected', tcpEndPoint => {
            console.log(`=========='connected'=========`);
            console.log('connected to eventstore');
            console.log(`==========END 'connected'=========`);
            logger.trace(`gesConnection: ${gesConnection._connectionName}
 - ${JSON.stringify(tcpEndPoint, null, 4)}`);
            return res({gesConnection});
          });
        }))
        .catch(err =>
          logger.error(`Error occurred on ES _connectionName: ${gesConnection._connectionName}`, err)
        );
    };

    const retry = () => {
      return promiseretry(function(retry, number) {
        console.log('es connect attempt number', number);
        return ping().catch(retry);
      }, {retries: 10});
    };

    return retry();
  };
};
