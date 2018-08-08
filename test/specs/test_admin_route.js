const Hapi = require('hapi');
const proxyquire = require('proxyquire');
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const User = require('../../models/user');
const Meta = require('../../models/meta');

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

  it('Users returned by Get Request', () => {
    const users = [{'name': 'tempUser1'}, {'name': 'tempUser2'}];
    const find = sandbox.stub(User, 'find').returns(Promise.resolve(users));
    const stubs = {
      '../models/admin_helper': find
    };
    const options = {
      method: 'GET',
      url: '/users',
      credentials: { scope: 'admin' }
    };
    return getServer(stubs)
      .then((server) => {
        return server.inject(options).then((res) => {
          expect(res.result).to.deep.equal(users);
          expect(res.statusCode).to.equal(200);
        });
      });
  });

  it('Error message returned for no Users', () => {
    const find = sandbox.stub(User, 'find').returns(Promise.resolve(null));
    const stubs = {
      '../models/admin_helper': find
    };
    const options = {
      method: 'GET',
      url: '/users',
      credentials: { scope: 'admin' }
    };
    return getServer(stubs)
      .then((server) => {
        return server.inject(options).then((res) => {
          expect(res.result.message).to.equal('No User Found');
          expect(res.statusCode).to.equal(400);
        });
      });
  });

  it('Returns User Images with valid User', () => {
    const images = [
      {
        '_id': '5b5d79fdf1db7c4769bf83bc',
        'uuid': 'uuid1',
        'title': 'Finca La escalera',
        'uploaded_at': '2017-06-02T13:15:01.400Z'
      },
      {
        '_id': '5b5d7eeef1db7c4769bf83c2',
        'uuid': 'uuid2',
        'title': 'some_image1.tif',
        'uploaded_at': '2016-06-02T13:15:01.400Z'
      }];

    const user = {
      '_id': '5b336c83df44870a04c6d288',
      'name': 'test3',
      'images': images
    };
    const find = sandbox.stub(Meta, 'find').returns(Promise.resolve(images));
    const findOne = sandbox.stub(User, 'findOne').returns(Promise.resolve(user));
    const stubs = {
      '../models/admin_helper': findOne, find
    };
    const options = {
      method: 'GET',
      url: '/images/user/test3',
      credentials: { scope: 'admin' }
    };
    return getServer(stubs)
      .then((server) => {
        return server.inject(options).then((res) => {
          expect(res.result).to.deep.equal(images);
          expect(res.statusCode).to.equal(200);
        });
      });
  });

  it('Returns Error message when no such User found', () => {
    const images = [
      {
        '_id': '5b5d79fdf1db7c4769bf83bc',
        'uuid': 'uuid1',
        'title': 'Finca La escalera',
        'uploaded_at': '2017-06-02T13:15:01.400Z'
      },
      {
        '_id': '5b5d7eeef1db7c4769bf83c2',
        'uuid': 'uuid2',
        'title': 'some_image1.tif',
        'uploaded_at': '2016-06-02T13:15:01.400Z'
      }];
    const find = sandbox.stub(Meta, 'find').returns(Promise.resolve(images));
    const findOne = sandbox.stub(User, 'findOne').returns(Promise.resolve(null));
    const stubs = {
      '../models/admin_helper': findOne, find
    };
    const options = {
      method: 'GET',
      url: '/images/user/test3',
      credentials: { scope: 'admin' }
    };
    return getServer(stubs)
      .then((server) => {
        return server.inject(options).then((res) => {
          expect(res.result.message).to.equal('No Such User Found');
          expect(res.statusCode).to.equal(400);
        });
      });
  });

  it('Returns Error message when no image for user found', () => {
    const user = {
      '_id': '5b336c83df44870a04c6d288',
      'name': 'test3',
      'images': []
    };
    const find = sandbox.stub(Meta, 'find').returns(Promise.resolve(null));
    const findOne = sandbox.stub(User, 'findOne').returns(Promise.resolve(user));
    const stubs = {
      '../models/admin_helper': findOne, find
    };
    const options = {
      method: 'GET',
      url: '/images/user/test3',
      credentials: { scope: 'admin' }
    };
    return getServer(stubs)
      .then((server) => {
        return server.inject(options).then((res) => {
          expect(res.result.message).to.equal('No Such Image Found');
          expect(res.statusCode).to.equal(400);
        });
      });
  });

  it('Returns Image after dd/mm/yyyy date', () => {
    const images = [
      {
        '_id': '5b5d79fdf1db7c4769bf83bc',
        'uuid': 'uuid1',
        'title': 'Finca La escalera',
        'uploaded_at': '2017-06-02T13:15:01.400Z'
      },
      {
        '_id': '5b5d7eeef1db7c4769bf83c2',
        'uuid': 'uuid2',
        'title': 'some_image1.tif',
        'uploaded_at': '2016-06-02T13:15:01.400Z'
      }];
    const find = sandbox.stub(Meta, 'find').returns(Promise.resolve(images));
    const stubs = {
      '../models/admin_helper': find
    };
    const options = {
      method: 'GET',
      url: '/images/date/dd/mm/yyyy',
      credentials: { scope: 'admin' }
    };
    return getServer(stubs)
      .then((server) => {
        return server.inject(options).then((res) => {
          expect(res.result).to.deep.equal(images);
          expect(res.statusCode).to.equal(200);
        });
      });
  });

  it('Returns Error when no Image after dd/mm/yyyy date found', () => {
    const find = sandbox.stub(Meta, 'find').returns(Promise.resolve(null));
    const stubs = {
      '../models/admin_helper': find
    };
    const options = {
      method: 'GET',
      url: '/images/date/dd/mm/yyyy',
      credentials: { scope: 'admin' }
    };
    return getServer(stubs)
      .then((server) => {
        return server.inject(options).then((res) => {
          expect(res.result.message).to.equal('No Image Found');
          expect(res.statusCode).to.equal(400);
        });
      });
  });

  it('Returns Image of Platform', () => {
    const images = [
      {
        '_id': '5b5d79fdf1db7c4769bf83bc',
        'uuid': 'uuid1',
        'title': 'Finca La escalera',
        'uploaded_at': '2017-06-02T13:15:01.400Z'
      },
      {
        '_id': '5b5d7eeef1db7c4769bf83c2',
        'uuid': 'uuid2',
        'title': 'some_image1.tif',
        'uploaded_at': '2016-06-02T13:15:01.400Z'
      }];
    const find = sandbox.stub(Meta, 'find').returns(Promise.resolve(images));
    const stubs = {
      '../models/admin_helper': find
    };
    const options = {
      method: 'GET',
      url: '/images/platform/p',
      credentials: { scope: 'admin' }
    };
    return getServer(stubs)
      .then((server) => {
        return server.inject(options).then((res) => {
          expect(res.result).to.deep.equal(images);
          expect(res.statusCode).to.equal(200);
        });
      });
  });

  it('Returns Error when no Image of platform found', () => {
    const find = sandbox.stub(Meta, 'find').returns(Promise.resolve(null));
    const stubs = {
      '../models/admin_helper': find
    };
    const options = {
      method: 'GET',
      url: '/images/platform/p',
      credentials: { scope: 'admin' }
    };
    return getServer(stubs)
      .then((server) => {
        return server.inject(options).then((res) => {
          expect(res.result.message).to.equal('No Image Found');
          expect(res.statusCode).to.equal(400);
        });
      });
  });

  it('Returns Image starting with letter Found', () => {
    const images = [
      {
        '_id': '5b5d79fdf1db7c4769bf83bc',
        'uuid': 'uuid1',
        'title': 'Finca La escalera',
        'uploaded_at': '2017-06-02T13:15:01.400Z'
      },
      {
        '_id': '5b5d7eeef1db7c4769bf83c2',
        'uuid': 'uuid2',
        'title': 'some_image1.tif',
        'uploaded_at': '2016-06-02T13:15:01.400Z'
      }];
    const find = sandbox.stub(Meta, 'find').returns(Promise.resolve(images));
    const stubs = {
      '../models/admin_helper': find
    };
    const options = {
      method: 'GET',
      url: '/images/alphabet/a',
      credentials: { scope: 'admin' }
    };
    return getServer(stubs)
      .then((server) => {
        return server.inject(options).then((res) => {
          expect(res.result).to.deep.equal(images);
          expect(res.statusCode).to.equal(200);
        });
      });
  });

  it('Returns Error when no Image of a Letter found', () => {
    const find = sandbox.stub(Meta, 'find').returns(Promise.resolve(null));
    const stubs = {
      '../models/admin_helper': find
    };
    const options = {
      method: 'GET',
      url: '/images/alphabet/a',
      credentials: { scope: 'admin' }
    };
    return getServer(stubs)
      .then((server) => {
        return server.inject(options).then((res) => {
          expect(res.result.message).to.equal('No Image Found');
          expect(res.statusCode).to.equal(400);
        });
      });
  });

  it('Delete User when User exists', () => {
    const user = {
      '_id': '5b336c83df44870a04c6d288',
      'name': 'test3',
      'images': []
    };
    const findOneAndRemove = sandbox.stub(User, 'findOneAndRemove').returns(Promise.resolve(user));
    const stubs = {
      '../models/admin_helper': findOneAndRemove
    };
    const options = {
      method: 'DELETE',
      url: '/users/5b336c83df44870a04c6d288',
      credentials: { scope: 'admin' }
    };
    return getServer(stubs)
      .then((server) => {
        return server.inject(options).then((res) => {
          expect(res.result).to.deep.equal(user);
          expect(res.statusCode).to.equal(200);
        });
      });
  });

  it('No deletion when User does not exists', () => {
    const user = null;
    const findOneAndRemove = sandbox.stub(User, 'findOneAndRemove').returns(Promise.resolve(user));
    const stubs = {
      '../models/admin_helper': findOneAndRemove
    };
    const options = {
      method: 'DELETE',
      url: '/users/5b336c83df44870a04c6d288',
      credentials: { scope: 'admin' }
    };
    return getServer(stubs)
      .then((server) => {
        return server.inject(options).then((res) => {
          expect(res.result.message).to.equal('No Such User Found');
          expect(res.statusCode).to.equal(400);
        });
      });
  });

  it('Delete Image when Exists', () => {
    const imageToDelete = {
      '_id': '5b5d79fdf1db7c4769bf83bc'
    };
    const find = sandbox.stub(User, 'find').returns(Promise.resolve(null));
    const findOneAndRemove = sandbox.stub(Meta, 'findOneAndRemove').returns(Promise.resolve(imageToDelete));
    const stubs = {
      '../models/admin_helper': findOneAndRemove, find
    };
    const options = {
      method: 'DELETE',
      url: '/image/5b5d79fdf1db7c4769bf83bc',
      credentials: { scope: 'admin' }
    };
    return getServer(stubs)
      .then((server) => {
        return server.inject(options).then((res) => {
          expect(res.result).to.deep.equal(imageToDelete);
          expect(res.statusCode).to.equal(200);
        });
      });
  });

  it('No deletion when User does not exists', () => {
    const image = null;
    const findOneAndRemove = sandbox.stub(Meta, 'findOneAndRemove').returns(Promise.resolve(image));
    const find = sandbox.stub(User, 'find').returns(Promise.resolve(null));
    const stubs = {
      '../models/admin_helper': findOneAndRemove, find
    };
    const options = {
      method: 'DELETE',
      url: '/image/5b5d79fdf1db7c4769bf83bc',
      credentials: { scope: 'admin' }
    };
    return getServer(stubs)
      .then((server) => {
        return server.inject(options).then((res) => {
          expect(res.result.message).to.equal('No Such Image Found');
          expect(res.statusCode).to.equal(400);
        });
      });
  });
});
