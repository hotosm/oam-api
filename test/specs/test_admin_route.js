const Hapi = require('hapi');
const proxyquire = require('proxyquire');
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const expect = chai.expect;
chai.should();
chai.use(sinonChai);
const sandbox = sinon.sandbox.create();

const getServer = (stubs) => {
  const admin = proxyquire('../../routes/admin.js', stubs);
  const jwtSecret = 'Kpkxw/NNe1zAxYKj3yQin7CzbYcgJzSp1tCargp7a5dPyiHI0BUbsxUzvCs3iyThcxDOcBewVfPhshiWKfX/Ga1C0noI7UG+0iT4Wnk/RJBxQR/E3PbFuT8PzDn4XENXlJlzq3JzfaPX79KN/BRp5FQDmvNfSw5buUXF2HmrALxo3p/sfatzl73kPdrOe3MAmMdnrnVMOO39LOspqCki/M0K0rCTK+hTj351YrrbFiEH/ieLQ6pXlkWYY2/4E+4haslDqf1rB7EaJG86g0Y/ngSRby+5pZF6YYblgKNL7UYCip3fWMBlIQKmENie7MEwYmJIs5pXl3MZ2OT8pVMgSw ==';
  const configStub = {
    '../config': {
      jwtSecret: jwtSecret
    }
  };
  const authentication = proxyquire('../../plugins/authentication', configStub);

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

  it('createToken returns a token when passed a valid email and password', () => {
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
          expect(verifyCredentials.firstCall.args[0]).to.equal(email);
          expect(verifyCredentials.firstCall.args[1]).to.equal(password);
          expect(createToken.firstCall.args[0]).to.equal(email);
          expect(createToken.firstCall.args[1]).to.equal('admin');
          expect(res.result).to.deep.equal({ token: token });
          expect(res.statusCode).to.equal(201);
        });
      });
  });

  it('createToken returns an error when the user does not exist', () => {
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
      url: '/createToken',
      payload: { email, password }
    };
    return getServer(stubs)
      .then((server) => {
        return server.inject(options).then((res) => {
          expect(res.statusCode).to.deep.equal(400);
        });
      });
  });

  it('admin returns a reply when request is authorized', () => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im1lQGdtYWlsLmNvbSIsInNjb3BlIjoiYWRtaW4iLCJpYXQiOjE1Mjk3NzM1NzEsImV4cCI6MTY4NzU2MTU3MX0.ZywZaau_67h1ZuhAnEeTMPUOQrM45JUyuoPOa9S_dkg';
    const options = {
      method: 'GET',
      url: '/admin',
      headers: {
        'Authorization': token
      }
    };
    return getServer({})
      .then((server) => {
        return server.inject(options).then((res) => {
          expect(res.statusCode).to.deep.equal(200);
        });
      });
  });

  it('Users returned when request is authorized', () => {
    const users = [{'name': 'tempUser1'}, {'name': 'tempUser2'}];
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im1lQGdtYWlsLmNvbSIsInNjb3BlIjoiYWRtaW4iLCJpYXQiOjE1Mjk3NzM1NzEsImV4cCI6MTY4NzU2MTU3MX0.ZywZaau_67h1ZuhAnEeTMPUOQrM45JUyuoPOa9S_dkg';
    const returnUsers = sandbox.stub().resolves(users);
    const stubs = {
      '../admin_functions/returnUsers': returnUsers
    };
    const options = {
      method: 'GET',
      url: '/admin',
      headers: {
        'Authorization': token
      }
    };
    return getServer(stubs)
      .then((server) => {
        return server.inject(options).then((res) => {
          expect(res.statusCode).to.deep.equal(200);
        });
      });
  });

  it('Users should not returned when request is not authorized', () => {
    const users = [{'name': 'tempUser1'}, {'name': 'tempUser2'}];
    const token = 'eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6Im1lQGdtYWlsLmNvbSIsInNjb3BlIjoiYWRtaW4iLCJpYXQiOjE1Mjk3NzM1NzEsImV4cCI6MTQ4NzU2MTU3MX0.6BTcxkL7uTFpq-6viM0QoNuud9tiF-wjSqW8Bhu5x9Y';
    const returnUsers = sandbox.stub().resolves(users);
    const stubs = {
      '../admin_functions/returnUsers': returnUsers
    };
    const options = {
      method: 'GET',
      url: '/admin',
      headers: {
        'Authorization': token
      }
    };
    return getServer(stubs)
      .then((server) => {
        return server.inject(options).then((res) => {
          expect(res.statusCode).to.deep.equal(401);
        });
      });
  });
});
