'use strict';

var _ = require('lodash');
var url = require('url');
const { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsCommand, DeleteObjectsCommand } = require('@aws-sdk/client-s3');

var config = require('../config');

/**
* Manage the syncing of meta objects with their *_metadata.json counterparts
*/
module.exports = class S3Sync {
  constructor (remoteMetaUri) {
    this.s3 = new S3Client({});
    this.remoteMetaUri = remoteMetaUri;
    this.s3Params = {
      Bucket: config.oinBucket
    };
    this.parseS3Key();
  }

  // Don't try to manipulate metadata files that aren't in OIN's public bucket.
  isOINMeta () {
    let isInDomain = this.remoteMetaUri.includes(`${config.oinBucket}.${config.s3PublicDomain}`);
    let isInPath = this.remoteMetaUri.includes(`/${config.oinBucket}/`);
    return isInDomain || isInPath;
  }

  updateRemoteMeta (newDetails, callback) {
    if (!this.isOINMeta()) {
      callback();
      return;
    }
    this.s3Params.Key = this.s3Key;
    this.newMetadataDetails = newDetails;
    this.downloadRemoteMeta().then((metadataString) => {
      let metadata = this.updateMetadataJSON(metadataString, newDetails);
      return this.uploadMeta(metadata);
    }).then(function () {
      callback();
    }).catch(function (err) {
      throw new Error(err);
    });
  }

  deleteRemoteMeta (callback) {
    if (!this.isOINMeta()) {
      callback();
      return;
    }
    this.setParamsToDeleteDirectory();
    console.log(`Attempting to delete: s3://${this.s3Params.Bucket}/${this.s3Params.Key}`);
    this.s3Params.Prefix = this.s3Params.Key;
    delete this.s3Params.Key;
    this.s3.send(new ListObjectsCommand(this.s3Params))
      .then((data) => {
        if (data.Contents.length === 0) {
          callback();
          return;
        }
        delete this.s3Params.Prefix;
        this.s3Params.Delete = { Objects: [] };
        data.Contents.forEach((content) => {
          this.s3Params.Delete.Objects.push({Key: content.Key});
        });
        return this.s3.send(new DeleteObjectsCommand(this.s3Params));
      })
      .then(() => {
        callback();
      })
      .catch((err) => {
        throw new Error(err);
      });
  }

  // Find the base folder within which all the assets for a single image exists
  setParamsToDeleteDirectory () {
    let path;
    let directories = this.s3Key.split('/');
    if (config.oinBucketPrefix) {
      // If there's a bucket prefix we need to include that, otherwise we'll delete the entire prefix
      path = `${directories[0]}/${directories[1]}`;
    } else {
      path = directories[0];
    }
    this.s3Params.Key = path;
  }

  parseS3Key () {
    this.s3Key = url.parse(this.remoteMetaUri).pathname.replace(/^\//, '');
    // For whatever reason the bucket name may have been placed in the path rather than
    // as a prefix to the subdomain. For instance if using an S3-compatible service.
    if (this.remoteMetaUri.includes(`${config.s3PublicDomain}/${config.oinBucket}`)) {
      this.s3Key = this.s3Key.replace(`${config.oinBucket}/`, '');
    }
  }

  downloadRemoteMeta () {
    return new Promise((resolve, reject) => {
      console.info(`Downloading metadata file: ${this.s3Params.Key}`);
      this.s3.send(new GetObjectCommand(this.s3Params))
        .then(async (response) => {
          const chunks = [];
          for await (const chunk of response.Body) {
            chunks.push(chunk);
          }
          const bodyString = Buffer.concat(chunks).toString('utf8');
          resolve(bodyString);
        })
        .catch((err) => {
          reject('Unable to download metadata: ' + err.stack);
        });
    });
  }

  updateMetadataJSON (metadataString, newDetails) {
    let metadata = JSON.parse(metadataString);
    metadata = _.merge(metadata, newDetails);
    return JSON.stringify(metadata);
  }

  uploadMeta (metadata) {
    this.s3Params.Key = this.s3Key;
    return new Promise((resolve, reject) => {
      console.info(`Uploading metadata file: ${this.s3Params.Key}`);
      this.s3Params.Body = Buffer.from(metadata, 'utf8');
      this.s3.send(new PutObjectCommand(this.s3Params))
        .then(() => {
          resolve();
        })
        .catch((err) => {
          reject(new Error('Unable to replace metadata: ' + err.stack));
        });
    });
  }
};
