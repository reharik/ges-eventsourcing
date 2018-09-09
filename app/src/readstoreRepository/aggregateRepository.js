module.exports = function(uuid, logger) {
  return function(pg) {
    return {
      async insertAggregateMeta(table, aggregate) {
        let query = `INSERT INTO "${table}" ("id", "meta") 
          VALUES ('${aggregate.id}','${this.sanitizeDocument(aggregate)}')`;
        logger.debug(query);
        return await pg.query(query);
      },

      async getAggregateViewMeta(table, id) {
        let query = (`SELECT * from "${table}" where "id" = '${id}'`);
        logger.debug(query);
        return await pg.query(query)
          .then(result => {
            const row = result.rows[0];
            return row && row.meta ? row.meta : {};
          });
      },

      async saveAggregateView(table, aggregate, document, idName = 'id') {
        try {
          let query;
          if (document && document[idName]) {
            query = `UPDATE "${table}" SET document = '${this.sanitizeDocument(document)}' 
            where id = '${document[idName]}';
        INSERT INTO "${table}" ("id", "document") SELECT '${document[idName]}','${this.sanitizeDocument(document)}'
        WHERE NOT EXISTS (SELECT 1 FROM "${table}" WHERE id = '${document[idName]}');`;
          }
          let updateAggSql = `UPDATE "${table}" SET meta = '${this.sanitizeDocument(aggregate)}'
            where id = '${aggregate.id}'`;
          let sql = `${query || ''}${updateAggSql}`;
          logger.debug(sql);
          return await pg.query(sql);
        } catch (err) {
          logger.error(`error in saveAggregateView
 aggregate: ${this.sanitizeDocument(aggregate)},
 document: ${document && this.sanitizeDocument(document)},
 table: ${table}`);
          logger.error(err);
        }
        return undefined;
      },

      async saveSingletonAggregateView(table, aggregate, document, id) {
        try {
          let query = `UPDATE "${table}" SET meta = '${this.sanitizeDocument(aggregate)}',
 document = '${this.sanitizeDocument(document)}' where id = '${id}'`;

          logger.debug(query);
          return await pg.query(query);
        } catch (err) {
          logger.error(`error in saveSingletonAggregateView document: ${this.sanitizeDocument(document)},
 aggregate: ${this.sanitizeDocument(aggregate)}
 table: ${table},
  id: ${id}`);
          logger.error(err);
        }
        return undefined;
      }
    };
  };
};
