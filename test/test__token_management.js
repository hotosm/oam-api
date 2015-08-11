'use strict';

var Lab = require('lab');
var server = require('../');
var chai = require('chai');
var MongoClient = require('mongodb').MongoClient;

var lab = exports.lab = Lab.script();
var suite = lab.experiment;
var test = lab.test;
var before = lab.before;
var after = lab.after;
var assert = chai.assert;

var cookie = null;

suite('test tokens', function () {

  before(function (done) {
    // Get a reference to the server.
    // Wait for everything to load.
    // Change to test db
    server(function (hapi) {
      server = hapi;
      // Prepare db.
      // Close current connection.
      hapi.plugins.db.connection.close(function () {
        // Open connection to test DB.
        MongoClient.connect('mongodb://localhost/oam-uploader-test', function (err, db) {
          if (err) throw err;
          hapi.plugins.db.connection = db;

          // Insert some data.
          db.collection('tokens').insert([
            {
              name: 'Primary token',
              expiration: false,
              status: 'active',
              token: '067e6c88d03021957a13b6406ca753b805a03331c914f36a33539de38622a90f87f10851e0e70eeb76f4e652ab282f0502ce3f420522d7c7d68f0fada19adb14',
              created: '2015-08-10T13:38:48.684Z',
              updated: null
            },
            {
              name: 'Secondary token',
              expiration: '2020-08-10T13:38:48.684Z',
              status: 'active',
              token: '112fec071ca3414f8e1a7538eab67bfaf3d6fc3376147434b6f0ac9923c4a145b35d33e0970adf0a71110473dec4299cd2c6abcdf7d06dab6f344e5d14951a0d',
              created: '2015-08-10T13:38:48.684Z',
              updated: null
            }
          ], function (err, res) {
            if (err) throw err;
            // Cookie
            var options = {
              method: 'POST',
              url: '/login',
              payload: {
                username: 'admin',
                password: 'admin'
              }
            };

            server.inject(options, function (response) {
              // Store the cookie to use on next requests
              cookie = response.headers['set-cookie'][0].split(' ')[0];
              done();
            });

          });
        });
      });
    });
  });

  after(function (done) {
    server.plugins.db.connection.dropDatabase(function () {
      done();
    });
  });

  test('should create token', function (done) {
    var options = {
      method: 'POST',
      url: '/tokens',
      headers: {
        Cookie: cookie
      },
      payload: {
        name: 'Test token',
        expiration: false,
        status: 'active'
      }
    };

    server.inject(options, function (response) {
      // var result = response.result;
      assert.equal(response.statusCode, 201);
      done();
    });
  });

});

