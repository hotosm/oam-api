'use strict';

const ObjectId = require('mongoose').Types.ObjectId;
const Admin = require('../models/admin');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
// const Boom = require('boom');
const Joi = require('joi');
const bcrypt = require('bcrypt');
// const saltRounds = 10;
const privateKey = 'AnkitaPrivate'; // Setup Private Key in Config : Later

module.exports = [

  {
    method: 'GET',
    path: '/admin',
    config: {
      auth: 'jwt',
      handler: (request, h) => {
        if (request) { h(request.auth.token); } else { h('Sorry Only Admins Can Login!').results; } // Redirect to login page here
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
      handler: (request, h) => {
        let name = request.payload.name;
        let password = request.payload.password;
        let token = jwt.sign({ exp: Math.floor(Date.now() / 1000) + (60 * 60), data: {name: name, password: password} }, privateKey, {algorithm: 'HS256'});

        Admin.findOne({name: name}).exec(function (err, admin) {
          if (err) {
            h('Something went wrong');
          }
          if (admin == null) {
            h('Not Valid Admin Credentials'); // Redirect to Login Page
            // Uncomment to store New Admin Credentials in Database :(Remove Later)
            // Comment above return statement
                  /*
                  let hash = bcrypt.hashSync(password, saltRounds);
                  let Newadmin = Admin.create({
                          name: name,
                          password: hash,
                          token : token
                  }).then(Newadmin=>{
                        console.log('New Made:',Newadmin);
                        return Newadmin;
                  }).catch(function (err) {
                      return(Boom.badImplementation(err));
                  });
                  */
          }
          bcrypt.compare(password, admin.password, function (err, res) {
            if (err) {
              h(err);
            }
            if (res) {
              admin.token = token;
              admin.save();
              h(admin);
            } else {
              h('Not Valid Admin Credentials');
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
      handler: (request, h) => {
        if (request) {
          User.find({}, function (err, users) {
            if (err) { h(err); } else { h(users); }
          });
        } else { h('Invalid Login!').results; }
      }
    }

  },
  {
    method: 'GET',
    path: '/users/{id}',
    config: {
      auth: 'jwt',
      handler: (request, h) => {
        if (request) {
          if (ObjectId.isValid(request.params.id)) {
            User.findOne({_id: request.params.id}).exec(function (err, user) {
              if (err) {
                h(err);
              }
              if (user == null) {
                h('No User with ' + request.params.id + 'Id found');
              }
              h(user);
            });
          } else {
            h('Not a valid Id');
          }
        } else { h('Invalid Login!').results; }
      }
    }
  }

];
