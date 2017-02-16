module.exports = function(R, _fantasy, appfuncs, uuid, logger, pgFuture) {

    return {
        checkIdempotency: function(originalPosition, eventHandlerName) {
            var query = 'SELECT * from "lastProcessedPosition" where "handlerType" = \'' + eventHandlerName + '\'';
            logger.debug(query);

            var handleResult = x => {
                const row = x.rows[0];
                const rowPosition = row && row.commitPosition ? row.commitPosition : 0;
                logger.debug(`event commit possition ${originalPosition.CommitPosition}`);
                logger.debug(`db commit possition ${rowPosition}`);
                var idempotent = parseInt(originalPosition.CommitPosition) > parseInt(rowPosition);
                var result = {isIdempotent: idempotent};
                logger.debug(result);
                return result;
            };
            return pgFuture(query, handleResult);
        },

        recordEventProcessed: function(originalPosition, eventHandlerName) {
            var fh      = appfuncs.functionalHelpers;

            var query = `WITH UPSERT AS (
 UPDATE "lastProcessedPosition"
 SET "commitPosition" = '${fh.getSafeValue('commitPosition',originalPosition,  '')}'
, "preparePosition" = '${fh.getSafeValue('PreparePosition', originalPosition, '')}'
, "handlerType" =  '${eventHandlerName}'
 WHERE "handlerType" = '${eventHandlerName}' )
 INSERT INTO "lastProcessedPosition"
 ("id", "commitPosition", "preparePosition", "handlerType")
 SELECT '${uuid.v4() }' , '${fh.getSafeValue('commitPosition', originalPosition, '')}'
, '${fh.getSafeValue('PreparePosition', originalPosition, '')}', '${eventHandlerName }'
WHERE NOT EXISTS ( SELECT 1 from "lastProcessedPosition" where "handlerType" = '${eventHandlerName}')`;

            var handlerResult = r=>_fantasy.Maybe.of(r);
            return pgFuture(query, handlerResult);
        }
    }
};
