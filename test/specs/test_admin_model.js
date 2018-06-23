'use strict';
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const chai = require('chai');
const Admin = require('../../models/admin');

const expect = chai.expect;
chai.use(sinonChai);
const sandbox = sinon.sandbox.create();

const testAdmin = {
  name: 'testName',
  email: 'testEmail',
  password: 'testPassword'
};

describe('Admin', () => {
  afterEach(() => {
    sandbox.restore();
  });

  it('should be invalid if name is empty', () => {
    const admin = new Admin({password: testAdmin.password});
    return admin.validate().catch((error) => {
      expect(error.errors.name).to.exist;
    });
  });

  it('should be invalid if password is empty', () => {
    const admin = new Admin({name: testAdmin.name});
    return admin.validate().catch((error) => {
      expect(error.errors.password).to.exist;
    });
  });
});
