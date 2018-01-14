module.exports = function(
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
      return ping(options).catch(err => {
        console.log(err);
        retry(err);
      });
    }, {retries: options.retryCount || 5});
  };
};


/************** run in console *********

const promiseretry = require('promise-retry');
const superagent = require('superagent');

const opts = {
  "host": "localhost",
    "http": "eventstore:2113",
    "systemUsers": {
    "admin": "admin",
      "adminPassword": "changeit"
  }
};

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

    promiseretry(function(retry, number) {
      console.log(retry);
      console.log('es connect attempt number', number);
      return ping(opts).catch(retry);
    }, {retries: 10});
 */
