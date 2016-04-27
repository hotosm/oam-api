'use strict';

var mongoose = require('mongoose');

var providerSchema = mongoose.Schema({
  name: {type: String, unique: true, required: true, dropDups: true},
  bucket_url: {type: String, required: true},
  contact_email: String
});

module.exports = mongoose.model('provider', providerSchema);
