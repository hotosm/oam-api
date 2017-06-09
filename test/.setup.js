process.env.NODE_ENV = 'test'
require('dotenv').config();

var Conn = require('../services/db.js');
var dbWrapper = new Conn();
dbWrapper.start();
