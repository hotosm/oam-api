'use strict';
const mongoose = require('mongoose');

let adminSchema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: {type: String, required: true},
  bio: String,
  profile_pic_uri: String
});

module.exports = mongoose.model('Admin', adminSchema);
