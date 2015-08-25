
var Lab = require('lab');
var MongoClient = require('mongodb').MongoClient;
var dbUri = require('../config').dbUri;
var createValidateToken = require('../services/validate-token');
var chai = require('chai');

var lab = exports.lab = Lab.script();
var suite = lab.experiment;
var test = lab.test;
var before = lab.before;
var assert = chai.assert;

var validateToken = null;

var now = new Date();
var nextyear = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
var tokens = [
  {
    name: 'Active Never Expires',
    expiration: false,
    status: 'active',
    token: '067e6c88d03021957a13b6406ca753b805a03331c914f36a33539de38622a90f87f10851e0e70eeb76f4e652ab282f0502ce3f420522d7c7d68f0fada19adb14',
    created: now,
    updated: null
  },
  {
    name: 'Active Not Expired',
    expiration: nextyear,
    status: 'active',
    token: '112fec071ca3414f8e1a7538eab67bfaf3d6fc3376147434b6f0ac9923c4a145b35d33e0970adf0a71110473dec4299cd2c6abcdf7d06dab6f344e5d14951a0d',
    created: now,
    updated: null
  },
  {
    name: 'Active Expired',
    expiration: now,
    status: 'active',
    token: 'a3b1e1d9971a427c67d0f4e277d808c334e3981e43e31643e0021e5af28121eafe46443529829c8fe9a5ce6836f1e19adc429b009923464384361a52b0da15d0',
    created: now,
    updated: null
  },
  {
    name: 'Blocked Never Expired',
    expiration: false,
    status: 'blocked',
    token: '195364531c28d71fe85f194410b1aa1f4d96f31c001c383eaf8cd703245fd01001d600ce6314214bffb07b43a195a2183c5301c2ce7ae4cb259ac42e647e40dd',
    created: now,
    updated: null
  },
  {
    name: 'Blocked Not Expired',
    expiration: nextyear,
    status: 'blocked',
    token: '21a06762eab1678ab8049709d6a3865547bade218cd8d28bdd9efc08f851403681d71012be5f20ad86c7418764efa64b00c7d267d0eadb9eccc07694ab3e2064',
    created: now,
    updated: null
  },
  {
    name: 'Blocked Expired',
    expiration: now,
    status: 'blocked',
    token: '1e57246b246f7f79ff109ec9672769c4f105428048b012419ea8fb3967441543fe981670ca6b0cf9eadf4fbeeb2e3c8f0ad5e00a1645c2bab63bdef4348658c4',
    created: now,
    updated: null
  }
];

suite('test token validation', function () {

  before(function (done) {
    assert.match(dbUri, /test$/, 'use the test database');
    MongoClient.connect(dbUri, function (err, db) {
      if (err) { return done(err); }
      validateToken = createValidateToken(db);
      db.collection('tokens').deleteMany({}, function (err) {
        if (err) { return done(err); }
        db.collection('tokens').insert(tokens, function (err, res) {
          done(err);
        });
      });
    });
  });

  test('should validate active token', function (done) {
    validateToken(tokens[0].token, function (error, valid, creds) {
      assert(valid);
      done(error);
    });
  });

  test('should validate active, unexpired token', function (done) {
    validateToken(tokens[1].token, function (error, valid, creds) {
      assert(valid);
      done(error);
    });
  });

  test('should not validate active, expired token', function (done) {
    validateToken(tokens[2].token, function (error, valid, creds) {
      assert.notOk(valid);
      done(error);
    });
  });

  test('should not validate blocked token', function (done) {
    validateToken(tokens[3].token, function (error, valid, creds) {
      assert.notOk(valid);
      done(error);
    });
  });

  test('should not validate blocked, unexpired token', function (done) {
    validateToken(tokens[4].token, function (error, valid, creds) {
      assert.notOk(valid);
      done(error);
    });
  });

  test('should not validate blocked, expired token', function (done) {
    validateToken(tokens[5].token, function (error, valid, creds) {
      assert.notOk(valid);
      done(error);
    });
  });

  test('should not validate missing token', function (done) {
    validateToken('no token!', function (error, valid, creds) {
      assert.notOk(valid);
      done(error);
    });
  });

});

