'use strict';

var mongoose = require('mongoose');

var metaSchema = new mongoose.Schema({
    uuid: {type: String, unique: true, required: true, dropDups: true }, // The URI of the image
    meta_uri: {type: String, unique: true, required: false }, // To URI of the meta of the image
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
    geojson: {type: mongoose.Schema.Types.Mixed, index: '2dsphere'},
    properties: mongoose.Schema.Types.Mixed,
    custom_tms: mongoose.Schema.Types.Mixed
});

module.exports = mongoose.model('meta', metaSchema);
