module.exports = function(
  nodeeventstoreclient,
  promiseretry,
  superagent) {

  const ping = options => {
    return superagent
      .get(`${options.http}/streams/$projections-$all/0`)
      .set('Accept', 'application/vnd.eventstore.atom+json')
      .auth(options.systemUsers.admin, options.systemUsers.adminPassword)
      .then(function(res) {
        console.log(`=========="EventStore connection available"=========`);
        console.log("EventStore connection available"); // eslint-disable-line quotes
        console.log(`==========END "EventStore connection available"=========`);
        return res.body;
      });
  };

  return options => {
    return promiseretry(function(retry, number) {
      console.log('es connect attempt number', number);
      return ping(options).catch(retry);
    }, {retries: 10});
  };
};
