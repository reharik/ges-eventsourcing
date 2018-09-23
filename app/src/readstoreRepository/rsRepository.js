module.exports = function(pg,
  pingDB,
  aggregateRepository,
  eventHelperRepository,
  standardRepository) {
  return async function() {
    let pool;
    let repo;
    try {
      pool = await pingDB();
      pool.on('error', async err => {
        console.log(`==========pg pool error==========`);
        console.log(err);
        console.log(`==========END pg pool error==========`);
        pool = await pingDB();
      });
      repo = Object.assign(
        {},
        aggregateRepository(pool),
        eventHelperRepository(pool),
        standardRepository(pool));
    } catch (err) {
      console.log(`=========="connection to pg threw an error"==========`);
      console.log('connection to pg threw an error');
      console.log(err);
      console.log(`==========END "connection to pg threw an error"==========`);

      pool = await pingDB();
    }
    return repo;
  };
};
