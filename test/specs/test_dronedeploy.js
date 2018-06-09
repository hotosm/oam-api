/* eslint camelcase: 0 */
const Hapi = require('hapi');
const proxyquire = require('proxyquire').noCallThru();
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const buildUrl = require('build-url');
const authentication = require('../../plugins/authentication.js');

const expect = chai.expect;
chai.should();
chai.use(sinonChai);
const sandbox = sinon.sandbox.create();

const ObjectId = 'ObjectId';
const download_path = 'https://s3.com';
const apiEndpoint = 'apiEndpoint';
const contact_email = 'Test@test.com';
const sendgridFrom = 'sendgridFrom';
const subject = 'subject';
const text = 'text';

const buildStubs = () => {
  const insertMany = sandbox.stub().resolves([1]);
  const insertOne = sandbox.stub().resolves(true);
  const collectionStub = {
    insertMany: insertMany,
    insertOne: insertOne
  };
  const collection = sandbox.stub().returns(collectionStub);
  const queueImage = sandbox.stub().resolves(true);
  const send = sandbox.stub().callsArgWith(1, null, {});
  const ObjectID = function () {
  };
  ObjectID.prototype.toString = () => ObjectId;
  const stubs = {
    'mongoose': {
      connection: { collection: collection }
    },
    'mongodb': {
      ObjectID: ObjectID
    },
    '../services/transcoder': {
      queueImage: queueImage
    },
    'sendgrid': () => {
      return { send: send };
    },
    '../config': {
      apiEndpoint,
      sendgridFrom,
      emailNotification: { subject, text }
    }
  };
  return { stubs, collection, insertMany, insertOne, queueImage, send };
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

const buildWebhook = () => {
  const acquisition_start = new Date(2018, 1, 1).toISOString();
  const acquisition_end = new Date(2018, 1, 2).toISOString();
  const sensor = 'Sensor';
  const provider = 'Provider';
  const tags = '';
  const title = 'Title';

  const url = buildUrl('http://oam.com', {
    path: 'dronedeploy',
    queryParams: {
      acquisition_start: encodeURIComponent(acquisition_start),
      acquisition_end: encodeURIComponent(acquisition_end),
      sensor,
      provider,
      tags,
      title
    }
  });
  const credentials = {
    _id: 'id',
    name: 'Test',
    contact_email: contact_email
  };
  const payload = {
    download_path
  };
  const options = {
    method: 'POST',
    url,
    credentials,
    payload
  };
  return options;
};

describe('Uploading image from DroneDeploy', () => {
  afterEach(() => {
    sandbox.restore();
  });

  it('Process the url and provides reply', () => {
    const options = buildWebhook();
    const {
      stubs,
      collection,
      insertMany,
      insertOne,
      queueImage,
      send
    } = buildStubs();
    return getServer(stubs)
      .then((server) => {
        return server.inject(options).then((res) => {
          expect(collection).to.have.been.calledWith('images');
          expect(collection).to.have.been.calledWith('uploads');
          expect(insertMany.firstCall.args[0].length).to.equal(1);
          const upload = insertOne.firstCall.args[0];
          expect(upload.scenes[0].images.length).to.equal(1);
          expect(upload.user).to.equal('id');
          expect(upload._id).to.not.equal(null);
          const queuedImage = queueImage.firstCall.args;
          expect(queuedImage[0]).to.equal(download_path);
          expect(queuedImage[1]).to.equal(`${ObjectId}/0/${ObjectId}`);
          expect(queuedImage[2])
            .to.equal(`${apiEndpoint}/uploads/${ObjectId}/0/${ObjectId}`);
          expect(send.firstCall.args[0].to).to.equal(contact_email);
          expect(res.result.upload.toString()).to.equal(ObjectId);
        });
      });
  });

  it('It provides failure reply when transcoder rejects', () => {
    const options = buildWebhook();
    const { stubs } = buildStubs();
    stubs['../services/transcoder'].queueImage = sandbox.stub().rejects('failed');
    return getServer(stubs)
    .then((server) => {
      return server.inject(options).then((res) => {
        expect(res.result.statusCode).to.equal(500);
      });
    });
  });

  // it('Sendgrid callback wrapper rejects with error and forces catch', () => {
    // const options = buildWebhook();
    // const { stubs } = buildStubs();
    // stubs.sendgrid = () => {
      // return { send: sandbox.stub().callsArgWith(1, 'error', null) };
    // };
    // return getServer(stubs)
    // .then((server) => {
      // return server.inject(options).then((res) => {
        // expect(res.result.statusCode).to.equal(500);
      // });
    // });
  // });
});
