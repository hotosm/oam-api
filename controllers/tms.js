'use strict';

var Model = require('../models/tms.js');

/**
* Query TMS model. Implements all protocols supported by /meta endpoint
*
* @param {Object} payload - Payload contains query paramters and their values
* @param {recordsCallback} cb - The callback that returns the records
*/
module.exports.query = function (payload, page, limit, cb) {
  // bounding box search | looks for bbox in payload

  var skip = limit * (page - 1);

  // Execute the search and return the result via callback
  Model.count(payload, function (err, count) {
    if (err) {
      return cb(err, null, null);
    }
    Model.find(payload, null, { skip: skip, limit: limit }).exec(function (err, records) {
      cb(err, records, count);
    });
  });
};

module.exports.addUpdate = function (payload, cb) {

  var options = { upsert: true, new: true };
  var query = { uuid: payload.uri };
  Model.findOneAndUpdate(query, payload, options, function (err, record) {
    if (err) {
      return cb(err);
    }

    cb(err, record);
  });
};
