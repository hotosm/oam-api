'use strict';

require('../helper');

var expect = require('chai').expect;
var request = require('request');
var async = require('async');
var meta = require('./sample_meta.json');

describe('TMS endpoint', function () {
  this.timeout(15000);

  var tms1 = {
    uri: 'http://www.example.com/some_tms1.tms',
    images: [
      {uuid: 'http://www.example.com/some_image1.tif'}
    ]
  };

  var tms2 = {
    uri: 'http://www.example.com/some_tms2.tms',
    images: [
      {uuid: 'http://www.example.com/some_image2.tif'}
    ]
  };

  var tms3 = {
    uri: 'http://www.example.com/some_tms3.tms',
    images: [
      {uuid: 'http://www.example.com/some_image1.tif'},
      {uuid: 'http://www.example.com/some_image2.tif'}
    ]
  };

  var tms4 = {
    uri: [
      'http://www.example.com/some_tms4.tms',
      'http://www.example.com/some_tms5.tms'
    ],
    images: [
      {uuid: 'http://www.example.com/some_image2.tif'}
    ]
  };

  it('add meta', function (done) {
    var options = {
      url: 'http://127.0.0.1:2000/meta',
      headers: {
        'Authorization': 'Bearer insecuretoken'
      },
      form: meta[0]
    };

    request.post(options, function (err, httpResponse) {
      if (err) {
        console.log(err);
      }
      expect(httpResponse.statusCode).to.equal(200);
    });

    options.form = meta[1];
    request.post(options, function (err, httpResponse) {
      if (err) {
        console.log(err);
      }
      expect(httpResponse.statusCode).to.equal(200);
      done();
    });
  });

  it('add tms', function (done) {
    var options = {
      url: 'http://127.0.0.1:2000/tms',
      headers: {
        'Authorization': 'Bearer insecuretoken'
      },
      form: tms1
    };

    async.waterfall([
      function (cb) {
        request.post(options, function (err, httpResponse) {
          if (err) {
            console.log(err);
          }
          expect(httpResponse.statusCode).to.equal(200);
          cb(err);
        });
      },
      function (cb) {
        options.form = tms2;
        request.post(options, function (err, httpResponse) {
          if (err) {
            console.log(err);
          }
          expect(httpResponse.statusCode).to.equal(200);
          cb(err);
        });
      },
      function (cb) {
        options.form = tms3;
        request.post(options, function (err, httpResponse) {
          if (err) {
            console.log(err);
          }
          expect(httpResponse.statusCode).to.equal(200);
          cb(err);
        });
      },
      function (cb) {
        options.form = tms4;
        request.post(options, function (err, httpResponse) {
          if (err) {
            console.log(err);
          }
          expect(httpResponse.statusCode).to.equal(200);
          cb(err);
        });
      }
    ], function (err) {
      expect(err).to.be.null;
      done();
    });
  });

  it('list tms', function (done) {
    request('http://127.0.0.1:2000/tms/', function (err, response, body) {
      if (err) {
        console.log(err);
      }
      var res = JSON.parse(body);
      expect(res.results.length).to.equal(4);
      expect(res.results[0].uri).to.equal(tms1.uri);
      done();
    });
  });

  it('check if tms is added to meta', function (done) {
    request('http://127.0.0.1:2000/meta/?title=some_image1.tif', function (err, response, body) {
      if (err) {
        console.log(err);
      }
      var res = JSON.parse(body);
      expect(res.results.length).to.equal(1);
      expect(res.results[0].custom_tms.length).to.equal(2);
      done();
    });
  });
});
