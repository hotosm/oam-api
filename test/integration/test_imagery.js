'use strict';

var expect = require('chai').expect;
var request = require('request');

var helper = require('./helper');
var config = require('../../config');
var S3Sync = require('../../services/s3_sync');

describe('Imagery CRUD', function () {
  // Needs time to process the image
  this.timeout(3 * 60 * 1000);

  let prereqs = {};

  beforeEach(function (done) {
    helper.loginAndUpload(function (title, image, cookie) {
      prereqs.title = title;
      prereqs.image = image;
      prereqs.cookie = cookie;
      done();
    });
  });

  it('should upload, convert and process an image', function () {
    expect(prereqs.image.user.name).to.eq('Tester');

    expect(prereqs.image.title).to.eq(prereqs.title);
    expect(prereqs.image.properties.license).to.eq('CC-BY');
    // expect(prereqs.image.projection).to.include('GEOGCS');
    expect(prereqs.image.gsd).to.eq(3706.49755482);
    expect(prereqs.image.bbox).to.deep.eq([129, 29, 146, 54]);

    // TODO: Fetch these and check they're good too
    expect(prereqs.image.properties.tms).to.include('/{z}/{x}/{y}');
    expect(prereqs.image.meta_uri).to.include('_meta.json');
  });

  it('should update meta in S3', function (done) {
    var s3Sync = new S3Sync(prereqs.image.meta_uri);
    var options = {
      url: config.apiEndpoint + '/meta/' + prereqs.image._id,
      json: {
        title: 'Updated title'
      },
      headers: {
        'Cookie': prereqs.cookie
      }
    };

    request.put(options, function (_err, httpResponse, body) {
      expect(httpResponse.statusCode).to.eq(204);
      s3Sync.s3Params.Key = s3Sync.s3Key;
      s3Sync.downloadRemoteMeta().then(function (metadataString) {
        let metadata = JSON.parse(metadataString);
        expect(metadata.bbox).to.deep.eq([129, 29, 146, 54]);
        expect(metadata.title).to.eq('Updated title');
        done();
      });
    });
  });

  it('should delete meta in S3', function (done) {
    var s3Sync = new S3Sync(prereqs.image.meta_uri);
    var options = {
      url: config.apiEndpoint + '/meta/' + prereqs.image._id,
      headers: {
        'Cookie': prereqs.cookie
      }
    };

    request.delete(options, function (_err, httpResponse, body) {
      expect(httpResponse.statusCode).to.eq(204);
      s3Sync.s3Params.Key = s3Sync.s3Key;
      s3Sync.downloadRemoteMeta().then(function () {
        throw new Error('Imagery was not deleted');
      }).then(
        function () {},
        function (err) {
          expect(err).to.contain('NoSuchKey');
          done();
        }
      );
    });
  });
});
