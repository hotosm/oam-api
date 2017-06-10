'use strict';

var Analytics = require('../models/analytics.js');

/**
* Get the date the catalog was last updated.
*
* @param {dataCallback} cb - The callback that returns the date
*/
module.exports.query = function (page, limit, cb) {
  // Execute the search and return the result via callback

  var skip = limit * (page - 1);

  Analytics.count(function (err, count) {
    if (err) {
      return cb(err, null, null);
    }
    Analytics.find(null, null, { skip: skip, limit: limit }).sort({ date: -1 }).exec(function (err, records) {
      if (err) {
        return cb(err, null, null);
      }
      cb(err, records, count);
    });
  });
};

/**
* Add a analytics record to the database.
*
* @param {int} counts - An object containing
*                .image_count - number of images in system
*                .sensor_count - number of unique sensors in system
*                .provider_count - number of unique providers in system
*/
module.exports.addAnalyticsRecord = function (counts, cb) {
  var record = new Analytics({
    date: Date.now(),
    count: counts.image_count,
    sensor_count: counts.sensor_count,
    provider_count: counts.provider_count
  });
  record.save(function (err, record) {
    if (err) {
      cb(err);
      return console.log(err);
    }

    cb(null);
  });
};

/**
* Check the analytics collection to find the last time the system was updated.
*
* @param {dataCallback} cb - A callback with format (error, date)
*/
module.exports.getLastUpdateTime = function (cb) {
  Analytics.findOne().sort({ date: -1 }).exec(function (err, record) {
    if (err) {
      return cb(err, null);
    }
    // If we don't have a date (this should never happen in practice), set it
    // to some time in the past
    if (record === null) {
      record = { date: new Date('01-01-1970') };
    }
    cb(null, record.date);
  });
};

