'use strict';

var uuidV4 = require('uuid/v4');
var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
  name: {type: String, required: true},
  facebook_id: Number,
  facebook_token: String,
  contact_email: String,
  profile_pic_uri: String,
  bucket_url: {type: String, unique: true},
  session_id: String,
  session_expiration: Date,
  images: [{type: mongoose.Schema.Types.ObjectId, ref: 'Meta'}]
});

userSchema.statics = {
  login: function (credentials, callback) {
    this.findOne({
      facebook_id: credentials.profile.id
    }).then((fbUser) => {
      this.postFbAuth(fbUser, credentials, callback);
    }).catch(function (err) {
      console.error(callback(err));
    });
  },

  postFbAuth: function (user, credentials, callback) {
    if (user) {
      user.updateSession(callback);
    } else {
      this.create({
        facebook_id: credentials.profile.id,
        name: credentials.profile.displayName,
        contact_email: credentials.profile.email
      }).then(function (newUser) {
        newUser.updateSession(callback);
      }).catch(function (err) {
        console.error(callback(err));
      });
    }
  },

  validateSession: function (_request, session, callback) {
    this.findOne({session_id: session.sessionId}).then(function (user) {
      if (user && user.session_expiration > Date.now()) {
        callback(null, true, user);
      } else {
        callback(null, false);
      }
    }).catch(function (err) {
      console.error(callback(err, false));
    });
  }
};

userSchema.methods = {
  updateSession: function (callback) {
    var now = new Date();
    this.session_id = uuidV4();
    this.session_expiration = now.setDate(now.getDate() + 7);
    this.save((err) => {
      if (err) {
        callback(err);
        return;
      }
      callback(null, this.session_id);
    });
  }
};

module.exports = mongoose.model('User', userSchema);
