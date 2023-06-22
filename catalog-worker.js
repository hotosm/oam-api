/**
 * This background process polls S3 buckets for new imagery
 */

"use strict";
var path = require("path");

console.log("Starting catalog worker...");

require("dotenv").config({
  path: path.resolve(process.cwd(), process.env.DOT_ENV_FILENAME || ".env"),
});

var _ = require("lodash");
var S3 = require("aws-sdk/clients/s3");
var async = require("async");
var config = require("./config");
var Conn = require("./services/db");
var analytics = require("./controllers/analytics");
var meta = require("./controllers/meta");
var Meta = require("./models/meta");
// Replace mongoose's deprecated promise library (mpromise) with bluebird
var mongoose = require("mongoose");
mongoose.Promise = require("bluebird");
var request = require("request");
var cron = require("node-cron");
var { Client: PgClient } = require("pg");

var db = new Conn();
db.start();

var consoleLog = function (err, msg) {
  if (err) {
    console.log(err);
  }
  console.log(msg);
};

/**
 * Get the list of buckets from the master register
 *
 * @param {function} cb - Callback with response (buckets) that returns array
 * of buckets.
 */
var getBucketList = function (cb) {
  if (typeof config.oinRegisterUrl === "undefined") {
    cb(null, [{ type: "s3", bucket_name: config.oinBucket }]);
  } else {
    request.get(
      {
        json: true,
        uri: config.oinRegisterUrl,
      },
      function (err, res, remoteData) {
        if (err) {
          return cb(err);
        }

        if (res.statusCode !== 200) {
          return console.error("Unable to get register list.");
        }
        var buckets = _.map(remoteData.nodes, function (node) {
          return node.locations;
        });
        buckets = _.flatten(buckets);
        cb(null, buckets);
      }
    );
  }
};

/**
 * Runs the readBuckets tasks in parallel and save analytics data when done
 *
 * @param {Array} tasks - The array of bucket read functions to be run in parallel
 */
var readBuckets = function (tasks) {
  console.info("--- Started indexing all buckets ---");
  async.parallelLimit(
    tasks,
    4,
    // Results is an [[tasks]]
    function (err, results) {
      if (err) {
        return console.error(err);
      }
      results = _.flatten(results);
      results = results.map(function (task) {
        return async.retryable(task);
      });
      async.parallelLimit(results, 5, function (err, results) {
        if (err) {
          return console.error(err);
        }
        console.info("--- Finished indexing all buckets ---");
        // Get image, sensor, and provider counts and save to analytics collection
        return Promise.all([
          Meta.count(),
          Meta.distinct("properties.sensor"),
          Meta.distinct("provider"),
        ])
          .then(function (res) {
            var counts = {};
            counts.image_count = res[0];
            counts.sensor_count = res[1].length;
            counts.provider_count = res[2].length;
            analytics.addAnalyticsRecord(counts, function (err) {
              // Catch error in record addition
              if (err) {
                console.error(err);
              }
              console.info("--- Added new analytics record ---");
            });
            // Catch error in db query promises
          })
          .catch(function (err) {
            return console.error(err);
          });
      });
    }
  );
};

// Read bucket method for S3. It reads the S3 bucket and adds/updates *_metadata.json to Meta model
var readBucket = function (bucket, lastSystemUpdate, errCb, done) {
  console.info("--- Reading from bucket: " + bucket.bucket_name + " ---");

  let bucketDetails = {
    Bucket: bucket.bucket_name,
  };

  if (bucket.bucket_name === config.oinBucket) {
    bucketDetails.Prefix = config.oinBucketPrefix;
  }

  var s3 = new S3();
  s3.listObjects(bucketDetails, function (err, data) {
    if (err) {
      errCb(err);
      done(err);
      return;
    }
    var tasks = [];
    data.Contents.forEach(function (item) {
      if (item.Key.includes("_meta.json")) {
        // Get the last time the metadata file was modified so we can determine
        // if we need to update it.
        var lastModified = item.LastModified;
        var url = `https://${config.s3PublicDomain}/${bucket.bucket_name}/${item.Key}`;
        var task = function (done) {
          meta.addRemoteMeta(url, lastModified, lastSystemUpdate, done);
        };
        tasks.push(task);
      }
    });
    done(null, tasks);
  });
};

// The main function to get the registered buckets, read them and update metadata
var getListAndReadBuckets = function () {
  // Start off by getting the last time the system was updated.
  analytics.getLastUpdateTime(function (err, lastSystemUpdate) {
    if (err) {
      return console.error(err);
    }

    console.info("Last system update time:", lastSystemUpdate);
    getBucketList(function (err, buckets) {
      if (err) {
        return console.error(err.stack);
      }

      // Generate array of tasks to run in parallel
      var tasks = _.map(buckets, function (bucket) {
        return function (done) {
          if (bucket.type === "s3") {
            readBucket(bucket, lastSystemUpdate, consoleLog, done);
          } else {
            console.error("Unknown bucket type: " + bucket.type);
          }
        };
      });

      // Read the buckets and store metadata
      readBuckets(tasks);
    });
  });
};

// Kick it all off
cron.schedule(config.cronTime, function () {
  console.log("Running a catalog worker (cron time: " + config.cronTime + ")");
  getListAndReadBuckets();
});

const {
  PGHOST,
  PGPORT,
  PGUSER,
  PGPASSWORD,
  PGDATABASE,
  PG_CRON_TIME = "* * * * *",
} = process.env;

const isPgEnabled = [PGHOST, PGUSER, PGPASSWORD, PGDATABASE, PGPORT].every(
  Boolean
);

let pgConnection;
async function pgCreateConnection() {
  if (pgConnection) {
    return pgConnection;
  }

  const connection = new PgClient({
    connectionString: `postgres://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}`,
  });

  await connection.connect();

  pgConnection = connection;
  return pgConnection;
}

// This is a task scheduled by cron run that copies all images metadata from
// mongodb in postgres. It is required to run mosaic server that relies on
// postgres db with postgis extension.
if (isPgEnabled) {
  cron.schedule(PG_CRON_TIME, async function () {
    const records = await new Promise((resolve, reject) => {
      Meta.find({}, null, {}).exec((err, records) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(records);
      });
    });

    const pgConnection = await pgCreateConnection();

    const mosaicLayerId = config.oamMosacLayerId;

    try {
      await pgConnection.query("begin");

      await pgConnection.query(
        `delete from layers_features where layer_id = (select id from layers where public_id = '${mosaicLayerId}')`
      );

      // TODO: there should be a better way to do bulk insert
      const queryText = `insert into public.layers_features (feature_id, layer_id, properties, geom, last_updated, zoom) values ($1, (select id from layers where public_id = '${mosaicLayerId}'), $2, ST_Transform(ST_GeomFromGeoJSON($3), 4326), now(), 999)`;
      for (const record of records) {
        const queryValues = [
          record._id,
          JSON.stringify({
            ...record.properties,
            gsd: record.gsd,
            uuid: record.uuid,
          }),
          JSON.stringify(record.geojson),
        ];

        await pgConnection.query(queryText, queryValues);
      }

      await pgConnection.query("commit");
    } catch (err) {
      console.error(err);
      await pgConnection.query("rollback");
    }
  });
} else {
  console.warn(
    "The Postgres credentials not defined, skip mosaic index updating"
  );
}
