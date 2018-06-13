'use strict';

const ObjectId = require('mongoose').Types.ObjectId;
const Admin = require('../models/admin');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const bcrypt = require('bcrypt');

// const saltRounds = 10;
// const Boom = require('boom');
const privateKey = 'AnkitaPrivate'; // Setup Private Key in Config : Later

module.exports = [

  {
    method: 'GET',
    path: '/adminTest',
    config: {
      auth: false,
      handler: function (request, reply) {
        reply('Testing Route');
      }
    }
  },
  {
    method: 'GET',
    path: '/admin',
    config: {
      auth: 'jwt',
      handler: function (request, reply) {
        if (request) { reply(request.auth.token); } else { reply('Sorry Only Admins Can Login!'); } // Redirect to login page here
      }
    }
  },
  {
    method: 'POST',
    path: '/admin',
    config: {
      auth: false,
      validate: {
        payload: {
          name: Joi.string().min(3).max(30).required(),
          password: Joi.string().min(3).max(30).required()
        }
      },
      handler: function (request, reply) {
        let name = request.payload.name;
        let password = request.payload.password;
        let token = jwt.sign({ exp: Math.floor(Date.now() / 1000) + (60 * 60), data: {name: name, password: password} }, privateKey, {algorithm: 'HS256'});

        Admin.findOne({name: name}).exec(function (err, admin) {
          if (err) {
            return reply('Something went wrong');
          }
          if (admin == null) {
            return reply('Not Valid Admin Credentials'); // Redirect to Login Page
            // Uncomment to store New Admin Credentials in Database :(Remove Later)
            // Comment above return statement
            // let hash = bcrypt.hashSync(password, saltRounds);
            // Admin.create({
            //   name: name,
            //   password: hash,
            //   token: token
            // }).then(Newadmin => {
            //   console.log('New Made:', Newadmin);
            //   return reply(Newadmin);
            // }).catch(function (err) {
            //   return reply(Boom.badImplementation(err));
            // });
          }
          bcrypt.compare(password, admin.password, function (err, res) {
            if (err) {
              return reply(err);
            }
            if (res) {
              admin.token = token;
              admin.save();
              return reply(admin);
            } else {
              return reply('Not Valid Admin Credentials');
            }
          });
        });
      }
    }
  },
  {
    method: 'GET',
    path: '/allUsers',
    config: {
      auth: 'jwt',
      handler: function (request, reply) {
        if (request) {
          User.find({}, function (err, users) {
            if (err) { reply(err); } else { reply(users); }
          });
        } else { reply('Invalid Login!').results; }
      }
    }

  },
  {
    method: 'GET',
    path: '/users/{id}',
    config: {
      auth: 'jwt',
      handler: function (request, reply) {
        if (request) {
          if (ObjectId.isValid(request.params.id)) {
            User.findOne({_id: request.params.id}).exec(function (err, user) {
              if (err) {
                reply(err);
              }
              if (user == null) {
                reply('No User with ' + request.params.id + 'Id found');
              }
              reply(user);
            });
          } else {
            reply('Not a valid Id');
          }
        } else { reply('Invalid Login!').results; }
      }
    }
  }

];
