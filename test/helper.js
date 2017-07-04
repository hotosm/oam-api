var request = require('request');
var _ = require('lodash');

var config = require('../config');
var User = require('../models/user');

module.exports = {
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
    this.createUser({}, (user) => {
      this.logUserIn(user, function () {
        callback(user);
      });
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
      url: config.apiEndpoint + '/uploads/' + id,
      json: true
    };

    request.get(getOptions, (_err, httpResponse, body) => {
      var status = body.results.scenes[0].images[0].status;
      if (status === 'finished') {
        callback();
      } else {
        setTimeout(this.waitForConversion.bind(this), 100, id, callback);
      }
    });
  },

  // This comes from the periodic cron to check the bucket for
  // new imagery. Once a new image's *meta.json is found it is
  // parsed and added to the DB.
  waitForIndexing: function (title, processedCb) {
    var getOptions = {
      url: config.apiEndpoint + '/meta?title=' + title,
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
