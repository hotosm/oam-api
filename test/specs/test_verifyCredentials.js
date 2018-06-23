const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const chai = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const Admin = require('../../models/admin');

const expect = chai.expect;
chai.use(sinonChai);
const sandbox = sinon.sandbox.create();

const testAdmin = {
  name: 'testName',
  email: 'testEmail',
  password: 'testPassword'
};

describe('verifyCredentials', () => {
  afterEach(() => {
    sandbox.restore();
  });

  it('should return true when admin exists and password matches', () => {
    const admin = new Admin({
      name: testAdmin.name,
      email: testAdmin.email,
      password: testAdmin.name
    });
    const findOne = sandbox.stub().resolves(admin);
    const compare = sandbox.stub().resolves(true);
    const verifyCredentials = proxyquire('../../models/verifyCredentials',
      {
        './admin': { findOne: findOne },
        'bcrypt': { compare: compare }
      });
    return verifyCredentials(testAdmin.email, testAdmin.password)
      .then((passwordMatches) => {
        expect(passwordMatches).to.be.true;
      });
  });

  it('should return error when admin does not exist', () => {
    const findOne = sandbox.stub().resolves(null);
    const compare = sandbox.stub().resolves(true);
    const verifyCredentials = proxyquire('../../models/verifyCredentials',
      {
        './admin': { findOne: findOne },
        'bcrypt': { compare: compare }
      });
    return verifyCredentials(testAdmin.email, testAdmin.password)
      .catch((error) => {
        expect(error.message).to.equal('Email does not exist');
      });
  });

  it('should return error when password does not match', () => {
    const admin = new Admin({
      name: testAdmin.name,
      email: testAdmin.email,
      password: testAdmin.name
    });
    const findOne = sandbox.stub().resolves(admin);
    const compare = sandbox.stub().resolves(true);
    const verifyCredentials = proxyquire('../../models/verifyCredentials',
      {
        './admin': { findOne: findOne },
        'bcrypt': { compare: compare }
      });
    return verifyCredentials(testAdmin.email, testAdmin.password)
      .catch((error) => {
        expect(error.message).to.equal('Password does not match');
      });
  });
});
