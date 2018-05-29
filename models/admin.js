'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const privateKey = 'AnkitaPrivate'; // Setup Private Key in Config : Later

let adminSchema = mongoose.Schema({
  name: {type: String, required: true},
  emailId: String,
  password: {type: String, required: true},
  token: String,
  bio: String,
  profile_pic_uri: String,
  images: [{type: mongoose.Schema.Types.ObjectId, ref: 'Meta'}]
});

adminSchema.statics = {

  isValidAdmin: function (name, pass, callback) {
    this.findOne({'name': name}).then(admin => {
      if (!admin) {
        return false;
      }

      bcrypt.compare(pass, admin.password, function (err, res) {
        if (err) {
          return err;
        }
        if (!res) {
          return false;
        }
      });
      jwt.verify(this.token, privateKey, function (err, decoded) {
        if (err) {
          if (err.name === 'TokenExpiredError' || this.token === undefined) {
            admin.generateToken();
            return (admin);
          }
        }
      });
      return admin;
    }).then(admin => {
      return false;
    }).catch(err => {
      callback(err);
    });
  },
  generateToken: function () {
    let token = jwt.sign({ exp: Math.floor(Date.now() / 1000) + (60 * 60), data: {name: this.name, password: this.password} }, privateKey, {algorithm: 'HS256'});
    this.token = token;
    this.save();
    return token;
  }

};

module.exports = mongoose.model('Admin', adminSchema);
