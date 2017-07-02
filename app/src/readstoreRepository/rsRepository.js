module.exports = function(pgasync,
                          aggregateRepository,
                          eventHelperRepository,
                          standardRepository) {
  return function(config) {
    const pg = new pgasync.default(config);
    return Object.assign(
      {},
      aggregateRepository(pg),
      eventHelperRepository(pg),
      standardRepository(pg));
  };
};
