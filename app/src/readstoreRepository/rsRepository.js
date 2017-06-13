module.exports = function(pgasync, uuid, logger) {
  return {
    async getById(id, table) {
      let query = (`SELECT * from "${table}" where "id" = '${id}'`);
      logger.debug(query);

      return await pgasync.query(query)
        .then(result => {
          const row = result.rows[0];
          return row && row.document ? row.document : {};
        });
    },

    async getByIds(ids, table) {
      let query = (`SELECT * from "${table}" where "id" in '(${ids.split(',')})'`);
      logger.debug(query);
      return await pgasync.query(query)
        .then(result => {
          const row = result.rows[0];
          return row && row.document ? row.document : {};
        });
    },

    async save(table, document, id) {
      try {
        let query;
        if (id) {
          query = `UPDATE "${table}" SET document = '${JSON.stringify(document)}' where id = '${id}'`;
        } else {
          query = `INSERT INTO "${table}" ("id", "document") VALUES ('${document.id}','${JSON.stringify(document)}')`;
        }
        logger.debug(query);
        return await pgasync.query(query);
      } catch (err) {
        logger.error(`error saving document: ${JSON.stringify(document)}, table: ${table}, id: ${id}`);
        logger.error(err);
      }
    },

    async insertAggregateMeta(table, aggregate) {
      let query = `INSERT INTO "${table}" ("id", "meta") VALUES ('${aggregate.id}','${JSON.stringify(aggregate)}')`;
      logger.debug(query);
      return await pgasync.query(query);
    },

    async getAggregateViewMeta(table, id) {
      let query = (`SELECT * from "${table}" where "id" = '${id}'`);
      logger.debug(query);
      return await pgasync.query(query)
        .then(result => {
          const row = result.rows[0];
          return row && row.meta ? row.meta : {};
        });
    },

    async saveAggregateView(table, aggregate, document) {
      try {
        let query;
        if (document.id) {
          query = `UPDATE "${table}" SET document = '${JSON.stringify(document)}' where id = '${document.id}';
        INSERT INTO "${table}" ("id", "document") SELECT '${document.id}','${JSON.stringify(document)}'
        WHERE NOT EXISTS (SELECT 1 FROM "${table}" WHERE id = '${document.id}');`;
        }
        let updateAggSql = `UPDATE "${table}" SET meta = '${JSON.stringify(aggregate)}' where id = '${aggregate.id}'`;
        let sql = `${query || ''};${updateAggSql}`;
        logger.debug(sql);
        return await pgasync.query(query);
      } catch (err) {
        logger.error(`error in saveAggregateView
 aggregate: ${JSON.stringify(aggregate)},
 document: ${JSON.stringify(document)},
 table: ${table}`);
        logger.error(err);
      }
    },

    async saveSingletonAggregateView(table, aggregate, document, id) {
      try {
        let query = `UPDATE "${table}" SET meta = '${JSON.stringify(aggregate)}',
 document = '${JSON.stringify(document)}' where id = '${id}'`;

        logger.debug(query);
        return await pgasync.query(query);
      } catch (err) {
        logger.error(`error in saveSingletonAggregateView document: ${JSON.stringify(document)},
 aggregate: ${JSON.stringify(aggregate)}
 table: ${table},
  id: ${id}`);
        logger.error(err);
      }
    },

    async saveQuery(query) {
      try {
        logger.debug(query);

        return await pgasync.query(query);

      } catch (err) {
        logger.error(`error in savingQuery query: ${query}`);
        logger.error(err);
      }
    },

    async query(query) {
      logger.debug(query);
      return await pgasync.query(query)
        .then(result => {
          const row = result.rows[0];
          return row && row.meta ? row.meta : {};
        });
    }
  };
};
