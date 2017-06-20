module.exports = function(uuid, logger) {
  return function(pg) {
    return {
      async getById(id, table) {
        let query = (`SELECT * from "${table}" where "id" = '${id}'`);
        logger.debug(query);

        return await pg.query(query)
          .then(result => {
            const row = result.rows[0];
            return row && row.document ? row.document : {};
          });
      },

      async getByIds(ids, table) {
        let query = (`SELECT * from "${table}" where "id" in '(${ids.split(',')})'`);
        logger.debug(query);
        return await pg.query(query)
          .then(result => {
            const row = result.rows[0];
            return row && row.document ? row.document : {};
          });
      },

      async save(table, document) {
        try {
          let query = `UPDATE "${table}" SET document = '${JSON.stringify(document)}' where id = '${document.id}';
        INSERT INTO "${table}" ("id", "document") SELECT '${document.id}','${JSON.stringify(document)}'
        WHERE NOT EXISTS (SELECT 1 FROM "${table}" WHERE id = '${document.id}');`;
          logger.debug(query);
          return await pg.query(query);
        } catch (err) {
          logger.error(`error saving document: ${JSON.stringify(document)}, table: ${table}, id: ${document.id}`);
          logger.error(err);
        }
      },

      async saveQuery(query) {
        try {
          logger.debug(query);

          return await pg.query(query);

        } catch (err) {
          logger.error(`error in savingQuery query: ${query}`);
          logger.error(err);
        }
      },

      async query(query) {
        logger.debug(query);
        return await pg.query(query)
          .then(result => {
            return result.rows.map(x => x.document || []);
          });
      }
    };
  };
};
