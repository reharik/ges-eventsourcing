module.exports = function(pgasync, uuid, logger) {

  return {
    async checkIdempotency(commitPosition, eventHandlerName) {
      let query = 'SELECT * from "lastProcessedPosition" where "handlerType" = \'' + eventHandlerName + '\'';
      logger.debug(query);
      return await pgasync.query(query)
        .then(response => {
          const row = response.rows[0];
          const rowPosition = row && row.commitPosition ? row.commitPosition : -1;
          logger.debug(`event commit possition ${commitPosition}. 
                    db commit possition ${rowPosition}.`);
          let idempotent = parseInt(commitPosition) > parseInt(rowPosition);
          let result = {isIdempotent: idempotent};
          logger.debug(result);
          return result;
        });
    },

    async recordEventProcessed(commitPosition, eventHandlerName) {

      let query = `WITH UPSERT AS (
 UPDATE "lastProcessedPosition"
 SET "commitPosition" = '${commitPosition}',
  "handlerType" =  '${eventHandlerName}'
 WHERE "handlerType" = '${eventHandlerName}' )
 INSERT INTO "lastProcessedPosition"
 ("id", "commitPosition", "handlerType")
 SELECT '${uuid.v4() }' , '${commitPosition}', '${eventHandlerName }'
WHERE NOT EXISTS ( SELECT 1 from "lastProcessedPosition" where "handlerType" = '${eventHandlerName}')`;

      return await pgasync.query(query);

    }
  };
};
