'use strict';

var _ = require('lodash');
// var area = require('@turf/area').default;
var bboxPolygon = require('@turf/bbox-polygon').default;
var Boom = require('boom');
// var intersect = require('@turf/intersect').default;
var Joi = require('joi');
var merc = new (require('@mapbox/sphericalmercator'))();
// var union = require('@turf/union').default;

var User = require('../models/user');
var Meta = require('../models/meta');

module.exports = [
  {
    method: 'GET',
    path: '/user',
    config: {
      auth: 'session'
    },
    handler: function (request, reply) {
      User.findOne({
        session_id: request.auth.credentials.session_id
      }).then(function (user) {
        // TODO: Add `.to_json()` to all API-expressable models.
        return _.pick(user, [
          '_id',
          'name',
          'website',
          'bio',
          'contact_email',
          'profile_pic_uri'
        ]);
      }).then(function (user) {
        Meta.find({user: user._id}).then(function (images) {
          user.images = images;
          reply(user);
        });
      }).catch(function (err) {
        reply(Boom.badImplementation(err));
      });
    }
  },

  {
    method: 'PUT',
    path: '/user',
    config: {
      auth: 'session',
      validate: {
        params: {
          name: Joi.string().min(3).max(30),
          website: Joi.string().uri(),
          bio: Joi.string().min(1).max(300)
        }
      }
    },
    handler: function (request, reply) {
      User.findOne({
        session_id: request.auth.credentials.session_id
      }).then(function (user) {
        user = Object.assign(user, request.payload);
        user.save(function (err) {
          if (err) throw new Error('Error saving user: ', err);
          reply(null).code(204);
        });
      }).catch(function (err) {
        reply(Boom.badImplementation(err));
      });
    }
  },

  {
    method: 'GET',
    path: '/user/{id}',
    handler: function (request, reply) {
      User.findOne({
        _id: request.params.id
      }).then(function (user) {
        return _.pick(user, [
          '_id',
          'name',
          'website',
          'bio',
          'profile_pic_uri'
        ]);
      }).then(function (user) {
        Meta.find({user: request.params.id}).then(function (images) {
          user.images = images;
          reply(user);
        });
      }).catch(function (err) {
        reply(Boom.badImplementation(err));
      });
    }
  },

  {
    method: 'GET',
    path: '/user/{user}/catalog.json',
    config: {
      tags: ['disablePlugins']
    },
    handler: (request, reply) => {
      const { user } = request.params;

      return Promise.all([
        User.findOne({
          _id: user
        }, {
          name: 1,
          website: 1
        }),
        Meta.find({
          user
        }, {
          bbox: 1, gsd: 1
        })
      ])
        .then(([user, images]) => {
          const approximateZoom = Math.floor(images
            .map(meta => Math.ceil(Math.log2(2 * Math.PI * 6378137 / (meta.gsd * 256))))
            .reduce((a, b) => a + b) / images.length);

          const bounds = images.reduce((bbox, meta) =>
            [
              Math.min(bbox[0], meta.bbox[0]),
              Math.min(bbox[1], meta.bbox[1]),
              Math.max(bbox[2], meta.bbox[2]),
              Math.max(bbox[3], meta.bbox[3])
            ], [Infinity, Infinity, -Infinity, -Infinity]);

          return reply({
            name: user.name,
            bounds: bounds,
            center: [
              (bounds[0] + bounds[2]) / 2,
              (bounds[1] + bounds[3]) / 2,
              approximateZoom - 3
            ],
            maxzoom: approximateZoom + 3,
            minzoom: approximateZoom - 10
          });
        })
        .catch(err => reply(Boom.badImplementation(err.message)));
    }
  },

  {
    method: 'GET',
    path: '/user/{user}/{z}/{x}/{y}.json',
    config: {
      tags: ['disablePlugins']
    },
    handler: (request, reply) => {
      const { user, z, x, y } = request.params;

      const bbox = merc.bbox(x, y, z);
      const { geometry } = bboxPolygon(bbox);

      return Meta.find({
        user,
        geojson: {
          $geoIntersects: {
            $geometry: geometry
          }
        }
      }, {
        acquisition_end: 1,
        geojson: 1,
        gsd: 1,
        title: 1,
        uuid: 1
      }, {
        sort: {
          gsd: 1,
          acquisition_end: -1
        }
      }).then(images => {
        if (images.length === 0) {
          return reply(Boom.notFound());
        }

        // NOTE source prioritization is currently disabled due to
        // https://github.com/w8r/martinez/issues/74, which is triggered by
        // geometries in the Zanzibar imagery
        const sources = images;

        // // for filtering; more readable than embedding everything into reduce()
        // let tileArea = area(geometry);
        // let totalArea = 0;
        // let totalOverlap = null;
        // let filled = false;
        //
        // // sort by overlap
        // const sources = images
        //   // calculate overlap with the target tile
        //   .map(image => Object.assign(image, {
        //     overlap: intersect(geometry, image.geojson)
        //   }))
        //   // sort by overlap
        //   .sort((a, b) => area(b.overlap) - area(a.overlap))
        //   // filter unnecessary sources
        //   .filter(x => {
        //     if (filled) {
        //       // already full
        //       return false;
        //     }
        //
        //     const newOverlap = totalOverlap == null ? x.overlap : union(totalOverlap, x.overlap);
        //     const newArea = area(newOverlap);
        //
        //     if (newArea > totalArea) {
        //       // this source contributes
        //       if (newArea === tileArea) {
        //         // now full
        //         filled = true;
        //       }
        //
        //       totalOverlap = newOverlap;
        //       totalArea = newArea;
        //       return true;
        //     }
        //
        //     return false;
        //   });

        return reply(sources
          .map(meta => ({
            url: meta.uuid,
            name: meta.title,
            acquired_at: meta.acquisition_end,
            resolution: meta.gsd,
            recipes: {
              imagery: true
            }
          })));
      })
      .catch(err => {
        console.warn(err.stack);
        return reply(Boom.badImplementation(err.message));
      });
    }
  }
];
