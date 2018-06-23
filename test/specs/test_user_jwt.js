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

const googleCredentials = {
  provider: 'google',
  profile: {
    id: 1,
    displayName: 'displayName',
    email: 'email@email.org',
    raw: {
      picture: 'url'
    }
  }
};

describe('User', () => {
  afterEach(() => {
    sandbox.restore();
  });
  it('should be invalid if name is empty', () => {
    const user = new User();
    user.validate().catch((error) => {
      expect(error.message).to.exist;
    });
  });

  it('jwtLogin should find existing user with facebook_id', () => {
    const findOne = sandbox.stub(User, 'findOne').returns(Promise.resolve({}));

    User.jwtLogin(facebookCredentials).then((token) => {
      console.log(token);
      expect(findOne).to.have.been
        .calledWith({ facebook_id: facebookCredentials.profile.id });
    });
  });

  it('jwtLogin should find existing user with google_id', () => {
    const findOne = sandbox.stub(User, 'findOne').returns(Promise.resolve({}));

    User.jwtLogin(googleCredentials).then((token) => {
      expect(findOne).to.have.been
        .calledWith({ google_id: googleCredentials.profile.id });
    });
  });

  it('jwtLogin should create new Facebook user when none is found', () => {
    const createUser = {
      facebook_id: facebookCredentials.profile.id,
      name: facebookCredentials.profile.displayName,
      contact_email: facebookCredentials.profile.email,
      profile_pic_uri: facebookCredentials.profile.raw.picture.data.url
    };

    sandbox.stub(User, 'findOne').returns(Promise.resolve(null));
    const create = sandbox.stub(User, 'create')
      .returns(Promise.resolve({ _id: 'id', name: 'name' }));

    User.jwtLogin(facebookCredentials).then((token) => {
      expect(create).to.have.been
        .calledWith(createUser);
    });
  });

  it('jwtLogin should create new Google user when none if found', () => {
    const createUser = {
      google_id: googleCredentials.profile.id,
      name: googleCredentials.profile.displayName,
      contact_email: googleCredentials.profile.email,
      profile_pic_uri: googleCredentials.profile.raw.picture
    };

    sandbox.stub(User, 'findOne').returns(Promise.resolve(null));
    const create = sandbox.stub(User, 'create')
      .returns(Promise.resolve({ _id: 'id', name: 'name' }));

    User.jwtLogin(googleCredentials).then((token) => {
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
