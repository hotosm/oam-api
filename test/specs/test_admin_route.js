const Hapi = require('hapi');
const proxyquire = require('proxyquire').noCallThru();
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const authentication = require('../../plugins/authentication.js');

const expect = chai.expect;
chai.should();
chai.use(sinonChai);
const sandbox = sinon.sandbox.create();

const getServer = (stubs) => {
  const admin = proxyquire('../../routes/admin.js', stubs);
  const server = new Hapi.Server();
  server.connection({ port: 4000 });
  return server.register(authentication).then(() => {
    server.route(admin);
    return server;
  });
};

describe('Admin route', () => {
  afterEach(() => {
    sandbox.restore();
  });

  it('Returns a token when passed a valid email and password', () => {
    const token = 'token';
    const email = 'email@gmail.com';
    const password = 'password';
    const verifyCredentials = sandbox.stub().resolves(true);
    const createToken = sandbox.stub().resolves(token);
    const stubs = {
      '../models/verifyCredentials': verifyCredentials,
      '../models/createToken': createToken
    };
    const options = {
      method: 'POST',
      url: 'http://oam.com/createToken',
      payload: { email, password }
    };
    return getServer(stubs)
      .then((server) => {
        return server.inject(options).then((res) => {
          expect(res.result).to.deep.equal({ token: token });
          expect(res.statusCode).to.equal(201);
        });
      });
  });

  it('Returns an error when the user does not exist', () => {
    const token = 'token';
    const email = 'email@gmail.com';
    const password = 'password';
    const errorMessage = 'errorMessage';
    const verifyCredentials = sandbox.stub().rejects(new Error(errorMessage));
    const createToken = sandbox.stub().resolves(token);
    const stubs = {
      '../models/verifyCredentials': verifyCredentials,
      '../models/createToken': createToken
    };
    const options = {
      method: 'POST',
      url: 'http://oam.com/createToken',
      payload: { email, password }
    };
    return getServer(stubs)
      .then((server) => {
        return server.inject(options).then((res) => {
          expect(res.statusCode).to.deep.equal(500);
        });
      });
  });
});
