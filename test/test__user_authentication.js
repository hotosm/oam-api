'use strict';

var Server = require('../services/server');
var Lab = require('lab');
var server = require('../');
var chai = require('chai');

var lab = exports.lab = Lab.script();
var suite = lab.experiment;
var test = lab.test;
var before = lab.before;
// var after = lab.after;
var assert = chai.assert;

var cookie = null;

suite('test authentication', function () {
  before(function (done) {
    // Get a reference to the server.
    // Wait for everything to load.
    var serverWrapper = new Server(4000);
    serverWrapper.start(done);
    server = serverWrapper.hapi;
  });

  test('should fail authentication with missing username and password', function (done) {
    var options = {
      method: 'POST',
      url: '/login'
    };

    server.inject(options, function (response) {
      assert.equal(response.statusCode, 400);
      done();
    });
  });

  test('should fail authentication with missing password', function (done) {
    var options = {
      method: 'POST',
      url: '/login',
      payload: {
        username: 'admin'
      }
    };

    server.inject(options, function (response) {
      assert.equal(response.statusCode, 400);
      done();
    });
  });

  test('should fail authentication with missing username', function (done) {
    var options = {
      method: 'POST',
      url: '/login',
      payload: {
        password: 'admin'
      }
    };

    server.inject(options, function (response) {
      assert.equal(response.statusCode, 400);
      done();
    });
  });

  test('should fail authentication with invalid credentials', function (done) {
    var options = {
      method: 'POST',
      url: '/login',
      payload: {
        username: 'not the username',
        password: 'not the password'
      }
    };

    server.inject(options, function (response) {
      assert.equal(response.statusCode, 401);
      done();
    });
  });

  test('should authenticate using user and password', function (done) {
    var options = {
      method: 'POST',
      url: '/login',
      payload: {
        username: 'admin',
        password: 'admin'
      }
    };

    server.inject(options, function (response) {
      assert.equal(response.statusCode, 200);

      // Store the cookie to use on next requests
      cookie = response.headers['set-cookie'][0].split(' ')[0];
      done();
    });
  });

  test('should be authenticated using cookie from prev request', function (done) {
    var options = {
      method: 'GET',
      headers: {
        Cookie: cookie
      },
      url: '/login'
    };

    server.inject(options, function (response) {
      assert.equal(response.statusCode, 200);
      done();
    });
  });
});

