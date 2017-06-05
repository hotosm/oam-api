'use strict';

var Server = require('../../services/server');
var Conn = require('../../services/db.js');
var Lab = require('lab');
var chai = require('chai');
var omit = require('omit-deep');

var lab = exports.lab = Lab.script();
var suite = lab.experiment;
var test = lab.test;
var before = lab.before;
var after = lab.after;
var assert = chai.assert;

suite('test worker', function () {
  var server;
  var dbWrapper;
  var uploadId;

  before(function (done) {
    var serverWrapper = new Server(4000);
    serverWrapper.start();
    server = serverWrapper.hapi;
    dbWrapper = new Conn();
    dbWrapper.start();
    var db = dbWrapper.db;
    db.dropDatabase(done);
  });

  after(function (done) {
    dbWrapper.close();
    done();
  });

  test('add an upload', function (done) {
    server.inject({
      method: 'POST',
      url: '/uploads',
      payload: require('./fixture/NE1_50M_SR.input.json'),
      credentials: { user: { id: -1 } }
    }, function (response) {
      assert.equal(response.statusCode, 200, 'add upload job 200 status');
      uploadId = JSON.parse(response.payload).results.upload;
      done();
    });
  });

  test('check the status of an upload', function (done) {
    server.inject({
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
      var status = JSON.parse(response.payload).results;
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
