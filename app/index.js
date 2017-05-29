/**
 * Created by parallels on 9/3/15.
 */


let extend = require('extend');
let registry = require('./registry');

module.exports = function(_options) {
  let options = {
    logger: {
      moduleName: 'EventModels'
    }
  };
  extend(options, _options || {});
  return registry(options);
};


