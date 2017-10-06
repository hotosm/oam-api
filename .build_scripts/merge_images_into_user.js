#!/bin/env node

// Note. To connect to a specific remote database prepend DB_URI=... to the command.
// Try not to edit your .env file, accidents happen, for example when running tests
// whatever database is specified in .env is dropped.

require('dotenv').config();
var Meta = require('../models/meta');
var User = require('../models/user');
var Conn = require('../services/db');
var dbWrapper = new Conn();

var imagery_email = process.argv[2];
var user_email = process.argv[3];
var confirm = process.argv[4] === "confirm";

if (!user_email) {
  console.log('');
  console.log('Usage: ./merge_images_into_user.js [image owner email] [user email] [OPTIONAL: confirm]');
  process.exit();
}

console.log('');

if (confirm) {
  console.log("This is NOT a dry run.");
} else {
  console.log("This is a dry run. No database changes will be made. Use 'confirm' to make changes.");
}
console.log('');

dbWrapper.start(search);

function search() {
  Meta.find({
    contact: new RegExp(imagery_email, "i")
  }, function(err, images) {
    console.log('');
    if (err) {
      console.error(err);
      process.exit();
    }
    if (images.length === 0) {
      console.log('No imagery found for ' + imagery_email);
      process.exit();
    } else {
      console.log(images.length + ' images associated with ' + imagery_email + ':');
      images.forEach(function(image) {
        console.log(image.properties.thumbnail);
      });
      User.find({
        contact_email: new RegExp(user_email, "i")
      }, function(err, users) {
        console.log('');
        if (err) {
          console.error(err);
          process.exit();
        }
        if (users.length === 0) {
          console.log('No users found matching ' + user_email);
          process.exit();
        }
        if (users.length > 1) {
          console.log('Multiple users found matching ' + user_email);
          process.exit();
        }
        if (users.length === 1) {
          console.log('The following user matches the email: ' + users[0].name);
          console.log(users[0].website);
          console.log(users[0].bio);
          console.log('');
          if (confirm) {
            console.log('Merging images ...');
            merge(images, users[0]);
          } else {
            console.log('Run the command again with "confirm" as the last argument to merge');
          }
          console.log('');
          process.exit();
        }
      });
    }
  });
}

function merge (images, user) {
  images.forEach(function (image){
    image.user_id = user._id;
    image.save();
  });
}
