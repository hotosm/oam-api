'use strict';

var mongoose = require('mongoose');

var tmsSchema = new mongoose.Schema({
  uri: {type: String, unique: true, required: true}, // The URI of TMS
  images: [{
    uuid: {type: String, required: true}
  }],
  created_at: Date
});

module.exports = mongoose.model('tms', tmsSchema);
