module.exports = function(eventstoreConnection, promiseretry) {
  const ping = function(options) {
    const configs = options.eventstore;
    return eventstoreConnection(configs);
  };
  return options => {
    return promiseretry(function(retry, number) {
      console.log('es connect attempt number', number);
      return ping(options).catch(retry);
    }, {retries: 10});
  };
};
