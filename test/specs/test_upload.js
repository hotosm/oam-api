'use strict';

var connection = require('mongoose').connection;
var expect = require('chai').expect;
var request = require('request');

require('./helper');
var commonHelper = require('../helper');

var config = require('../../config');
var Meta = require('../../models/meta');

describe('Uploading imagery', function () {
  var loggedInUser;

  beforeEach(function (done) {
    connection.db.dropDatabase(function () {
      commonHelper.logIn(function (user) {
        loggedInUser = user;
        done();
      });
    });
  });

  it('should upload an image and associate it to the user', function (done) {
    var postOptions = {
      url: config.apiEndpoint + '/uploads',
      json: require('../fixtures/NE1_50M_SR.input.json'),
      jar: commonHelper.cookieJar
    };

    request.post(postOptions, function (_err, httpResponse, body) {
      expect(httpResponse.statusCode).to.eq(200);
      var uploadId = body.results.upload;
      commonHelper.waitForConversion(uploadId, function () {
        Meta.find({}, function (_err, result) {
          var meta = result[0];
          expect(result.length).to.eq(1);
          expect(meta.user.toString()).to.eq(loggedInUser._id.toString());
          done();
        });
      });
    });
  });
});
