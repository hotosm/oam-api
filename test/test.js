/* global before, after, describe, it */
'use strict';

var expect = require('chai').expect;
// var should = require('chai').should();
var request = require('request');
var Conn = require('../services/db.js');
var Server = require('../services/server.js');

var testDb = 'osm-catalog-test';

describe('check meta endpoint', function () {
  this.timeout(15000);

  var self = this;

  before(function (done) {
    self.db = new Conn(testDb);
    self.db.start(function () {
      var server = new Server(2000);
      server.start(done);
    });
  });

  it('test add endpoint', function (done) {
    var testUrl = 'http://www.example.com';
    var url = 'http://127.0.0.1:2000/meta/add';
    request.post({url: url, form: {uuid: testUrl}}, function (err, httpResponse, body) {
      if (err) {
        console.log(err);
      }
      expect(httpResponse.statusCode).to.equal(200);
      var metaId = JSON.parse(body)._id;
      request('http://127.0.0.1:2000/meta/' + metaId, function (err, response, body) {
        if (err) {
          console.log(err);
        }
        var res = JSON.parse(body);
        expect(res.results.uuid).to.equal(testUrl);
        done();
      });
    });
  });

  after(function (done) {
    self.db.deleteDb(done);
  });
});
