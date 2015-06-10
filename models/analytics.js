'use strict';

var mongoose = require('mongoose');

var analyticsSchema = new mongoose.Schema({
    count: Number,
    last_updated: Date
});

module.exports = mongoose.model('analytics', analyticsSchema);
