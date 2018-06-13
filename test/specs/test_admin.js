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
  password: 'test'
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
    Admin.isValidAdmin(tempAdmin.name, tempAdmin.name, (result) => {
      expect(result).to.exist;
    });
  });
});

