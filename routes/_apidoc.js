<<<<<<< HEAD
// -----------------------------------------------------------------------------
// Meta success return values
// -----------------------------------------------------------------------------
/**
 * @apiDefine metaSuccess
 * @apiSuccess {string}   _id            Unique internal ID
 * @apiSuccess {url}   uuid           Image source
 * @apiSuccess {string}   title           Name of image
 * @apiSuccess {string}   projection     Image projection information
 * @apiSuccess {string}   footprint      Image footprint
 * @apiSuccess {number}   gsd            Spatial resolution of image (in meters)
 * @apiSuccess {number}   file_size      File size of image (in bytes)
 * @apiSuccess {date}   acquisition_start  Start of image capture
 * @apiSuccess {date}   acquisition_end  End of image capture
 * @apiSuccess {string}   platform  Recording platform of image (UAV, satellite, etc)
 * @apiSuccess {string}   provider  Imagery provider
 * @apiSuccess {string}   contact  Imagery contact point
 * @apiSuccess {object}   properties  Optional metadata about the image
 * @apiSuccess {url}   meta_uri  URL of metadata information
 * @apiSuccess {string}   geojson  GeoJSON information for image
 * @apiSuccess {string}   bbox  Bounding box of image
 */

// -----------------------------------------------------------------------------
// Meta success example
// -----------------------------------------------------------------------------
/**
 * @apiDefine metaSuccessExample
 * @apiSuccessExample {json} Success Response:
 *      HTTP/1.1 200 OK
 *       {
 *       "_id": "556f7a49ac00a903002fb016",
 *       "uuid": "http://hotosm-oam.s3.amazonaws.com/2015-04-20_dar_river_merged_transparent_mosaic_group1.tif",
 *       "title": "2015-04-20_dar_river_merged_transparent_mosaic_group1.tif",
 *       "projection": "PROJCS[\"WGS84/UTMzone37S\",GEOGCS[\"WGS84\",DATUM[\"WGS_1984\",SPHEROID[\"WGS84\",6378137,298.257223563,AUTHORITY[\"EPSG\",\"7030\"]],AUTHORITY[\"EPSG\",\"6326\"]],PRIMEM[\"Greenwich\",0],UNIT[\"degree\",0.0174532925199433],AUTHORITY[\"EPSG\",\"4326\"]],PROJECTION[\"Transverse_Mercator\"],PARAMETER[\"latitude_of_origin\",0],PARAMETER[\"central_meridian\",39],PARAMETER[\"scale_factor\",0.9996],PARAMETER[\"false_easting\",500000],PARAMETER[\"false_northing\",10000000],UNIT[\"metre\",1,AUTHORITY[\"EPSG\",\"9001\"]],AUTHORITY[\"EPSG\",\"32737\"]]",
 *       "footprint": "POLYGON((39.24013333333333 -6.755633333333333,39.26116944444444 -6.755622222222223,39.261183333333335 -6.776669444444444,39.24014444444445 -6.776680555555555,39.24013333333333 -6.755633333333333))",
 *       "gsd": 0.04069,
 *       "file_size": 2121158626,
 *       "acquisition_start": "2015-04-20T00:00:00.000Z",
 *       "acquisition_end": "2015-04-21T00:00:00.000Z",
 *       "platform": "UAV",
 *       "provider": "",
 *       "contact": "",
 *       "properties": {
 *       "tms": "",
 *       "thumbnail": ""
 *       },
 *       "meta_uri": "",
 *       "geojson": {},
 *       "bbox": []
 *       }
 */

// -----------------------------------------------------------------------------
// TMS success return values
// -----------------------------------------------------------------------------
/**
 * @apiDefine tmsSuccess
 * @apiSuccess {string}   _id         Unique internal ID
 * @apiSuccess {uuid}     uri         TMS URI
 * @apiSuccess {object}   images      An array of images related to this TMS. Each item in the array includes _id and image uuid
 */

// -----------------------------------------------------------------------------
// TMS success example
// -----------------------------------------------------------------------------
/**
 * @apiDefine tmsSuccessExample
 * @apiSuccessExample {json} Success Response:
 *   HTTP/1.1 200 OK
 *   {
 *      "_id": "55b671ac2b67227a79b4f3fb",
 *      "uri": "http://a.tiles.mapbox.com/v4/droneadv.l8kc6bho/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZHJvbmVhZHYiLCJhIjoiYmU0ZXQtcyJ9.8Fh95YZQ_WdYEDlgtmH95A",
 *      "__v": 0,
 *      "images": [
 *        {
 *          "_id": "556f7a49ac00a903002fb01a",
 *          "uuid": "http://hotosm-oam.s3.amazonaws.com/2015-04-17_mburahati_bottomright.tif"
 *        }
 *      ]
 *   }
 */
||||||| merged common ancestors
=======
/**
 * @apiDefine Token API Token Authentication
 *  API token must be included either as an HTTP `Bearer: your-token` header or as a query
 *  parameter `?access_token=your-token`
 *  [Request a token](https://github.com/hotosm/oam-uploader).
 */

/**
 * @apiDefine uploadStatusSuccess
 * @apiSuccess {Object} results.uploader Uploader contact info
 * @apiSuccess {String} results.uploader.name
 * @apiSuccess {String} results.uploader.email
 * @apiSuccess {Object[]} results.scenes
 * @apiSuccess {Object} results.scenes.contact Contact person for this scene
 * @apiSuccess {String} results.scenes.contact.name
 * @apiSuccess {String} results.scenes.contact.email
 * @apiSuccess {String} results.scenes.title Scene title
 * @apiSuccess {String="satellite","aircraft","UAV","balloon","kite"} results.scenes.platform
 * @apiSuccess {String} results.scenes.provider Imagery provider
 * @apiSuccess {String} results.scenes.sensor Sensor/device
 * @apiSuccess {String} results.scenes.acquisition_start Date and time of imagery acquisition
 * @apiSuccess {String} results.scenes.acquisition_end Date and time of imagery acquisition
 * @apiSuccess {Object[]} results.scenes.images Array of images in this scene
 * @apiSuccess {String} results.scenes.images.url
 * @apiSuccess {String="initial","processing","finished","errored"} results.scenes.images.status
 * @apiSuccess {String} results.scenes.images.error
 * @apiSuccess {String[]} results.scenes.images.messages
 * @apiSuccess {String} results.scenes.images.startedAt Date and time the processing started
 * @apiSuccess {String} results.scenes.images.stoppedAt Date and time the processing stopped
 */
>>>>>>> oam-uploader-api-repo/develop
