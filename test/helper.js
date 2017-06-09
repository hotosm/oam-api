var connection = require('mongoose').connection;

beforeEach(function (done) {
  connection.db.dropDatabase(done);
});
