'use strict';

var expect = require('chai').expect;
var request = require('request');

var connection = require('mongoose').connection;
var config = require('../../config');
var Meta = require('../../models/meta');
var meta = require('../fixtures/meta_db_objects.json');

require('./helper');
var commonHelper = require('../helper');

describe('User', function () {
  let savedUser;
  beforeEach(function (done) {
    connection.db.dropDatabase();
    commonHelper.createUser({
      facebook_id: 123,
      session_id: null
    }, function (user) {
      savedUser = user;
      Meta.create(meta).then(function (results) {
        results.forEach(function (result) {
          result.user = user;
          result.save();
        });
        done();
      });
    });
  });

  it('should return an existing user', function (done) {
    var options = {
      url: config.apiEndpoint + '/user/' + savedUser.id,
      json: true
    };

    request.get(options, function (_err, httpResponse, body) {
      const user = body.results;
      const images = user.images;
      expect(httpResponse.statusCode).to.equal(200);
      expect(user.name).to.eq('Tester');
      expect(images.length).to.eq;
      done();
    });
  });

  it('should update the logged in user', function (done) {
    var options = {
      url: config.apiEndpoint + '/user',
      jar: commonHelper.cookieJar,
      json: {
        name: 'Mr. Updated',
        website: 'http://example.com',
        bio: 'This is a test bio'
      }
    };

    commonHelper.logUserIn(savedUser, function (_httpResponse, _body) {
      request.put(options, function (_err, httpResponse, _body) {
        expect(httpResponse.statusCode).to.equal(204);
        var options = {
          url: config.apiEndpoint + '/user',
          jar: commonHelper.cookieJar,
          json: true
        };

        request.get(options, function (_err, httpResponse, body) {
          const user = body.results;
          expect(user.name).to.eq('Mr. Updated');
          expect(user.website).to.eq('http://example.com');
          expect(user.bio).to.eq('This is a test bio');
          done();
        });
      });
    });
  });
});
