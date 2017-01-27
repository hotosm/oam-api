'use strict';

var Lab = require('lab');
var chai = require('chai');
var http = require('http');
var ecstatic = require('ecstatic');
var MongoClient = require('mongodb').MongoClient;
var omit = require('omit-deep');
var config = require('../config');
var api = require('../');

var lab = exports.lab = Lab.script();
var suite = lab.experiment;
var test = lab.test;
var before = lab.before;
var after = lab.after;
var assert = chai.assert;

suite('test worker', function () {
  var server;
  var db;
  var uploadId;

  before(function (done) {
    assert.match(config.dbUri, /test$/, 'use the test database');
    assert.equal(config.oinBucket, 'oam-uploader');

    // empty out database
    MongoClient.connect(config.dbUri, function (err, conn) {
      if (err) { return done(err); }
      db = conn;
      db.dropDatabase(function (err) {
        if (err) { return done(err); }
        // serve up our test fixtures to be downloaded
        server = http.createServer(ecstatic({ root: __dirname + '/fixture' }))
        .on('listening', function () { done(); })
        .on('error', done);
        server.listen(8080);
      });
    });
  });

  after(function (done) {
    db.close();
    server.close();
    done();
  });

  test('add an upload', function (done) {
    api(function (hapi) {
      hapi.inject({
        method: 'POST',
        url: '/uploads',
        payload: require('./fixture/NE1_50M_SR.input.json'),
        credentials: { user: { id: -1 } }
      }, function (response) {
        assert.equal(response.statusCode, 200, 'add upload job 200 status');
        uploadId = JSON.parse(response.payload).upload;
        done();
      });
    });
  });

  test('check the status of an upload', function (done) {
    api(function (hapi) {
      hapi.inject({
        method: 'GET',
        url: '/uploads/' + uploadId,
        credentials: { user: { id: -1 } }
      }, function (response) {
        var omitted = [
          '_id',
          'startedAt',
          'createdAt',
          'stoppedAt',
          'uuid',
          'thumbnail',
          'user',
          'tms'
        ];
        var status = JSON.parse(response.payload);
        var expected = require('./fixture/upload-status.json');
        status = omit(status, omitted);
        expected = omit(expected, omitted);
        status.scenes[0].images[0] = omit(status.scenes[0].images[0], omitted);
        expected.scenes[0].images[0] = omit(expected.scenes[0].images[0], omitted);

        assert.deepEqual(status, expected);
        done();
      });
    });
  });
});
