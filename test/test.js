/* global before, describe, it */
'use strict';

var mongoose = require('mongoose');
var expect = require('chai').expect;
var should = require('chai').should();
var request = require('request');
var Conn = require('../services/db.js');
var Server = require('../services/server.js');

var testDb = 'osm-catalog-test';

describe('check meta endpoint', function() {
  this.timeout(15000);

  var self = this;

  before(function(done) {
    self.db = new Conn(testDb);
    self.db.start(function() {
      var server = new Server(2000);
      server.start(done);
    });

  });

  it('test add endpoint', function(done) {

    var url = 'http://127.0.0.1:2000/meta/add';
    request.post({url: url, form: {uuid: 'http://www.example.com'}}, function(err, httpResponse, body) {
      console.log(err);
      console.log(body);
      request('http://127.0.0.1:2000/meta', function (err, response, body) {
        console.log(err);
        console.log(body);
        done();
      });
    });

  });

  after(function(done) {
    self.db.deleteDb(done);
  });
});

