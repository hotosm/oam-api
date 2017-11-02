#!/bin/env node

// Note. To connect to a specific remote database prepend DB_URI=... to the command.
// Try not to edit your .env file, accidents happen, for example when running tests
// whatever database is specified in .env is dropped.

require('dotenv').config();
var Meta = require('../models/meta');
var User = require('../models/user');
var Conn = require('../services/db');
var dbWrapper = new Conn();

var imageryEmail = process.argv[2];
var userEmail = process.argv[3];
var confirm = process.argv[4] === 'confirm';

if (!userEmail) {
  throw new Error('Must include [user email] argument');
}

if (confirm) {
  console.log('This is NOT a dry run.');
} else {
  console.log('This is a dry run. No database changes will be made.' +
              ' Use "confirm" to make changes.');
}

dbWrapper.start(search);

function search () {
  const imagesPromise = Meta.find({ contact: new RegExp(imageryEmail, 'i') });
  const usersPromise = User.find({ contact_email: new RegExp(userEmail, 'i') });
  Promise.all([imagesPromise, usersPromise])
    .then(function (values) {
      const images = values[0];
      const users = values[1];

      if (images.length === 0) {
        throw new Error('No imagery found for ' + imageryEmail);
      }
      if (users.length === 0) {
        throw new Error('No users found matching ' + userEmail);
      }
      if (users.length > 1) {
        throw new Error('Multiple users found matching ' + userEmail);
      }
      console.log(images.length + ' images associated with ' + imageryEmail);

      const user = users[0];
      console.log('The following user matches the email: ' + user.name);

      if (confirm) {
        console.log('Merging images ...');
        images.forEach(function (image) {
          user.images.addToSet(image);
        });
        const savePromises = images.map(function (image) {
          image.user = user;
          return image.save();
        });
        savePromises.push(user.save());
        return Promise.all(savePromises);
      } else {
        console.log('Run the command again with "confirm" as the last argument');
        dbWrapper.close();
      }
    })
    .then(function (values) {
      const user = values[values.length - 1];
      console.log(values.length - 1 + ' Images merged for ' + user.name);
      dbWrapper.close();
    })
    .catch(function (error) {
      console.log(error.message);
      dbWrapper.close();
    });
}

