'use strict';

var expect = require('chai').expect;
var request = require('request');

var connection = require('mongoose').connection;
var config = require('../../config');
var User = require('../../models/user');

require('./helper');
var commonHelper = require('../helper');

describe('Auth', function () {
  beforeEach(function (done) {
    connection.db.dropDatabase();
    done();
  });

  context('For an already existent user', function () {
    var existingUser;

    beforeEach(function (done) {
      commonHelper.createUser({
        facebook_id: 123,
        session_id: null
      }, function (result) {
        existingUser = result;
        done();
      });
    });

    it('should set a new session for OAuth login', function (done) {
      commonHelper.logUserIn(existingUser, function (httpResponse, body) {
        expect(httpResponse.statusCode).to.equal(200);
        User.findOne({
          facebook_id: existingUser.facebook_id
        }).then(function (updatedUser) {
          expect(updatedUser.session_id).to.not.eq(null);
          expect(updatedUser.session_id).to.not.eq(existingUser.session_id);
          expect(updatedUser.session_expiration).to.be.gt(new Date());
          done();
        });
      });
    });

    it('should redirect to the URL specified by a param', function (done) {
      commonHelper.logUserIn(existingUser, function (httpResponse, body) {
        expect(httpResponse.statusCode).to.equal(200);
        expect(httpResponse.request.uri.path).to.equal('/user');
        done();
      }, '/user');
    });

    it('should log a user in based on their session', function (done) {
      var options = {
        url: config.apiEndpoint + '/user',
        jar: commonHelper.cookieJar,
        json: true
      };

      commonHelper.logUserIn(existingUser, function (loggedUserHttpResponse, _body) {
        request.get(options, function (_err, httpResponse, body) {
          expect(httpResponse.statusCode).to.equal(200);
          expect(body.results.name).to.equal(existingUser.name);
          done();
        });
      });
    });

    context('Preventing bad logins', function () {
      it('should not log a user if their session ID is wrong', function (done) {
        var options = {
          url: config.apiEndpoint + '/user',
          jar: commonHelper.cookieJar
        };

        commonHelper.logUserIn(existingUser, function (loggedUserHttpResponse, _body) {
          existingUser.session_id = 'wrong123';
          existingUser.save(function () {
            request.get(options, function (_err, httpResponse, body) {
              expect(httpResponse.statusCode).to.equal(401);
              done();
            });
          });
        });
      });

      it('should not log a user if their session is old', function (done) {
        var options = {
          url: config.apiEndpoint + '/user',
          jar: commonHelper.cookieJar
        };

        commonHelper.logUserIn(existingUser, function (loggedUserHttpResponse, _body) {
          existingUser.session_expiration = new Date();
          existingUser.save(function () {
            request.get(options, function (_err, httpResponse, body) {
              expect(httpResponse.statusCode).to.equal(401);
              done();
            });
          });
        });
      });
    });
  });

  context('For a non-existent user', function () {
    it('should create a new user and set their session', function (done) {
      var options = {
        url: config.apiEndpoint + '/login',
        qs: commonHelper.setTestOauthResponse({
          profile: {
            id: 456,
            displayName: 'Tester'
          }
        })
      };

      request.get(options, function (_err, httpResponse, body) {
        expect(httpResponse.statusCode).to.equal(200);
        User.count({}, function (_err, count) {
          expect(count).to.eq(1);
          User.findOne({
            facebook_id: 456
          }).then(function (user) {
            expect(user.name).to.eq('Tester');
            expect(user.session_id).to.not.eq(null);
            done();
          });
        });
      });
    });

    context('Preventing bad logins', function () {
      it('should not set a session if OAuth flow fails', function (done) {
        var options = {
          url: config.apiEndpoint + '/login',
          qs: {
            test_oauth_error: 'Fake OAuth error'
          },
          json: true
        };

        request.get(options, function (_err, httpResponse, body) {
          expect(httpResponse.statusCode).to.equal(400);
          expect(body.message).to.eq('Fake OAuth error');
          User.count({}, function (_err, count) {
            expect(count).to.eq(0);
            done();
          });
        });
      });
    });
  });
});
