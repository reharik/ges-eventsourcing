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


module.exports = function(superagent, config, asyncretry) {
  const configs = config.configs.children.eventstore;
  const ping = async function(bail, number) {
    console.log('attempt to connect to the ES number', number, Date.now().toString());
    await superagent
      .get(`${configs.http}/streams/$projections-$all/0`)
      .set('Accept', 'application/vnd.eventstore.atom+json')
      .auth(configs.systemUsers.admin, configs.systemUsers.adminPassword)
      .then(function() {
        console.log(`=========="EventStore connection available"=========`);
        console.log("EventStore connection available"); // eslint-disable-line quotes
        console.log(`==========END "EventStore connection available"=========`);
      })
      .catch(() => {
        throw new Error('es does not exist');
      });
  };

  return () => {
    return asyncretry((bail, number) => ping(bail, number),
      Object.assign(configs.retry,
        {retries: 10}
      )
    );
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
