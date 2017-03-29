module.exports = function(R, _fantasy, appfuncs, uuid, logger, pgFuture) {

    return {
        checkIdempotency: function(originalEventNumber, eventHandlerName) {
            var query = 'SELECT * from "lastProcessedPosition" where "handlerType" = \'' + eventHandlerName + '\'';
            logger.debug(query);

            var handleResult = x => {
                const row = x.rows[0];
              logger.trace(`==========row=========`); 
              logger.trace(row);
              logger.trace(row.commitPossition);
              logger.trace(`==========END row=========`);
                const rowPosition = row && row.commitPosition ? row.commitPosition : -1;
                logger.debug(`event commit possition ${originalEventNumber}. 
                    db commit possition ${rowPosition}.`);
                var idempotent = parseInt(originalEventNumber) > parseInt(rowPosition);
                var result = {isIdempotent: idempotent};
                logger.debug(result);
                return result;
            };
            return pgFuture(query, handleResult);
        },

        recordEventProcessed: function(originalEventNumber, eventHandlerName) {
            var fh      = appfuncs.functionalHelpers;

            var query = `WITH UPSERT AS (
 UPDATE "lastProcessedPosition"
 SET "commitPosition" = '${originalEventNumber}',
  "handlerType" =  '${eventHandlerName}'
 WHERE "handlerType" = '${eventHandlerName}' )
 INSERT INTO "lastProcessedPosition"
 ("id", "commitPosition", "handlerType")
 SELECT '${uuid.v4() }' , '${originalEventNumber}', '${eventHandlerName }'
WHERE NOT EXISTS ( SELECT 1 from "lastProcessedPosition" where "handlerType" = '${eventHandlerName}')`;

            var handlerResult = r=>_fantasy.Maybe.of(r);
            return pgFuture(query, handlerResult);
        }
    }
};
