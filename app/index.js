/**
 * Created by parallels on 9/3/15.
 */


let registry = require('./registry');

module.exports = function(_options) {
  let options = {
    logger: {
      moduleName: 'EventModels'
    }
  };
  options = Object.extend({}, options, _options || {});
  return registry(options);
};


