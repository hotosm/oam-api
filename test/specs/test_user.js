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
});
