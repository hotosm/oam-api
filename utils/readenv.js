'use strict';

/*
 * Read environment variables from .env file
 *
 */

var join = require('path').join;
var fse = require('fs-extra');
var env = require('node-env-file');


// Read env variables from .env FILE if it exists
var envFile = join(__dirname, '../.env');

if (fse.existsSync(envFile)) {
  try {
    env(envFile);
  }
  catch(err) {
    console.log(err);
  }
}
