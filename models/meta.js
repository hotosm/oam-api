'use strict';

var mongoose = require('mongoose');

var metaSchema = mongoose.Schema({
    uri: { type : String , unique : true, required : true, dropDups: true },
    title: String,
    projection: String,
    bbox: String,
    footprint: String,
    gsd: Number,
    file_size: Number,
    license: String,
    start: Date,
    end: Date,
    platform: String,
    tags: String,
    provider: String,
    contact_email: String,
    extra_meta: String
});

module.exports = mongoose.model('meta', metaSchema);
