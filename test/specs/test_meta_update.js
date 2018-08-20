/* eslint camelcase: 0 */
const Hapi = require('hapi');
const proxyquire = require('proxyquire').noCallThru();
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const authentication = require('../../plugins/authentication.js');
const meta = require('../fixtures/metadata.json');
const geojson = require('../fixtures/geojson.json');

const expect = chai.expect;
chai.should();
chai.use(sinonChai);
const sandbox = sinon.sandbox.create();

const ObjectId = 'ObjectId';
const apiEndpoint = 'apiEndpoint';
const id = 'id';
const sceneIdx = 'sceneIdx';
const imageId = 'imageId';
const url = `http://oam.com/uploads/${id}/${sceneIdx}/${imageId}`;
const image = {
  metadata: meta,
  user_id: 'user_id'
};

const buildStubs = () => {
  const findOne = sandbox.stub().resolves(image);
  const updateOne = sandbox.stub().resolves(true);
  const collectionStub = {
    findOne: findOne,
    updateOne: updateOne
  };
  const collection = sandbox.stub().returns(collectionStub);
  const ObjectID = function (id) {
    if (id) {
      this.id = id;
    } else {
      this.id = ObjectId;
    }
  };
  ObjectID.prototype.toString = function toString () {
    return this.id;
  };
  ObjectID.isValid = () => true;
  const stubs = {
    'mongoose': {
      connection: { collection: collection }
    },
    'mongodb': {
      ObjectID: ObjectID
    },
    '../config': {
      apiEndpoint
    }
  };
  return { stubs, collection, findOne, updateOne };
};

const getServer = (stubs) => {
  const uploads = proxyquire('../../routes/uploads.js', stubs);
  const server = new Hapi.Server();
  server.connection({ port: 4000 });
  return server.register(authentication).then(() => {
    server.route(uploads);
    return server;
  });
};

describe('Updating image metadata', () => {
  beforeEach(() => {
    sandbox.restore();
  });

  it('Sets status as processsing', () => {
    const {
      stubs,
      collection,
      updateOne
    } = buildStubs();

    const options = {
      method: 'POST',
      url,
      payload: {
        status: 'processing'
      }
    };
    return getServer(stubs)
      .then((server) => {
        return server.inject(options).then((res) => {
          expect(collection).to.have.been.calledWith('images');
          expect(updateOne.firstCall.args[0]._id.toString()).to.equal(imageId);
          expect(updateOne.firstCall.args[1].$set.status).to.equal('processing');
          expect(updateOne.firstCall.args[1].$currentDate.startedAt).to.be.true;
        });
      });
  });

  it('Sets status as errored', () => {
    const {
      stubs,
      collection,
      updateOne
    } = buildStubs();

    const options = {
      method: 'POST',
      url,
      payload: {
        status: 'failed'
      }
    };
    return getServer(stubs)
      .then((server) => {
        return server.inject(options).then((res) => {
          expect(collection).to.have.been.calledWith('images');
          expect(updateOne.firstCall.args[0]._id.toString()).to.equal(imageId);
          expect(updateOne.firstCall.args[1].$set.status).to.equal('errored');
          expect(updateOne.firstCall.args[1].$currentDate.stoppedAt).to.be.true;
        });
      });
  });

  it('Adds upload status message', () => {
    const {
      stubs,
      collection,
      updateOne
    } = buildStubs();

    const options = {
      method: 'POST',
      url,
      payload: {
        message: 'message'
      }
    };
    return getServer(stubs)
      .then((server) => {
        return server.inject(options).then((res) => {
          expect(collection).to.have.been.calledWith('images');
          expect(updateOne.firstCall.args[0]._id.toString()).to.equal(imageId);
          expect(updateOne.firstCall.args[1].$push.messages).to.equal('message');
        });
      });
  });

  it('Updates metadata when upload processing finishes', () => {
    const {
      stubs,
      findOne,
      updateOne
    } = buildStubs();

    const oamSync = sandbox.stub().resolves(true);
    const meta = {
      oamSync
    };
    const create = sandbox.stub().resolves(meta);
    const Meta = {
      create
    };
    stubs['../models/meta'] = Meta;

    const options = {
      method: 'POST',
      url,
      payload: geojson
    };
    return getServer(stubs)
      .then((server) => {
        return server.inject(options).then((res) => {
          expect(updateOne.firstCall.args[0]._id.toString()).to.equal(imageId);
          expect(updateOne.firstCall.args[1].$set.status).to.equal('finished');
          expect(updateOne.firstCall.args[1].$currentDate.stoppedAt).to.be.true;

          expect(findOne.firstCall.args[0]._id.toString()).to.equal(imageId);
          expect(create.firstCall.args[0].user).to.equal(image.user_id);
          expect(oamSync).to.have.been.called;

          expect(res.statusCode).to.equal(200);
        });
      });
  });

  it('Retries metadata update after removing dupicate vertices', () => {
    const { stubs } = buildStubs();

    const oamSync = sandbox.stub().resolves(true);
    const meta = {
      oamSync
    };
    const create = sandbox.stub();
    create.onFirstCall().rejects({
      code: 16755
    });
    create.onSecondCall().resolves(meta);

    const Meta = {
      create
    };
    stubs['../models/meta'] = Meta;

    const removeDuplicateVertices = sinon.stub();
    stubs['../services/removeDuplicateVertices'] = removeDuplicateVertices;

    const options = {
      method: 'POST',
      url,
      payload: geojson
    };
    return getServer(stubs)
      .then((server) => {
        return server.inject(options).then((res) => {
          expect(create.firstCall.args[0].user).to.equal(image.user_id);
          expect(create.secondCall.args[0].user).to.equal(image.user_id);
          expect(removeDuplicateVertices).to.have.been.calledOnce;
          expect(oamSync).to.have.been.calledOnce;

          expect(res.statusCode).to.equal(200);
        });
      });
  });

  it('Propagates other mongo errors', () => {
    const { stubs } = buildStubs();

    const create = sandbox.stub();
    create.onFirstCall().rejects({
      code: 0
    });

    const Meta = {
      create
    };
    stubs['../models/meta'] = Meta;

    const options = {
      method: 'POST',
      url,
      payload: geojson
    };
    return getServer(stubs)
      .then((server) => {
        return server.inject(options).then((res) => {
          expect(res.statusCode).to.equal(500);
        });
      });
  });
});
