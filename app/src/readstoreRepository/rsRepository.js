module.exports = function(R, _fantasy, appfuncs, uuid, logger, pgFuture) {
  return {
    getById(id, table) {
      let query = (`SELECT * from "${table}" where "id" = '${id}'`);
      logger.debug(query);
      let handlerResult = x => {
        const row = x.rows[0];
        return row && row.document ? row.document : {};
      };

      // var handlerResult = R.compose(R.chain(fh.safeProp('document')), fh.safeProp('rows'));
      return pgFuture(query, handlerResult);
    },

    getByIds(ids, table) {
      let query = (`SELECT * from "${table}" where "id" in '(${ids.split(',')})'`);
      logger.debug(query);
      let handlerResult = x => {
        const row = x.rows[0];
        return row && row.document ? row.document : {};
      };

      // var handlerResult = R.compose(R.chain(fh.safeProp('document')), fh.safeProp('rows'));
      return pgFuture(query, handlerResult);
    },

    save(table, document, id) {
      try {
        let query;
        if (id) {
          query = `UPDATE "${table}" SET document = '${JSON.stringify(document)}' where id = '${id}'`;
        } else {
          query = `INSERT INTO "${table}" ("id", "document") VALUES ('${document.id}','${JSON.stringify(document)}')`;
        }
        logger.debug(query);
        let handlerResult = r => _fantasy.Maybe.of(r);
        return pgFuture(query, handlerResult);
      } catch (err) {
        logger.error(`error saving document: ${JSON.stringify(document)}, table: ${table}, id: ${id}`);
        logger.error(err);
      }
    },

    insertAggregateMeta(table, aggregate) {
      let query = `INSERT INTO "${table}" ("id", "meta") VALUES ('${aggregate.id}','${JSON.stringify(aggregate)}')`;
      logger.debug(query);
      let handlerResult = r => _fantasy.Maybe.of(r);
      return pgFuture(query, handlerResult);
    },

    getAggregateViewMeta(table, id) {
      let query = (`SELECT * from "${table}" where "id" = '${id}'`);
      logger.debug(query);
      let handlerResult = x => {
        const row = x.rows[0];
        return row && row.meta ? row.meta : {};
      };

      // var handlerResult = R.compose(R.chain(fh.safeProp('document')), fh.safeProp('rows'));
      return pgFuture(query, handlerResult);
    },

    saveAggregateView(table, aggregate, document) {
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
        let handlerResult = r => _fantasy.Maybe.of(r);
        return pgFuture(sql, handlerResult);
      } catch (err) {
        logger.error(`error in saveAggregateView
 aggregate: ${JSON.stringify(aggregate)},
 document: ${JSON.stringify(document)},
 table: ${table}`);
        logger.error(err);
      }
    },

    saveSingletonAggregateView(table, aggregate, document, id) {
      try {
        let query = `UPDATE "${table}" SET meta = '${JSON.stringify(aggregate)}',
 document = '${JSON.stringify(document)}' where id = '${id}'`;

        logger.debug(query);
        let handlerResult = r => _fantasy.Maybe.of(r);
        return pgFuture(query, handlerResult);
      } catch (err) {
        logger.error(`error in saveSingletonAggregateView document: ${JSON.stringify(document)},
 aggregate: ${JSON.stringify(aggregate)}
 table: ${table},
  id: ${id}`);
        logger.error(err);
      }
    },

    saveQuery(query) {
      try {
        logger.debug(query);

        let handlerResult = r => _fantasy.Maybe.of(r);
        return pgFuture(query, handlerResult);
      } catch (err) {
        logger.error(`error in savingQuery query: ${query}`);
        logger.error(err);
      }
    },

    query(query) {
      logger.debug(query);
      let fh = appfuncs.functionalHelpers;

      // need to return proper element.  rows is an array of objects with id and document
      let handlerResult = R.compose(R.map(fh.getSafeValue('document')), fh.getSafeValue('rows'));
      return pgFuture(query, handlerResult);
    }
  };
};
