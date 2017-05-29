/**
 * Created by parallels on 9/3/15.
 */


let dagon = require('dagon');
let path = require('path');

module.exports = function(_options) {
  let options = _options || {};
  let registry = dagon(options.dagon).registry;
  return registry(x=>
        x.pathToRoot(path.join(__dirname, '..'))
            .requireDirectoryRecursively('./app/src')
            .complete());
};
