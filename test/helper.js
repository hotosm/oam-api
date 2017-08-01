var request = require('request');
var _ = require('lodash');
var Iron = require('iron');

var config = require('../config');
var User = require('../models/user');

module.exports = {
  cookieJar: request.jar(),

  // When running against the containerised API it's pretty hard to go through the whole
  // OAuth flow, ie logging into Facebook, accepting the app's terms, etc. So it's easier
  // just to generate the cookie ourselves.
  generateSecureCookieForUser: function (user, callback) {
    user.updateSession(function (_err, sessionId) {
      var session = {
        sessionId: sessionId
      };
      Iron.seal(session, config.cookiePassword, Iron.defaults, function (_err, sealed) {
        var cookie =
          config.sessionCookieKey + '=' +
          sealed + '; ' +
          'Path=/; SameSite=Strict; hostOnly=true; aAge=10ms; cAge=770ms;';
        callback(cookie);
      });
    });
  },

  // Pass a fake OAuth response as a request parameter. Used
  // in conjunction with Bell.simulate().
  setTestOauthResponse: function (response) {
    return {
      test_oauth_response: JSON.stringify(response)
    };
  },

  createUser: function (userDetails, callback) {
    var user = _.defaults(userDetails, {
      name: 'Tester',
      facebook_id: 123
    });

    User.create(user).then(function (result, e) {
      callback(result);
    }).catch(function (err) {
      console.error(err);
      callback(false);
    });
  },

  logUserIn: function (oauthUser, callback, redirect) {
    var options = {
      url: config.apiEndpoint + '/oauth/facebook',
      qs: this.setTestOauthResponse({
        profile: { id: oauthUser.facebook_id }
      }),
      jar: this.cookieJar
    };

    if (redirect) {
      options.qs.original_uri = redirect;
    }

    request.get(options, (err, httpResponse, body) => {
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
    this.waitForConversion(id, () => {
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
      if (body.results.length > 0 && body.results[0].meta_uri != null) {
        processedCb(body.results[0]);
      } else {
        setTimeout(this.waitForIndexing.bind(this), 100, title, processedCb);
      }
    });
  }
};
