module.exports = function(uuid, logger) {
  return function(pg) {
    return {
      async insertAggregateMeta(table, aggregate) {
        let query = `INSERT INTO "${table}" ("id", "meta") VALUES ('${aggregate.id}','${JSON.stringify(aggregate)}')`;
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

      async saveAggregateView(table, aggregate, document) {
        try {
          let query;
          if (document.id) {
            query = `UPDATE "${table}" SET document = '${JSON.stringify(document)}' where id = '${document.id}';
        INSERT INTO "${table}" ("id", "document") SELECT '${document.id}','${JSON.stringify(document)}'
        WHERE NOT EXISTS (SELECT 1 FROM "${table}" WHERE id = '${document.id}');`;
          }
          let updateAggSql = `UPDATE "${table}" SET meta = '${JSON.stringify(aggregate)}' where id = '${aggregate.id}'`;
          let sql = `${query || ''}${updateAggSql}`;
          logger.debug(sql);
          return await pg.query(query);
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
          return await pg.query(query);
        } catch (err) {
          logger.error(`error in saveSingletonAggregateView document: ${JSON.stringify(document)},
 aggregate: ${JSON.stringify(aggregate)}
 table: ${table},
  id: ${id}`);
          logger.error(err);
        }
      }
    };
  };
};
