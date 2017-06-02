/* global before, after, describe, it */
'use strict';

var expect = require('chai').expect;
// var should = require('chai').should();
var request = require('request');
var Conn = require('../services/db.js');
var Server = require('../services/server.js');
var meta = require('./sample_meta.json');
var testDb = 'oam_catalog_test';

describe('Meta endpoint', function () {
  this.timeout(15000);

  var self = this;

  before(function (done) {
    self.db = new Conn();
    self.db.start(function (err) {
      if (err) {
        console.log(err);
      }
      self.server = new Server(2000);
      self.server.start(done);
    });
  });

  it('add with token', function (done) {
    var options = {
      url: 'http://127.0.0.1:2000/meta',
      headers: {
        'Authorization': 'Bearer insecuretoken'
      },
      form: meta[0]
    };

    request.post(options, function (err, httpResponse, body) {
      if (err) {
        console.log(err);
      }
      expect(httpResponse.statusCode).to.equal(200);
      var metaId = JSON.parse(body).results._id;
      request('http://127.0.0.1:2000/meta/' + metaId, function (err, response, body) {
        if (err) {
          console.log(err);
        }
        var res = JSON.parse(body);
        expect(res.results.uuid).to.equal(meta[0].uuid);
      });
    });

    options.form = meta[1];
    request.post(options, function (err, httpResponse, body) {
      if (err) {
        console.log(err);
      }
      expect(httpResponse.statusCode).to.equal(200);
      var metaId = JSON.parse(body).results._id;
      request('http://127.0.0.1:2000/meta/' + metaId, function (err, response, body) {
        if (err) {
          console.log(err);
        }
        var res = JSON.parse(body);
        expect(res.results.uuid).to.equal(meta[1].uuid);
        done();
      });
    });
  });

  it('add without token', function (done) {
    var options = {
      url: 'http://127.0.0.1:2000/meta',
      form: meta[0]
    };

    request.post(options, function (err, httpResponse) {
      if (err) {
        console.log(err);
      }
      // should fail
      expect(httpResponse.statusCode).to.equal(401);
      done();
    });
  });

  it('list meta', function (done) {
    request('http://127.0.0.1:2000/meta/', function (err, response, body) {
      if (err) {
        console.log(err);
      }
      var res = JSON.parse(body);
      expect(res.results.length).to.equal(2);
      done();
    });
  });

  it('search meta', function (done) {
    request('http://127.0.0.1:2000/meta/?title=some_image2.tif', function (err, response, body) {
      if (err) {
        console.log(err);
      }
      var res = JSON.parse(body);
      expect(res.results.length).to.equal(1);
      expect(res.results[0].uuid).to.equal(meta[1].uuid);
      expect(res.results[0].platform).to.equal('drone');
    });

    request('http://127.0.0.1:2000/meta/?platform=drone', function (err, response, body) {
      if (err) {
        console.log(err);
      }
      var res = JSON.parse(body);
      expect(res.results.length).to.equal(2);
      done();
    });
  });

  it('search by bounding box', function (done) {
    request('http://127.0.0.1:2000/meta/?bbox=8.26171875,57.87981645527841,42.03369140625,62.32920841458002', function (err, response, body) {
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
    request('http://127.0.0.1:2000/meta/?gsd_from=1&gsd_to=4', function (err, response, body) {
      if (err) {
        console.log(err);
      }
      var res = JSON.parse(body);
      expect(res.results.length).to.equal(1);
      expect(res.results[0].uuid).to.equal(meta[1].uuid);
    });

    request('http://127.0.0.1:2000/meta/?gsd_from=20&gsd_to=100', function (err, response, body) {
      if (err) {
        console.log(err);
      }
      var res = JSON.parse(body);
      expect(res.results.length).to.equal(0);
      done();
    });
  });

  it('search if tms is provided', function (done) {
    request('http://127.0.0.1:2000/meta/?has_tiled', function (err, response, body) {
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
      'http://127.0.0.1:2000/meta/?acquisition_from=2015-04-10&acquisition_to=2015-05-01',
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
      'http://127.0.0.1:2000/meta/?acquisition_from=2015-01-01&acquisition_to=2015-05-01',
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
      'http://127.0.0.1:2000/meta/?order_by=acquisition_start&sort=asc',
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
      'http://127.0.0.1:2000/meta/?order_by=acquisition_start&sort=desc',
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
      'http://127.0.0.1:2000/meta/?limit=1&page=1',
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
      'http://127.0.0.1:2000/meta/?limit=1&page=2',
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

  after(function (done) {
    self.db.deleteDb(function () {
      self.server.hapi.stop(null, done);
    });
  });
});
