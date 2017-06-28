var connection = require('mongoose').connection;
var Bell = require('bell');
var Boom = require('boom');
var request = require('request');
var _ = require('lodash');

var config = require('../../config');
var Server = require('../../services/server');
var Conn = require('../../services/db');
var User = require('../../models/user');

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
    connection.db.dropDatabase();
    var server = new Server(config.port);
    server.start(done);
  });
});

module.exports = {
  apiBaseAtDocker: 'http://localhost:4000',
  cookieJar: request.jar(),

  // Pass a fake OAuth response as a request parameter. Used
  // in conjunction with Bell.simulate().
  setTestOauthResponse: function (response) {
    return {
      test_oauth_response: JSON.stringify(response)
    };
  },

  createUser: function (user, callback) {
    user = _.defaults(user, {
      name: 'Tester',
      facebook_id: 123
    });

    User.create(user).then(function (result) {
      callback(result);
    }).catch(function (err) {
      console.error(err);
      callback(false);
    });
  },

  logUserIn: function (oauthUser, callback, redirect) {
    var options = {
      url: config.apiEndpoint + '/login',
      qs: this.setTestOauthResponse({
        profile: { id: oauthUser.facebook_id }
      }),
      jar: this.cookieJar
    };

    if (redirect) {
      options.qs.original_uri = redirect;
    }

    request.get(options, function (err, httpResponse, body) {
      if (err) {
        throw new Error(err);
      }
      callback(httpResponse, body);
    });
  },

  logIn: function (callback) {
    this.createUser({}, function (user) {
      this.logUserIn(user, callback);
    });
  },

  // Wait for images to be fully uploaded, processed and indexed
  // inside a local test Docker instance of the current codebase.
  waitForProcessing: function (id, title, processedCb) {
    this.waitForConversion(id, function () {
      this.waitForIndexing(title, processedCb);
    });
  },

  // The dynamic tiler fetches the images, processes, transcodes it,
  // creates metadata for it, and so on.
  waitForConversion: function (id, callback) {
    var getOptions = {
      url: this.apiBaseAtDocker + '/uploads/' + id,
      json: true
    };

    request.get(getOptions, (_err, httpResponse, body) => {
      var status = body.results.scenes[0].images[0].status;
      if (status === 'finished') {
        callback();
      } else {
        setTimeout(this.waitForConversion, 100, id, callback);
      }
    });
  },

  // This comes from the periodic cron to check the bucket for
  // new imagery. Once a new image's *meta.json is found it is
  // parsed and added to the DB.
  waitForIndexing: function (title, processedCb) {
    var getOptions = {
      url: this.apiBaseAtDocker + '/meta?title=' + title,
      json: true
    };

    request.get(getOptions, (_err, httpResponse, body) => {
      if (body.results.length > 0) {
        processedCb(body.results[0]);
      } else {
        setTimeout(this.waitForIndexing, 100, title, processedCb);
      }
    });
  }
};
