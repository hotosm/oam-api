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

module.exports.addAnalyticsRecord = function (count) {
  var record = new Analytics({ date: Date.now(), count: count });
  record.save(function (err, record) {
    if (err) {
      return console.log(err);
    }
  });
};

/**
 * The date callback that returns the error and date.
 *
 * @callback responseCallback
 * @param {error} err - The error message
 * @param {int} date - The last updated date
 */
