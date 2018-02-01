'use strict';
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const chai = require('chai');
const jwt = require('jsonwebtoken');
const User = require('../../models/user');
const config = require('../../config');

const expect = chai.expect;
chai.use(sinonChai);
const sandbox = sinon.sandbox.create();

const facebookCredentials = {
  provider: 'custom',
  profile: {
    id: 0,
    displayName: 'displayName',
    email: 'email@email.org',
    raw: {
      picture: {
        data: {
          url: 'url'
        }
      }
    }
  }
};

describe('User', () => {
  afterEach(() => {
    sandbox.restore();
  });
  it('should be invalid if name is empty', () => {
    const user = new User();
    user.validate().then((error) => {
      expect(error.errors.name).to.exist;
    });
  });

  it('jwtLogin should find existing user with facebook_id', () => {
    const findOne = sandbox.stub(User, 'findOne').returns(Promise.resolve({}));

    User.jwtLogin(facebookCredentials).then((token) => {
      expect(findOne).to.have.been
        .calledWith({ facebook_id: facebookCredentials.profile.id });
    });
  });

  it('jwtLogin should create new user when none is found', () => {
    const createUser = {
      facebook_id: facebookCredentials.profile.id,
      name: facebookCredentials.profile.displayName,
      contact_email: facebookCredentials.profile.email,
      profile_pic_uri: facebookCredentials.profile.raw.picture.data.url
    };

    sandbox.stub(User, 'findOne').returns(Promise.resolve(null));
    const create = sinon.stub(User, 'create')
      .returns(Promise.resolve({ _id: 'id', name: 'name' }));

    User.jwtLogin(facebookCredentials).then((token) => {
      expect(create).to.have.been
        .calledWith(createUser);
    });
  });

  it('jwtLogin should return promise with valid JWT token', () => {
    const user = { profile: { _id: 'id', name: 'name' } };
    sandbox.stub(User, 'findOne').returns(Promise.resolve(user));
    User.jwtLogin(facebookCredentials).then((token) => {
      const decoded = jwt.verify(token, config.jwtSecret);
      expect(decoded.id).to.equal(user._id);
    });
  });
});
