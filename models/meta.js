'use strict';

var mongoose = require('mongoose');

var metaSchema = new mongoose.Schema({
    uuid: { type : String , unique : true, required : true, dropDups: true },
    meta_uri: { type : String , unique : true, required : false },
    thumb_uri: String,
    title: String,
    projection: String,
    bbox: [Number],
    footprint: String,
    gsd: Number,
    file_size: Number,
    license: String,
    acquisition_start: Date,
    acquisition_end: Date,
    platform: String,
    tags: String,
    provider: String,
    contact: String,
    properties: [mongoose.Schema.Types.Mixed]
});

module.exports = mongoose.model('meta', metaSchema);
