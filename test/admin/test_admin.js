
'use strict';

require('./helper.js');
const privateKey = 'AnkitaPrivate'; // Setup Private Key in Config : Later
var jwt = require('jsonwebtoken');
var wrongToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1MjgxMjI0NjcsImRhdGEiOnsibmFtZSI6Im9hbSIsInBhc3N3b3JkIjoib2FtIn0sImlhdCI6MTUyODExODg2N30.sEe28lzL3ifr31wO5Ji0DtRq5F-6ZfYD2wlUzDiMLyQ';
var config = require('../../config');
var test = require('tape');
var Hapi = require('hapi');
var authentication = require('../../plugins/authentication.js');
var routes = require('../../routes/admin.js');
var Conn = require('../../services/db');
var Admin = require('../../models/admin.js');

var dbWrapper = new Conn();
dbWrapper.start(function () {});
const getServer = () => {
  const server = new Hapi.Server();
  server.connection({ port: 4000 });
  return server.register(authentication).then(() => {
    server.route(routes);
    return server;
  });
};
var tempAdmin = {name: 'admin', password: 'admin'};
var correctToken = '';
let token = jwt.sign({ exp: Math.floor(Date.now() / 1000) + (60 * 60), data: {name: 'admin', password: 'admin'} }, privateKey, {algorithm: 'HS256'});

// Change This - Not working due to asynchronous call
Admin.create({
  name: 'admin',
  password: 'admin',
  token: token
}).then(temp => {
  correctToken = temp.token;
});

// Tests
test('GET /adminTest should return 200 Status code', function (t) {
  t.plan(1);
  var options = {
    method: 'GET',
    url: config.apiEndpoint + '/adminTest'
  };
  getServer().then(server => {
    server.inject(options, function (response) {
      t.equal(response.statusCode, 200, '200 status code returned - ✅');
    });
    server.stop();
  });
});

test('POST /admin with correct Credentials should return Admin Object', function (t) {
  t.plan(2);
  var request = {
    method: 'POST',
    url: config.apiEndpoint + '/admin',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    payload: 'name=' + tempAdmin.name + '&password=' + tempAdmin.password
  };
  getServer().then(server => {
    server.inject(request, function (response) {
      t.equal(response.statusCode, 200, '200 status code returned - ✅');
      t.equal(typeof (response.result), 'object', 'Object Returned -  ✅');
      correctToken = response.result.token;
    });
    server.stop();
  });
});

test('POST /admin with wrong Credentials should return undefined Response', function (t) {
  t.plan(2);
  var request = {
    method: 'POST',
    url: config.apiEndpoint + '/admin',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    payload: 'name=oam2&password=oam'
  };
  getServer().then(server => {
    server.inject(request, function (response) {
      t.equal(response.statusCode, 200, '200 status code returned - ✅');
      t.equal(typeof (response.result.name), 'undefined', 'undefined Returned -  ✅');
    });
    server.stop();
  });
});

test('GET /admin with wrong Token', function (t) {
  t.plan(2);
  var request = {
    method: 'GET',
    url: config.apiEndpoint + '/admin',
    headers: {
      'Authorization': 'Bearer' + wrongToken
    }
  };
  getServer().then(server => {
    server.inject(request, function (response) {
      t.equal(response.statusCode, 401, '401 status code returned - ✅');
      t.equal(response.result.name, undefined, 'Object not returned - ✅');
    });
    server.stop();
  });
});
test('GET /admin with correct Token', function (t) {
  t.plan(2);
  var request = {
    method: 'GET',
    url: config.apiEndpoint + '/admin',
    headers: {
      'Authorization': 'Bearer' + correctToken
    }
  };
  getServer().then(server => {
    server.inject(request, function (response) {
      t.equal(response.statusCode, 200, '200 status code returned - ✅');
      t.equal(response.result, correctToken, 'Token returned - ✅');
    });
    server.stop();
    dbWrapper.deleteDb();
  });
});
