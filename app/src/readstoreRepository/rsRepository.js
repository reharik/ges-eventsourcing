module.exports = function(pg,
  pingDB,
  aggregateRepository,
  eventHelperRepository,
  standardRepository) {
  return async function(options) {
    let pool = await pingDB(options);
    pool.on('error', async err => {
      console.log(`==========pg pool error==========`);
      console.log(err);
      console.log(`==========END pg pool error==========`);
      pool = await pingDB();
    });
    return Object.assign(
      {},
      aggregateRepository(pool),
      eventHelperRepository(pool),
      standardRepository(pool));
  };
};
