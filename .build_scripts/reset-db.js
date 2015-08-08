#!/usr/bin/env node
'use strict';
var readline = require('readline');
var MongoClient = require('mongodb').MongoClient;
var dbUri = require('../config').dbUri;

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question("Type 'yes' if you really want to clear the database.", function (answer) {
  if (answer === 'yes') {
    console.log('Okay, doing it!');
    MongoClient.connect(dbUri, function (err, connection) {
      if (err) throw err;
      connection.collection('workers').deleteMany({})
      .then(function () {
        return connection.collection('uploads').deleteMany({});
      })
      .then(function () {
        console.log('Done.');
        connection.close();
      });
    });
  } else {
    console.log('Abort! Whew!');
  }
  rl.close();
});
