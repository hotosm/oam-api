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

const buildStubs = () => {
  const user = {
    _id: 'id',
    name: 'name',
    contact_email: 'email'
  };
  const findOne = sandbox.stub().resolves(user);
  const token = 'token';
  const createToken = sandbox.stub().resolves(token);
  const stubs = {
    '../models/user': { findOne },
    '../models/createToken': createToken
  };
  return { stubs, findOne, createToken, user, token };
};

const getServer = (stubs) => {
  const uploads = proxyquire('../../routes/auth.js', stubs);
  const server = new Hapi.Server();
  server.connection({ port: 4000 });
  return server.register(authentication).then(() => {
    server.route(uploads);
    return server;
  });
};

describe('auth getToken', () => {
  afterEach(() => {
    sandbox.restore();
  });

  it('Should create and return a new JWT token', () => {
    const { stubs, findOne, createToken, user, token } = buildStubs();
    const credentials = {
      session_id: 'id'
    };
    const options = {
      method: 'GET',
      url: '/getToken',
      credentials
    };
    return getServer(stubs)
      .then((server) => {
        return server.inject(options).then((res) => {
          expect(findOne).to.have.been.calledWith(credentials);
          expect(createToken.firstCall.args[0]).to.equal(user._id);
          expect(createToken.firstCall.args[1]).to.equal(user.name);
          expect(createToken.firstCall.args[2]).to.equal(user.contact_email);
          expect(createToken.firstCall.args[3]).to.equal('user');
          expect(createToken.firstCall.args[4]).to.equal('365d');
          expect(res.result.token).to.equal(token);
        });
      });
  });
});
