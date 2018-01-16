'use strict';

var uuidV4 = require('uuid/v4');
var mongoose = require('mongoose');
var FB = require('fb');
const jwt = require('jsonwebtoken');
const config = require('../config');

var userSchema = mongoose.Schema({
  name: {type: String, required: true},
  website: String,
  bio: String,
  facebook_id: Number,
  facebook_token: String,
  google_id: Number,
  contact_email: String,
  profile_pic_uri: String,
  bucket_url: {type: String, unique: true, sparse: true},
  session_id: String,
  session_expiration: Date,
  images: [{type: mongoose.Schema.Types.ObjectId, ref: 'Meta'}]
});

userSchema.statics = {
  jwtLogin: function (credentials) {
    return this.findOne({
      facebook_id: credentials.profile.id
    })
    .then((user) => {
      if (user) {
        return user;
      } else {
        return this.create({
          facebook_id: credentials.profile.id,
          name: credentials.profile.displayName,
          contact_email: credentials.profile.email
        });
      }
    })
    .then((user) => {
      const userJWT = jwt.sign(
        {
          id: user._id,
          name: user.name,
          contact_email: user.contact_email
        },
        config.jwtSecret,
        { algorithm: 'HS256',
          expiresIn: '1h'
        }
      );
      return userJWT;
    })
    .catch((error) => {
      console.error(error);
    });
  },

  login: function (credentials, callback) {
    if (credentials.provider === 'facebook') {
      this.facebookLogin(credentials, callback);
    } else
    if (credentials.provider === 'google') {
      this.googleLogin(credentials, callback);
    } else {
      throw new Error(
        //`The ${credentials.provider} provider hasn't been setup yet.`
      );
    }
  },

  facebookLogin: function (credentials, callback) {
    this.findOne({
      facebook_id: credentials.profile.id
    }).then((fbUser) => {
      this.postFbAuth(fbUser, credentials, callback);
    }).catch(function (err) {
      console.error(callback(err));
    });
  },

  googleLogin: function (credentials, callback) {
    this.findOne({
      google_id: credentials.profile.id
    }).then((googleUser) => {
      this.postGoogleAuth(googleUser, credentials, callback);
    }).catch(function (err) {
      console.error(callback(err));
    });
  },

  postFbAuth: function (user, credentials, callback) {
    if (user) {
      user.postFbAuthSuccess(
        { facebook_token: credentials.token },
        callback
      );
    } else {
      this.create({
        facebook_id: credentials.profile.id,
        name: credentials.profile.displayName,
        contact_email: credentials.profile.email
      }).then(function (newUser) {
        newUser.postFbAuthSuccess(
          { facebook_token: credentials.token },
          callback
        );
      }).catch(function (err) {
        console.error(callback(err));
      });
    }
  },

  postGoogleAuth: function (user, credentials, callback) {
    if (user) {
      user.generateNewSessionValues(callback);
    } else {
      this.create({
        google_id: credentials.profile.id,
        name: credentials.profile.displayName,
        contact_email: credentials.profile.email,
        profile_pic_uri: credentials.profile.raw.picture
      }).then(function (newUser) {
        newUser.generateNewSessionValues(callback);
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
    this.generateNewSessionValues();
    this.save((err) => {
      if (err) {
        callback(err);
        return;
      }
      callback(null, this.session_id);
    });
  },

  generateNewSessionValues: function (callback) {
    var now = new Date();
    this.session_id = uuidV4();
    this.session_expiration = now.setDate(now.getDate() + 7);
    if (typeof callback === 'function') {
      this.save((err) => {
        if (err) {
          callback(err);
          return;
        }
        callback(null, this.session_id);
      });
    }
  },

  postFbAuthSuccess: function (updates, callback) {
    Object.assign(this, updates);
    this.generateNewSessionValues();
    this.getFBProfilePic((profilePicURI) => {
      this.profile_pic_uri = profilePicURI;
      this.save((err) => {
        if (err) {
          callback(err);
          return;
        }
        callback(null, this.session_id);
      });
    });
  },

  getFBProfilePic: function (callback) {
    FB.setAccessToken(this.facebook_token);
    FB.api('me', { fields: 'picture.type(small)' }, function (result) {
      if (!result || result.error) {
        console.error(!result ? 'Error getting FB profile pic' : result.error);
        callback(null);
      }
      callback(result.picture.data.url);
    });
  }
};

module.exports = mongoose.model('User', userSchema);
