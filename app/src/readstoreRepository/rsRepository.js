module.exports = function(pg, pingDB,
  aggregateRepository,
  eventHelperRepository,
  standardRepository) {
  return async function(config) {
    await pingDB();
    const client = new pg.Client(config);
    await client.connect();
    client.on('error', async() => {
      await pingDB();
    });
    return Object.assign(
      {},
      aggregateRepository(pg),
      eventHelperRepository(pg),
      standardRepository(pg));
  };
};
