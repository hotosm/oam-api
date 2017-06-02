'use strict';

require('envloader').load();
require('newrelic');
var Conn = require('./services/db.js');
var Server = require('./services/server.js');

var db = new Conn();
db.start();

var server = new Server(process.env.PORT || 4000);
server.start();
