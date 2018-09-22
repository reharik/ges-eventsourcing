module.exports = function(pg, pingDB,
  aggregateRepository,
  eventHelperRepository,
  standardRepository) {
  return async function(config) {
    await pingDB();
    const client = new pg.Client(config);
    await client.connect();
    client.on('error', async() => {
      console.log(`=========="connection to pg threw an error"==========`);
      console.log('connection to pg threw an error');
      console.log(`==========END "connection to pg threw an error"==========`);

      await pingDB();
    });
    return Object.assign(
      {},
      aggregateRepository(client),
      eventHelperRepository(client),
      standardRepository(client));
  };
};
