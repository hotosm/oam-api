'use strict';

var ObjectID = require('mongodb').ObjectID;
var connection = require('mongoose').connection;
var expect = require('chai').expect;
var request = require('request');
var sinon = require('sinon');

require('./helper');
var commonHelper = require('../helper');

var config = require('../../config');
var Meta = require('../../models/meta');
var transcoder = require('../../services/transcoder');

describe('Uploading imagery', function () {
  var loggedInUser;

  before(function () {
    sinon.stub(transcoder, 'queueImage', function (sourceUrl, targetPrefix, metaUrl) {
      var imageId = targetPrefix.split('/').pop();
      var meta = require('../fixtures/NE1_50M_SR.output.json');

      meta.user = loggedInUser;

      return Promise.all([
        connection.db.collection('images').updateOne({
          _id: new ObjectID(imageId)
        }, {
          $set: {
            status: 'finished',
            metadata: meta
          },
          $currentDate: {
            stoppedAt: true
          }
        }),
        Meta.findOneAndUpdate({uuid: meta.uuid}, meta, {upsert: true})
      ]);
    });
  });

  after(function () {
    transcoder.queueImage.restore();
  });

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
