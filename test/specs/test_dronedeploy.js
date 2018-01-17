/* eslint camelcase: 0 */
const Hapi = require('hapi');
const router = require('hapi-router');
//const proxyquire = require('proxyquire').noCallThru();
const expect = require('chai').expect;
const buildUrl = require('build-url');
const authentication = require('../../plugins/authentication.js');
let server;

describe('Uploading image from DroneDeploy', () => {
  beforeEach(() => {
    const uploads = require('../../routes/uploads.js');
    server = new Hapi.Server();
    server.connection({ port: 4000 });
    return server.register(authentication).then(() => {
      server.route(uploads);
    });
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
    });
  });
});
