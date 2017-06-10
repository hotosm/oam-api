'use strict';

require('dotenv').config();
require('newrelic');

var config = require('./config');

var Conn = require('./services/db.js');
var Server = require('./services/server.js');

var db = new Conn();
db.start();

var server = new Server(config.port);
server.start();
