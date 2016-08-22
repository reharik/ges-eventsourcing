/**
 * Created by parallels on 9/3/15.
 */
"use strict";

var extend = require('extend');
var registry = require('./registry');

module.exports = function(_options) {
    var options = {
        logger: {
            moduleName: 'eventsourcing'
        }
    };
    extend(options, _options || {});
    var container = registry(options);
    console.log('==========container=========');
    console.log(container); 
    console.log('==========END container=========');
    return  container;
};


