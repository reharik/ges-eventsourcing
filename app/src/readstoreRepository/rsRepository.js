/**
 * Created by rharik on 11/23/15.
 */


module.exports = function(pg, R, _fantasy, appfuncs, uuid, logger) {

    return function(_options) {
        var options = _options && _options.postgres ? _options.postgres : {};
        var fh      = appfuncs.functionalHelpers;
        var Future  = _fantasy.Future;
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
            var query         = ('SELECT * from "' + table + '" where "Id" = \'' + id + '\'');
            logger.debug(query);
            var handlerResult = R.compose(R.chain(fh.safeProp('document')), fh.safeProp('rows'));
            return pgFuture(query, handlerResult);
        };

        var save = function(table, document, id) {
            var query;
            if (id) {
                query = 'UPDATE "' + table + '" SET document = \'' + JSON.stringify(document) + '\' where Id = \'' + id + '\'';
            } else {
                query = 'INSERT INTO "' + table + '" ("id", "document") VALUES (\'' + document.id + '\',\'' + JSON.stringify(document) + '\')';
            }
            logger.debug(query);
            var handlerResult = r=>_fantasy.Maybe.of(r);
            return pgFuture(query, handlerResult);
        };

        var query = function(query) {
            logger.debug(query);
            var handlerResult = r=>_fantasy.Maybe.of(r);
            return pgFuture(query, handlerResult);
        };

        var checkIdempotency = function(originalPosition, eventHandlerName) {

            var query              = 'SELECT * from "lastProcessedPosition" where "handlerType" = \'' + eventHandlerName + '\'';
            logger.debug(query);
            var mGreater           = R.lift(R.gt);
            var curriedGreater     = mGreater(fh.safeProp(originalPosition, 'CommitPosition'));
            var takeFirst          = x => x[0];
            var handleRowIfPresent = R.compose(curriedGreater, R.chain(fh.safeProp('commitPosition')), R.map(takeFirst), fh.safeProp('rows'));
            var handlerResult = x =>
                mGreater(fh.safeProp('rowCount', x), R.of(0))[0]
                    ? fh.loggerTap({isIdempotent: handleRowIfPresent(x).getOrElse(false)},'info')
                    : fh.loggerTap({isIdempotent: true},'info');

            return pgFuture(query, handlerResult);
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
