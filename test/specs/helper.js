var Bell = require('bell');
var Boom = require('boom');

var config = require('../../config');
var Server = require('../../services/server');
var Conn = require('../../services/db');

before(function (done) {
  // Mock the OAuth step of logging in by forcing the final OAuth
  // response through values passed in the `/login` URL.
  //
  // This setup isn't ideal because in the future it is possible
  // that extra code will be added that indiscrimately parses and
  // acts upon all URL params. This would only affect test code and
  // not any production code, so it's not such a big issue. The problem
  // is though that Bell.simulate() must be called before the server
  // starts. So a better way of setting this up would be to set all this
  // up in a beforeEach and pass in a custom callback to Bell.simulate().
  Bell.simulate(function (request, next) {
    var error, response;
    if (request.query.test_oauth_response) {
      response = JSON.parse(request.query.test_oauth_response);
    } else {
      response = null;
    }
    if (request.query.test_oauth_error) {
      error = Boom.badRequest(request.query.test_oauth_error);
    } else {
      error = null;
    }
    next(error, response);
  });

  var dbWrapper = new Conn();
  dbWrapper.start(function () {
    dbWrapper.deleteDb(function () {
      var server = new Server(config.port);
      server.start(done);
    });
  });
});
