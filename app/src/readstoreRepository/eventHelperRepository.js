module.exports = function(R, _fantasy, appfuncs, uuid, logger, pgFuture) {

  return {
    checkIdempotency(commitPosition, eventHandlerName) {
      let query = 'SELECT * from "lastProcessedPosition" where "handlerType" = \'' + eventHandlerName + '\'';
      logger.debug(query);

      let handleResult = x => {
        const row = x.rows[0];
        const rowPosition = row && row.commitPosition ? row.commitPosition : -1;
        logger.debug(`event commit possition ${commitPosition}. 
                    db commit possition ${rowPosition}.`);
        let idempotent = parseInt(commitPosition) > parseInt(rowPosition);
        let result = {isIdempotent: idempotent};
        logger.debug(result);
        return result;
      };
      return pgFuture(query, handleResult);
    },

    recordEventProcessed(commitPosition, eventHandlerName) {

      let query = `WITH UPSERT AS (
 UPDATE "lastProcessedPosition"
 SET "commitPosition" = '${commitPosition}',
  "handlerType" =  '${eventHandlerName}'
 WHERE "handlerType" = '${eventHandlerName}' )
 INSERT INTO "lastProcessedPosition"
 ("id", "commitPosition", "handlerType")
 SELECT '${uuid.v4() }' , '${commitPosition}', '${eventHandlerName }'
WHERE NOT EXISTS ( SELECT 1 from "lastProcessedPosition" where "handlerType" = '${eventHandlerName}')`;

      let handlerResult = r=>_fantasy.Maybe.of(r);
      return pgFuture(query, handlerResult);
    }
  };
};
