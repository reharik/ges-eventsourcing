module.exports = function(eventstoreConnection, promiseretry, logger) {
  var ping = function(options) {
    const configs = options.eventstore;
    console.log(`==========configs=========`);
    console.log(configs);
    console.log(`==========END configs=========`);

    return eventstoreConnection(configs);
  };
  return options => {
    return promiseretry(function(retry, number) {
      console.log('es connect attempt number', number);
      return ping(options).catch(retry);
    }, {retries: 10});
  };
};