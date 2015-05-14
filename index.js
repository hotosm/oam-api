'use strict';

require('envloader').load();
var Conn = require('./services/db.js');
var Server = require('./services/server.js');

var db = new Conn(process.env.DBNAME || 'osm-catalog');
db.start();

var server = new Server(process.env.PORT || 4000);
server.start();
