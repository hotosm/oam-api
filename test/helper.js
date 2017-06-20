var connection = require('mongoose').connection;

var Server = require('../services/server.js');
var Conn = require('../services/db.js');

before(function (done) {
  var dbWrapper = new Conn();
  dbWrapper.start(function () {
    connection.db.dropDatabase();
    var server = new Server(2000);
    server.start(done);
  });
});
