process.env.INTEGRATION_TESTS = 'true';

var Conn = require('../../services/db');

before(function (done) {
  var dbWrapper = new Conn();
  dbWrapper.start(function () {
    done();
  });
});

beforeEach(function (done) {
  var dbWrapper = new Conn();
  dbWrapper.deleteDb(function () {
    done();
  });
});
