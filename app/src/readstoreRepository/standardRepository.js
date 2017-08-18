module.exports = function(uuid, logger) {
  return function(pg) {
    return {
      sanitizeDocument(name) {
        let _name = JSON.stringify(name).replace(/'/g, "''");
        return _name.trim();
      },

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

      async save(table, document, id) {
        try {
          let query = `INSERT INTO "${table}" ("id", "document") 
          SELECT '${document.id}','${this.sanitizeDocument(document)}'
        ON CONFLICT (id)
        DO UPDATE SET document = '${this.sanitizeDocument(document)}'`;
          logger.debug(query);
          return await pg.query(query);
        } catch (err) {
          logger.error(`error saving document: 
this.sanitizeDocument(document)}, table: ${table}, id: ${id}`);
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
