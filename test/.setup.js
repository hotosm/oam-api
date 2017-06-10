process.env.NODE_ENV = 'test'
require('dotenv').config();

// Reduce verbosity unless explicitly requested
if (process.env.OAM_DEBUG !== 'true') {
  var methods = ['info', 'debug'];
  for (var i = 0; i < methods.length; i++) {
    console[methods[i]] = function () {};
  }
}

var Conn = require('../services/db.js');
var dbWrapper = new Conn();
dbWrapper.start();
