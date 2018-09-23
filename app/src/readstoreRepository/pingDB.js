module.exports = function(pg, config, asyncretry) {
  let pool;
  const ping = async function(bail, number) {
    console.log('attempt to connect to the db number', number);
    if (!pool) {
      const configs = config.configs.children.postgres.config;
      console.log(`==========configs=========`);
      console.log(configs);
      console.log(`==========END configs=========`);
      pool = new pg.Pool(configs);
    }
    const result = await pool.query(
      `select relname as table from pg_stat_user_tables where schemaname = 'public'`,
    );

    if (result.rowCount === 0) {
      throw new Error('db does not exist');
    }
    console.log('==========dbExists=========');
    console.log(true);
    console.log('==========END dbExists=========');
    return pool;
  };

  return () => {
    return asyncretry((bail, number) => ping(bail, number), {
      retries: 10
    });
  };
};
