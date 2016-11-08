/**
 * Created by rharik on 11/23/15.
 */


module.exports = function(pg, R, _fantasy, appfuncs, uuid, logger) {

    return function(_options) {
        var options = _options && _options.postgres ? _options.postgres : {};
        var fh      = appfuncs.functionalHelpers;
        var Future  = fh.Future;
        var pgFuture = function(query, handleResult) {
            return Future((rej, ret) => {
                var pgClient = new pg.Client(options.connectionString + options.database);
                pgClient.connect(cErr => {
                    if (cErr) {
                        return rej(fh.loggerTap(cErr),'debug');
                    }
                    pgClient.query(query, (err, result) => {
                        if (err) {
                            rej(fh.loggerTap(err,'error'));
                            return pgClient.end();
                        }
                        var payload = handleResult(result);
                        ret(fh.loggerTap(payload,'debug', JSON.stringify(payload)));
                        pgClient.end();
                    });
                });
            });
        };

        var getById = function(id, table) {
            var query         = ('SELECT * from "' + table + '" where "id" = \'' + id + '\'');
            logger.debug(query);
            var handleResult = x => {
                const row = x.rows[0];
                return row && row.document ? row.document : {}
            }

            // var handlerResult = R.compose(R.chain(fh.safeProp('document')), fh.safeProp('rows'));
            return pgFuture(query, handlerResult);
        };

        var save = function(table, document, id) {
            var query;
            if (id) {
                query = 'UPDATE "' + table + '" SET document = \'' + JSON.stringify(document) + '\' where id = \'' + id + '\'';
            } else {
                query = 'INSERT INTO "' + table + '" ("id", "document") VALUES (\'' + document.id + '\',\'' + JSON.stringify(document) + '\')';
            }
            logger.debug(query);
            var handlerResult = r=>_fantasy.Maybe.of(r);
            return pgFuture(query, handlerResult);
        };

        var query = function(query) {
            logger.debug(query);
            // need to return proper element.  rows is an array of objects with id and document
            var handlerResult =  R.compose(R.map(fh.getSafeValue('document')), fh.getSafeValue('rows' ));
            return pgFuture(query, handlerResult);
        };

        var checkIdempotency = function(originalPosition, eventHandlerName) {
            var query = 'SELECT * from "lastProcessedPosition" where "handlerType" = \'' + eventHandlerName + '\'';
            logger.debug(query);

            var handleResult = x => {
                const row = x.rows[0];
                const rowPosition = row && row.commitPosition ? row.commitPosition : 0
                logger.debug(`event commit possition ${originalPosition.CommitPosition}`);
                logger.debug(`db commit possition ${rowPosition}`);

                var idempotent = originalPosition.CommitPosition > rowPosition;
                var result = {isIdempotent: idempotent};
                logger.debug(result);
                return result;
            };
            return pgFuture(query, handleResult);
        };

        var recordEventProcessed = function(originalPosition, eventHandlerName) {

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
            logger.debug(query);

            var handlerResult = r=>_fantasy.Maybe.of(r);
            return pgFuture(query, handlerResult);
        };

        return {
            getById,
            save,
            query,
            checkIdempotency,
            recordEventProcessed
        }
    }
};
