'use strict';

var config = require('../../config');

var expect = require('chai').expect;
var request = require('request');
var wktParse = require('wellknown');
var Meta = require('../../models/meta');
var meta = require('../fixtures/sample_meta.json');

require('./helper');

describe('Meta endpoint', function () {
  before(function (done) {
    Meta.create(meta).then(function (results) {
      results.forEach(function (result) {
        // TODO: Put in a Mongoose middleware hook
        result.geojson = wktParse(result.footprint);
        result.geojson.bbox = result.bbox;
        result.save();
      });
      done();
    });
  });

  it('list meta', function (done) {
    request(config.apiEndpoint + '/meta/', function (err, response, body) {
      if (err) {
        console.log(err);
      }
      var res = JSON.parse(body);
      expect(res.results.length).to.equal(2);
      done();
    });
  });

  it('search meta', function (done) {
    request(config.apiEndpoint + '/meta/?title=some_image2.tif', function (err, response, body) {
      if (err) {
        console.log(err);
      }
      var res = JSON.parse(body);
      expect(res.results.length).to.equal(1);
      expect(res.results[0].uuid).to.equal(meta[1].uuid);
      expect(res.results[0].platform).to.equal('drone');
    });

    request(config.apiEndpoint + '/meta/?platform=drone', function (err, response, body) {
      if (err) {
        console.log(err);
      }
      var res = JSON.parse(body);
      expect(res.results.length).to.equal(2);
      done();
    });
  });

  it('search by bounding box', function (done) {
    request(config.apiEndpoint + '/meta/?bbox=8.26171875,57.87981645527841,42.03369140625,62.32920841458002', function (err, response, body) {
      if (err) {
        console.log(err);
      }
      var res = JSON.parse(body);
      expect(res.results.length).to.equal(1);
      expect(res.results[0].uuid).to.equal(meta[0].uuid);
      done();
    });
  });

  it('search by resolution', function (done) {
    request(config.apiEndpoint + '/meta/?gsd_from=1&gsd_to=4', function (err, response, body) {
      if (err) {
        console.log(err);
      }
      var res = JSON.parse(body);
      expect(res.results.length).to.equal(1);
      expect(res.results[0].uuid).to.equal(meta[1].uuid);
    });

    request(config.apiEndpoint + '/meta/?gsd_from=20&gsd_to=100', function (err, response, body) {
      if (err) {
        console.log(err);
      }
      var res = JSON.parse(body);
      expect(res.results.length).to.equal(0);
      done();
    });
  });

  it('search if tms is provided', function (done) {
    request(config.apiEndpoint + '/meta/?has_tiled', function (err, response, body) {
      if (err) {
        console.log(err);
      }
      var res = JSON.parse(body);
      expect(res.results.length).to.equal(1);
      expect(res.results[0].uuid).to.equal(meta[1].uuid);
      done();
    });
  });

  it('search date', function (done) {
    request(
      config.apiEndpoint + '/meta/?acquisition_from=2015-04-10&acquisition_to=2015-05-01',
      function (err, response, body) {
        if (err) {
          console.log(err);
        }
        var res = JSON.parse(body);
        expect(res.results.length).to.equal(1);
        expect(res.results[0].uuid).to.equal(meta[0].uuid);
      }
    );

    request(
      config.apiEndpoint + '/meta/?acquisition_from=2015-01-01&acquisition_to=2015-05-01',
      function (err, response, body) {
        if (err) {
          console.log(err);
        }
        var res = JSON.parse(body);
        expect(res.results.length).to.equal(2);
        expect(res.results[0].uuid).to.equal(meta[0].uuid);
        done();
      }
    );
  });

  it('order', function (done) {
    request(
      config.apiEndpoint + '/meta/?order_by=acquisition_start&sort=asc',
      function (err, response, body) {
        if (err) {
          console.log(err);
        }
        var res = JSON.parse(body);
        expect(res.results.length).to.equal(2);
        expect(res.results[0].uuid).to.equal(meta[1].uuid);
      }
    );

    request(
      config.apiEndpoint + '/meta/?order_by=acquisition_start&sort=desc',
      function (err, response, body) {
        if (err) {
          console.log(err);
        }
        var res = JSON.parse(body);
        expect(res.results.length).to.equal(2);
        expect(res.results[0].uuid).to.equal(meta[0].uuid);
        done();
      }
    );
  });

  it('limit and page order', function (done) {
    request(
      config.apiEndpoint + '/meta/?limit=1&page=1',
      function (err, response, body) {
        if (err) {
          console.log(err);
        }
        var res = JSON.parse(body);
        expect(res.results.length).to.equal(1);
        expect(res.results[0].uuid).to.equal(meta[0].uuid);
      }
    );

    request(
      config.apiEndpoint + '/meta/?limit=1&page=2',
      function (err, response, body) {
        if (err) {
          console.log(err);
        }
        var res = JSON.parse(body);
        expect(res.results.length).to.equal(1);
        expect(res.results[0].uuid).to.equal(meta[1].uuid);
        done();
      }
    );
  });
});
