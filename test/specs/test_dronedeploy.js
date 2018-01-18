/* eslint camelcase: 0 */
const Hapi = require('hapi');
const router = require('hapi-router');
const proxyquire = require('proxyquire').noCallThru();
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const chai = require('chai');
const buildUrl = require('build-url');
const authentication = require('../../plugins/authentication.js');

const expect = chai.expect;
chai.use(sinonChai);
const sandbox = sinon.sandbox.create();

let server;

describe('Uploading image from DroneDeploy', () => {
  beforeEach(() => {
    const stubs = buildStubs();
    return getServer(stubs);
  });

  const buildStubs = () => {
    const insertMany = sandbox.stub().resolves([1]);
    const insertOne = sandbox.stub().resolves(true);
    //const insertOne = sandbox.stub().rejects('whooa');
    const collectionStub = {
      insertMany: insertMany,
      insertOne: insertOne
    };
    const collection = sandbox.stub().returns(collectionStub);
    const queueImage = sandbox.stub().resolves(true);
    //const send = sandbox.stub().callsArgWith(1, 'yooo', null);
    const send = sandbox.stub().callsArgWith(1, null, {});
    const ObjectID = function () {
    };
    const stubs = {
      'mongoose': {
        connection: { collection }
      },
      'mongodb': {
        ObjectID: ObjectID
      },
      '../services/transcoder': {
        queueImage: queueImage
      },
      'sendgrid': () => {
        return { send: send };
      }
    };
    return stubs;
  };
  const getServer = (stubs) => {
    const uploads = proxyquire('../../routes/uploads.js', stubs);

    server = new Hapi.Server();
    server.connection({ port: 4000 });
    return server.register(authentication).then(() => {
      server.route(uploads);
    });
  };
  after(() => {
    sandbox.restore();
  });

  it('dronedeploy', () => {
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
      name: 'Test',
      contact_email: 'Test@test.com'
    };
    const payload = {
      download_path: 'https://s3.com'
    };
    const options = {
      method: 'POST',
      url,
      credentials,
      payload
    };

    server.inject(options).then((res) => {
      console.log(res.result);
      //expect(collectionStub).to.have.been.calledWith('wat');
    });
  });
});
