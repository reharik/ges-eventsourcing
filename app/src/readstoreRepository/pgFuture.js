module.exports = function(pg, R, _fantasy, appfuncs) {

  return function(_options) {
    let options = _options && _options.postgres ? _options.postgres : {};
    let fh = appfuncs.functionalHelpers;
    let Future = fh.Future;
    return function(query, handleResult) {
      return Future((rej, ret) => {
        let pgClient = new pg.Client(options.config);
        pgClient.connect(cErr => {
          if (cErr) {
            throw new Error('Error connecting to postgres', cErr);
          }
          pgClient.query(query, (err, result) => {
            if (err) {
              rej(fh.loggerTap(err, 'error'));
              return pgClient.end();
            }
            let payload = handleResult(result);
                        // ret(fh.loggerTap(payload,'debug', JSON.stringify(payload)));
            ret(payload);
            pgClient.end();
          });
        });
      });
    };
  };
};
