var connection = require('mongoose').connection;
var request = require('request');
var _ = require('lodash');

var Conn = require('../services/db');
var User = require('../models/user');

beforeEach(function (done) {
  var dbWrapper = new Conn();
  dbWrapper.start(function () {
    connection.db.dropDatabase();
  });
});

module.exports = {
  apiBaseAtDocker: 'http://localhost:4000',
  cookieJar: request.jar(),

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
      url: this.apiBaseAtDocker + '/login',
      jar: this.cookieJar
    };

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

