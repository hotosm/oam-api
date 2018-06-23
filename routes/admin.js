'use strict';

//const ObjectId = require('mongoose').Types.ObjectId;
//const Admin = require('../models/admin');
//const User = require('../models/user');
const Joi = require('joi');
const Boom = require('boom');
const verifyCredentials = require('../models/verifyCredentials');
const createToken = require('../models/createToken');

module.exports = [
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
    path: '/createToken',
    config: {
      auth: false,
      validate: {
        payload: {
          email: Joi.string().email().required(),
          password: Joi.string().min(3).max(30).required()
        }
      },
      handler: function (request, reply) {
        const email = request.payload.email;
        const password = request.payload.password;
        return verifyCredentials(email, password)
          .then(verified => {
            return createToken(email, 'admin').then((token) => {
              reply({ token: token }).code(201);
            });
          })
          .catch((error) => {
            reply(Boom.wrap(error));
          });
      },
      tags: ['disablePlugins']
    }
  }
  //{
    //method: 'GET',
    //path: '/allUsers',
    //config: {
      //auth: 'jwt',
      //handler: function (request, reply) {
        //if (request) {
          //User.find({}, function (err, users) {
            //if (err) { reply(err); } else { reply(users); }
          //});
        //} else { reply('Invalid Login!').results; }
      //}
    //}

  //},
  //{
    //method: 'GET',
    //path: '/users/{id}',
    //config: {
      //auth: 'jwt',
      //handler: function (request, reply) {
        //if (request) {
          //if (ObjectId.isValid(request.params.id)) {
            //User.findOne({_id: request.params.id}).exec(function (err, user) {
              //if (err) {
                //reply(err);
              //}
              //if (user == null) {
                //reply('No User with ' + request.params.id + 'Id found');
              //}
              //reply(user);
            //});
          //} else {
            //reply('Not a valid Id');
          //}
        //} else { reply('Invalid Login!').results; }
      //}
    //}
  //}

];
