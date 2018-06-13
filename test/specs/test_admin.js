'use strict';
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const chai = require('chai');
const Admin = require('../../models/admin');
const expect = chai.expect;
chai.use(sinonChai);
const sandbox = sinon.sandbox.create();

const tempAdmin = {
  name: 'test',
  password: 'test',
  token : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1Mjc1OTExMDYsImRhdGEiOnsibmFtZSI6ImFua2l0YSIsInBhc3N3b3JkIjoiYW5raXRhIn0sImlhdCI6MTUyNzU4NzUwNn0.uhIta1PCdGoGCurHm4IczIru1W8l6TPCPkBi9d993Es'
};

const config = require('../../config');
const Hapi = require('hapi');
const authentication = require('../../plugins/authentication.js');
const routes = require('../../routes/admin.js');

const getServer = () => {
  const server = new Hapi.Server();
  server.connection({ port: 4000 });
  return server.register(authentication).then(() => {
    server.route(routes);
    return server;
  });
};

describe('Admin', () => {
  afterEach(() => {
    sandbox.restore();
  });
  it('should be invalid if name is empty', () => {
    const admin = new Admin({password: tempAdmin.password});
    admin.validate().then((error) => {
      expect(error.errors.name).to.exist;
    });
  });
  it('should be invalid if password is empty', () => {
    const admin = new Admin({name: tempAdmin.name});
    admin.validate().then((error) => {
      expect(error.errors.password).to.exist;
    });
  });
  it('isValidAdmin should return Admin with valid JWT token', () => {
    const admin = {name: tempAdmin.name, password: tempAdmin.name};
    sandbox.stub(Admin, 'findOne').returns(Promise.resolve(admin));
    Admin.isValidAdmin(tempAdmin.name, tempAdmin.password, (result) => {
      expect(result).to.exist;
    });
  });
  it('POST /admin should return Admin with correct credentials', () => {
    const admin = {name: tempAdmin.name, password: tempAdmin.password, token: tempAdmin.token};
    sandbox.stub(Admin, 'findOne').returns(Promise.resolve(admin));
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
        expect(response.statusCode).to.equal(200);
      });
      server.stop();
    });
  });
});

