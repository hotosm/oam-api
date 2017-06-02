#!/usr/bin/env node
'use strict';
var readline = require('readline');
var MongoClient = require('mongodb').MongoClient;
var dbUri = require('../config').dbUri;

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question("Type 'yes' if you really want to clear the database: ", function (answer) {
  if (answer === 'yes') {
    console.log('Okay, doing it!');
    MongoClient.connect(dbUri, function (err, connection) {
      if (err) throw err;
      console.log('Connected to db.');
      console.log('Dropping workers');
      connection.dropCollection('workers')
      .then(function () {
        console.log('Dropping uploads');
        return connection.dropCollection('uploads');
      })
      .then(function () {
        console.log('Dropping tokens');
        return connection.dropCollection('tokens');
      })
      .then(function () {
        console.log('Dropping images');
        return connection.dropCollection('images');
      })
      .then(function () {
        console.log('Done.');
        connection.close();
      })
      .catch(function (err) {
        console.error(err);
        connection.close();
      });
    });
  } else {
    console.log('Abort! Whew!');
  }
  rl.close();
});
