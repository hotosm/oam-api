'use strict';

var Lab = require('lab');
var server = require('../');
var config = require('../config');
var createValidateToken = require('../services/validate-token');
var chai = require('chai');
var ObjectId = require('mongodb').ObjectID;

var lab = exports.lab = Lab.script();
var suite = lab.experiment;
var test = lab.test;
var before = lab.before;
var assert = chai.assert;

var cookie = null;
var activeToken = null;
var validateToken = null;

suite('test tokens', function () {
  before(function (done) {
    assert.match(config.dbUri, /test$/, 'use the test database');
    // Get a reference to the server.
    // Wait for everything to load.
    // Change to test db
    server(function (hapi) {
      server = hapi;
      // Prepare db.
      var db = hapi.plugins.db.connection;
      validateToken = createValidateToken(db);
      db.collection('tokens').deleteMany({}, function (err) {
        if (err) { throw err; }

        // Insert some data.
        db.collection('tokens').insert([
          {
            _id: new ObjectId('55c88dddd2f727d042b097b4'),
            name: 'Primary token',
            expiration: false,
            status: 'active',
            token: '87f10851e0e70eeb76f4e652ab282f0502ce3f420522d7c7d68f0fada19adb14',
            created: new Date('2015-08-10T13:38:48.684Z'),
            updated: null
          },
          {
            _id: new ObjectId('55c88eeee2f727d042b097b5'),
            name: 'Secondary token',
            expiration: new Date('2020-08-10T13:38:48.684Z'),
            status: 'active',
            token: 'b35d33e0970adf0a71110473dec4299cd2c6abcdf7d06dab6f344e5d14951a0d',
            created: new Date('2015-08-10T13:38:48.684Z'),
            updated: null
          }
        ], function (err, res) {
          if (err) throw err;
          // Cookie
          var options = {
            method: 'POST',
            url: '/login',
            payload: {
              username: 'admin',
              password: 'admin'
            }
          };

          server.inject(options, function (response) {
            // Store the cookie to use on next requests
            cookie = response.headers['set-cookie'][0].split(' ')[0];
            done();
          });
        });
      });
    });
  });

  test('should list tokens', function (done) {
    var options = {
      method: 'GET',
      url: '/tokens',
      headers: {
        Cookie: cookie
      }
    };

    server.inject(options, function (response) {
      var result = response.result;
      assert.equal(response.statusCode, 200);

      assert.lengthOf(result.data, 2);
      assert.equal(result.data[0].name, 'Primary token');
      assert.equal(result.data[1].name, 'Secondary token');
      done();
    });
  });

  test('should fail token creation when missing payload', function (done) {
    var options = {
      method: 'POST',
      url: '/tokens/',
      headers: {
        Cookie: cookie
      }
    };

    server.inject(options, function (response) {
      assert.equal(response.statusCode, 400);
      done();
    });
  });

  test('should fail token creation when missing name', function (done) {
    var options = {
      method: 'POST',
      url: '/tokens/',
      headers: {
        Cookie: cookie
      },
      payload: {
        expiration: false,
        status: 'active'
      }
    };

    server.inject(options, function (response) {
      var result = response.result;
      assert.equal(response.statusCode, 400);
      assert.include(result.message, '"name" fails');
      done();
    });
  });

  test('should fail token creation when missing expiration', function (done) {
    var options = {
      method: 'POST',
      url: '/tokens/',
      headers: {
        Cookie: cookie
      },
      payload: {
        name: 'Test token',
        status: 'active'
      }
    };

    server.inject(options, function (response) {
      var result = response.result;
      assert.equal(response.statusCode, 400);
      assert.include(result.message, '"expiration" fails');
      done();
    });
  });

  test('should fail token creation when missing status', function (done) {
    var options = {
      method: 'POST',
      url: '/tokens/',
      headers: {
        Cookie: cookie
      },
      payload: {
        name: 'Test token',
        expiration: false
      }
    };

    server.inject(options, function (response) {
      var result = response.result;
      assert.equal(response.statusCode, 400);
      assert.include(result.message, '"status" fails');
      done();
    });
  });

  test('should fail token creation with invalid boolean expiration', function (done) {
    var options = {
      method: 'POST',
      url: '/tokens/',
      headers: {
        Cookie: cookie
      },
      payload: {
        name: 'Test token',
        expiration: true,
        status: 'active'
      }
    };

    server.inject(options, function (response) {
      var result = response.result;
      assert.equal(response.statusCode, 400);
      assert.include(result.message, '"expiration" fails');
      done();
    });
  });

  test('should fail token creation with invalid expiration', function (done) {
    var options = {
      method: 'POST',
      url: '/tokens/',
      headers: {
        Cookie: cookie
      },
      payload: {
        name: 'Test token',
        expiration: '2015-20-20 25:62:00',
        status: 'active'
      }
    };

    server.inject(options, function (response) {
      var result = response.result;
      assert.equal(response.statusCode, 400);
      assert.include(result.message, '"expiration" fails');
      done();
    });
  });

  test('should fail token creation with invalid status', function (done) {
    var options = {
      method: 'POST',
      url: '/tokens/',
      headers: {
        Cookie: cookie
      },
      payload: {
        name: 'Test token',
        expiration: false,
        status: 'none'
      }
    };

    server.inject(options, function (response) {
      var result = response.result;
      assert.equal(response.statusCode, 400);
      assert.include(result.message, '"status" fails');
      done();
    });
  });

  test('should create token', function (done) {
    var options = {
      method: 'POST',
      url: '/tokens/',
      headers: {
        Cookie: cookie
      },
      payload: {
        name: 'Test token',
        expiration: false,
        status: 'active'
      }
    };

    server.inject(options, function (response) {
      var result = response.result;
      assert.equal(response.statusCode, 201);

      assert.isDefined(result.data._id);
      activeToken = result.data.token;
      done();
    });
  });

  test('should validate active token', function (done) {
    validateToken(activeToken, function (error, valid, creds) {
      assert(valid);
      done(error);
    });
  });

  test('should fail token update with invalid boolean expiration', function (done) {
    var options = {
      method: 'PUT',
      url: '/tokens/55c88eeee2f727d042b097b5',
      headers: {
        Cookie: cookie
      },
      payload: {
        expiration: true
      }
    };

    server.inject(options, function (response) {
      var result = response.result;
      assert.equal(response.statusCode, 400);
      assert.include(result.message, '"expiration" fails');
      done();
    });
  });

  test('should fail token update with invalid date expiration', function (done) {
    var options = {
      method: 'PUT',
      url: '/tokens/55c88eeee2f727d042b097b5',
      headers: {
        Cookie: cookie
      },
      payload: {
        expiration: '2015-20-20 25:62:00'
      }
    };

    server.inject(options, function (response) {
      var result = response.result;
      assert.equal(response.statusCode, 400);
      assert.include(result.message, '"expiration" fails');
      done();
    });
  });

  test('should update token name', function (done) {
    var options = {
      method: 'PUT',
      url: '/tokens/55c88eeee2f727d042b097b5',
      headers: {
        Cookie: cookie
      },
      payload: {
        name: 'Secondary token modified'
      }
    };

    server.inject(options, function (response) {
      var result = response.result;
      assert.equal(response.statusCode, 200);

      assert.equal(result.data.name, 'Secondary token modified');
      assert.equal(result.data.status, 'active');
      assert.equal(new Date(result.data.expiration).toISOString(), '2020-08-10T13:38:48.684Z');
      done();
    });
  });

  test('should remove token expiration date', function (done) {
    var options = {
      method: 'PUT',
      url: '/tokens/55c88eeee2f727d042b097b5',
      headers: {
        Cookie: cookie
      },
      payload: {
        expiration: false
      }
    };

    server.inject(options, function (response) {
      var result = response.result;
      assert.equal(response.statusCode, 200);

      assert.equal(result.data.name, 'Secondary token modified');
      assert.equal(result.data.status, 'active');
      assert.equal(result.data.expiration, false);
      done();
    });
  });

  test('should update token status', function (done) {
    var options = {
      method: 'PUT',
      url: '/tokens/55c88eeee2f727d042b097b5',
      headers: {
        Cookie: cookie
      },
      payload: {
        status: 'blocked'
      }
    };

    server.inject(options, function (response) {
      var result = response.result;
      assert.equal(response.statusCode, 200);

      assert.equal(result.data.name, 'Secondary token modified');
      assert.equal(result.data.status, 'blocked');
      assert.equal(result.data.expiration, false);
      done();
    });
  });

  test('should update all token values', function (done) {
    var options = {
      method: 'PUT',
      url: '/tokens/55c88eeee2f727d042b097b5',
      headers: {
        Cookie: cookie
      },
      payload: {
        name: 'Secondary token',
        status: 'active',
        expiration: '2020-08-10T13:38:48.684Z'
      }
    };

    server.inject(options, function (response) {
      var result = response.result;
      assert.equal(response.statusCode, 200);

      assert.equal(result.data.name, 'Secondary token');
      assert.equal(result.data.status, 'active');
      assert.equal(new Date(result.data.expiration).toISOString(), '2020-08-10T13:38:48.684Z');
      done();
    });
  });

  test('should delete token', function (done) {
    var options = {
      method: 'DELETE',
      url: '/tokens/55c88eeee2f727d042b097b5',
      headers: {
        Cookie: cookie
      }
    };

    server.inject(options, function (response) {
      assert.equal(response.statusCode, 200);

      // List tokens to confirm it was removed.
      var options = {
        method: 'GET',
        url: '/tokens',
        headers: {
          Cookie: cookie
        }
      };
      server.inject(options, function (response) {
        var result = response.result;
        assert.equal(response.statusCode, 200);
        assert.lengthOf(result.data, 2);
        done();
      });
    });
  });
});
