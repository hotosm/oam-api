'use strict';
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const chai = require('chai');
const User = require('../../models/user');

const expect = chai.expect;
chai.use(sinonChai);
const facebookCredentials = {
  profile: {
    id: 0,
    displayName: 'displayName',
    email: 'email@email.org'
  }
};

describe('User', () => {
  it('should be invalid if name is empty', () => {
    const user = new User();
    user.validate().then((error) => {
      expect(error.errors.name).to.exist;
    });
  });

  it('jwtLogin should find existing user with facebook_id', () => {
    const findOne = sinon.stub(User, 'findOne').returns(Promise.resolve({}));

    User.jwtLogin(facebookCredentials).then((token) => {
      expect(findOne).to.have.been
        .calledWith({ facebook_id: facebookCredentials.profile.id });
      findOne.restore();
    });
  });

  it('jwtLogin should create new user when none is found', () => {
    const createUser = {
      facebook_id: facebookCredentials.profile.id,
      name: facebookCredentials.profile.displayName,
      contact_email: facebookCredentials.profile.email
    };

    sinon.stub(User, 'findOne').returns(Promise.resolve(null));
    const create = sinon.stub(User, 'create')
      .returns(Promise.resolve({ _id: 'id', name: 'name' }));

    User.jwtLogin(facebookCredentials).then((token) => {
      expect(create).to.have.been
        .calledWith(createUser);
    });
  });
});
