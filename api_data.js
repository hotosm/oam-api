define({ "api": [
  {
    "type": "get",
    "url": "/analytics",
    "title": "Platform metadata",
    "group": "Analytics",
    "description": "<p>Provides metadata about the catalog</p>",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "integer",
            "optional": false,
            "field": "count",
            "description": "<p>Number of unique images in catalog</p>"
          },
          {
            "group": "Success 200",
            "type": "integer",
            "optional": false,
            "field": "sensor_count",
            "description": "<p>Number of unique sensors in catalog</p>"
          },
          {
            "group": "Success 200",
            "type": "integer",
            "optional": false,
            "field": "provider_count",
            "description": "<p>Number of unique providers in catalog</p>"
          },
          {
            "group": "Success 200",
            "type": "date",
            "optional": false,
            "field": "date",
            "description": "<p>Date and time of data point</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success Response:",
          "content": "HTTP/1.1 200 OK\n[{\n \"date\": \"2015-07-17T18:49:22.452Z\",\n \"count\": 856,\n \"sensor_count\": 22,\n \"provider_count\": 43\n},\n{\n \"date\": \"2015-07-17T17:49:22.452Z\",\n \"count\": 856,\n \"sensor_count\": 22,\n \"provider_count\": 43\n}]",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "routes/analytics.js",
    "groupTitle": "Analytics",
    "name": "GetAnalytics"
  },
  {
    "type": "get",
    "url": "/meta",
    "title": "List all images' metadata",
    "group": "Meta",
    "description": "<p>Main endpoint to find data within the catalog</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "string",
            "optional": true,
            "field": "bbox",
            "description": "<p>Bounding box to search within. Format <code>?bbox=[lon_min],[lat_min],[lon_max],[lat_max]</code>.</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": true,
            "field": "title",
            "description": "<p>Limit results by <code>title</code>.</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": true,
            "field": "provider",
            "description": "<p>Limit results by <code>provider</code>.</p>"
          },
          {
            "group": "Parameter",
            "type": "number",
            "optional": true,
            "field": "gsd_from",
            "description": "<p>Find results greater than a certain resolution. Can be used independently of <code>gsd_to</code>.</p>"
          },
          {
            "group": "Parameter",
            "type": "number",
            "optional": true,
            "field": "gsd_to",
            "description": "<p>Find results with lower than a certain resolution. Can be used independently of <code>gsd_from</code>.</p>"
          },
          {
            "group": "Parameter",
            "type": "date",
            "optional": true,
            "field": "acquisition_from",
            "description": "<p>Show results after a certain date. Can be used independently of <code>acquisition_to</code>.</p>"
          },
          {
            "group": "Parameter",
            "type": "date",
            "optional": true,
            "field": "acquisition_to",
            "description": "<p>Show results before a certain date. Can be used independently of <code>acquisition_from</code>.</p>"
          },
          {
            "group": "Parameter",
            "type": "boolean",
            "optional": true,
            "field": "has_tiled",
            "description": "<p>Return only images with associated tiled images.</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": true,
            "field": "sort",
            "defaultValue": "desc",
            "description": "<p>The sort order, asc or desc. Must be used with <code>order_by</code>.</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": true,
            "field": "order_by",
            "defaultValue": "gsd",
            "description": "<p>&amp; date] Field to sort by. Must be used with <code>sort</code>.</p>"
          },
          {
            "group": "Parameter",
            "type": "number",
            "optional": true,
            "field": "limit",
            "defaultValue": "100",
            "description": "<p>Change the number of results returned, max is 100.</p>"
          },
          {
            "group": "Parameter",
            "type": "number",
            "optional": true,
            "field": "page",
            "defaultValue": "1",
            "description": "<p>Paginate through results.</p>"
          },
          {
            "group": "Parameter",
            "type": "number",
            "optional": true,
            "field": "skip",
            "description": "<p>Number of records to skip.</p>"
          }
        ]
      }
    },
    "examples": [
      {
        "title": "Simple example:",
        "content": "curl 'https://oam-catalog.herokuapp.com/meta?has_tiled&gsd_to=10'",
        "type": "curl"
      },
      {
        "title": "Using bbox:",
        "content": "curl 'https://oam-catalog.herokuapp.com/meta?bbox=-66.15966796875,46.45678142812658,-65.63232421875,46.126556302418514&gsd_from=20&acquisition_from=2014-01-01&limit=100'",
        "type": "curl"
      }
    ],
    "version": "0.0.0",
    "filename": "routes/meta.js",
    "groupTitle": "Meta",
    "name": "GetMeta",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "string",
            "optional": false,
            "field": "_id",
            "description": "<p>Unique internal ID</p>"
          },
          {
            "group": "Success 200",
            "type": "url",
            "optional": false,
            "field": "uuid",
            "description": "<p>Image source</p>"
          },
          {
            "group": "Success 200",
            "type": "string",
            "optional": false,
            "field": "title",
            "description": "<p>Name of image</p>"
          },
          {
            "group": "Success 200",
            "type": "string",
            "optional": false,
            "field": "projection",
            "description": "<p>Image projection information</p>"
          },
          {
            "group": "Success 200",
            "type": "string",
            "optional": false,
            "field": "footprint",
            "description": "<p>Image footprint</p>"
          },
          {
            "group": "Success 200",
            "type": "number",
            "optional": false,
            "field": "gsd",
            "description": "<p>Spatial resolution of image (in meters)</p>"
          },
          {
            "group": "Success 200",
            "type": "number",
            "optional": false,
            "field": "file_size",
            "description": "<p>File size of image (in bytes)</p>"
          },
          {
            "group": "Success 200",
            "type": "date",
            "optional": false,
            "field": "acquisition_start",
            "description": "<p>Start of image capture</p>"
          },
          {
            "group": "Success 200",
            "type": "date",
            "optional": false,
            "field": "acquisition_end",
            "description": "<p>End of image capture</p>"
          },
          {
            "group": "Success 200",
            "type": "string",
            "optional": false,
            "field": "platform",
            "description": "<p>Recording platform of image (UAV, satellite, etc)</p>"
          },
          {
            "group": "Success 200",
            "type": "string",
            "optional": false,
            "field": "provider",
            "description": "<p>Imagery provider</p>"
          },
          {
            "group": "Success 200",
            "type": "string",
            "optional": false,
            "field": "contact",
            "description": "<p>Imagery contact point</p>"
          },
          {
            "group": "Success 200",
            "type": "object",
            "optional": false,
            "field": "properties",
            "description": "<p>Optional metadata about the image</p>"
          },
          {
            "group": "Success 200",
            "type": "url",
            "optional": false,
            "field": "meta_uri",
            "description": "<p>URL of metadata information</p>"
          },
          {
            "group": "Success 200",
            "type": "string",
            "optional": false,
            "field": "geojson",
            "description": "<p>GeoJSON information for image</p>"
          },
          {
            "group": "Success 200",
            "type": "string",
            "optional": false,
            "field": "bbox",
            "description": "<p>Bounding box of image</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success Response:",
          "content": "HTTP/1.1 200 OK\n {\n \"_id\": \"556f7a49ac00a903002fb016\",\n \"uuid\": \"http://hotosm-oam.s3.amazonaws.com/2015-04-20_dar_river_merged_transparent_mosaic_group1.tif\",\n \"title\": \"2015-04-20_dar_river_merged_transparent_mosaic_group1.tif\",\n \"projection\": \"PROJCS[\\\"WGS84/UTMzone37S\\\",GEOGCS[\\\"WGS84\\\",DATUM[\\\"WGS_1984\\\",SPHEROID[\\\"WGS84\\\",6378137,298.257223563,AUTHORITY[\\\"EPSG\\\",\\\"7030\\\"]],AUTHORITY[\\\"EPSG\\\",\\\"6326\\\"]],PRIMEM[\\\"Greenwich\\\",0],UNIT[\\\"degree\\\",0.0174532925199433],AUTHORITY[\\\"EPSG\\\",\\\"4326\\\"]],PROJECTION[\\\"Transverse_Mercator\\\"],PARAMETER[\\\"latitude_of_origin\\\",0],PARAMETER[\\\"central_meridian\\\",39],PARAMETER[\\\"scale_factor\\\",0.9996],PARAMETER[\\\"false_easting\\\",500000],PARAMETER[\\\"false_northing\\\",10000000],UNIT[\\\"metre\\\",1,AUTHORITY[\\\"EPSG\\\",\\\"9001\\\"]],AUTHORITY[\\\"EPSG\\\",\\\"32737\\\"]]\",\n \"footprint\": \"POLYGON((39.24013333333333 -6.755633333333333,39.26116944444444 -6.755622222222223,39.261183333333335 -6.776669444444444,39.24014444444445 -6.776680555555555,39.24013333333333 -6.755633333333333))\",\n \"gsd\": 0.04069,\n \"file_size\": 2121158626,\n \"acquisition_start\": \"2015-04-20T00:00:00.000Z\",\n \"acquisition_end\": \"2015-04-21T00:00:00.000Z\",\n \"platform\": \"UAV\",\n \"provider\": \"\",\n \"contact\": \"\",\n \"properties\": {\n \"tms\": \"\",\n \"thumbnail\": \"\"\n },\n \"meta_uri\": \"\",\n \"geojson\": {},\n \"bbox\": []\n }",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "get",
    "url": "/meta/:id",
    "title": "Get an image's metadata",
    "group": "Meta",
    "description": "<p>Display data for an individual image</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "string",
            "optional": true,
            "field": "id",
            "description": "<p>The id of the image.</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "routes/meta.js",
    "groupTitle": "Meta",
    "name": "GetMetaId",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "string",
            "optional": false,
            "field": "_id",
            "description": "<p>Unique internal ID</p>"
          },
          {
            "group": "Success 200",
            "type": "url",
            "optional": false,
            "field": "uuid",
            "description": "<p>Image source</p>"
          },
          {
            "group": "Success 200",
            "type": "string",
            "optional": false,
            "field": "title",
            "description": "<p>Name of image</p>"
          },
          {
            "group": "Success 200",
            "type": "string",
            "optional": false,
            "field": "projection",
            "description": "<p>Image projection information</p>"
          },
          {
            "group": "Success 200",
            "type": "string",
            "optional": false,
            "field": "footprint",
            "description": "<p>Image footprint</p>"
          },
          {
            "group": "Success 200",
            "type": "number",
            "optional": false,
            "field": "gsd",
            "description": "<p>Spatial resolution of image (in meters)</p>"
          },
          {
            "group": "Success 200",
            "type": "number",
            "optional": false,
            "field": "file_size",
            "description": "<p>File size of image (in bytes)</p>"
          },
          {
            "group": "Success 200",
            "type": "date",
            "optional": false,
            "field": "acquisition_start",
            "description": "<p>Start of image capture</p>"
          },
          {
            "group": "Success 200",
            "type": "date",
            "optional": false,
            "field": "acquisition_end",
            "description": "<p>End of image capture</p>"
          },
          {
            "group": "Success 200",
            "type": "string",
            "optional": false,
            "field": "platform",
            "description": "<p>Recording platform of image (UAV, satellite, etc)</p>"
          },
          {
            "group": "Success 200",
            "type": "string",
            "optional": false,
            "field": "provider",
            "description": "<p>Imagery provider</p>"
          },
          {
            "group": "Success 200",
            "type": "string",
            "optional": false,
            "field": "contact",
            "description": "<p>Imagery contact point</p>"
          },
          {
            "group": "Success 200",
            "type": "object",
            "optional": false,
            "field": "properties",
            "description": "<p>Optional metadata about the image</p>"
          },
          {
            "group": "Success 200",
            "type": "url",
            "optional": false,
            "field": "meta_uri",
            "description": "<p>URL of metadata information</p>"
          },
          {
            "group": "Success 200",
            "type": "string",
            "optional": false,
            "field": "geojson",
            "description": "<p>GeoJSON information for image</p>"
          },
          {
            "group": "Success 200",
            "type": "string",
            "optional": false,
            "field": "bbox",
            "description": "<p>Bounding box of image</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success Response:",
          "content": "HTTP/1.1 200 OK\n {\n \"_id\": \"556f7a49ac00a903002fb016\",\n \"uuid\": \"http://hotosm-oam.s3.amazonaws.com/2015-04-20_dar_river_merged_transparent_mosaic_group1.tif\",\n \"title\": \"2015-04-20_dar_river_merged_transparent_mosaic_group1.tif\",\n \"projection\": \"PROJCS[\\\"WGS84/UTMzone37S\\\",GEOGCS[\\\"WGS84\\\",DATUM[\\\"WGS_1984\\\",SPHEROID[\\\"WGS84\\\",6378137,298.257223563,AUTHORITY[\\\"EPSG\\\",\\\"7030\\\"]],AUTHORITY[\\\"EPSG\\\",\\\"6326\\\"]],PRIMEM[\\\"Greenwich\\\",0],UNIT[\\\"degree\\\",0.0174532925199433],AUTHORITY[\\\"EPSG\\\",\\\"4326\\\"]],PROJECTION[\\\"Transverse_Mercator\\\"],PARAMETER[\\\"latitude_of_origin\\\",0],PARAMETER[\\\"central_meridian\\\",39],PARAMETER[\\\"scale_factor\\\",0.9996],PARAMETER[\\\"false_easting\\\",500000],PARAMETER[\\\"false_northing\\\",10000000],UNIT[\\\"metre\\\",1,AUTHORITY[\\\"EPSG\\\",\\\"9001\\\"]],AUTHORITY[\\\"EPSG\\\",\\\"32737\\\"]]\",\n \"footprint\": \"POLYGON((39.24013333333333 -6.755633333333333,39.26116944444444 -6.755622222222223,39.261183333333335 -6.776669444444444,39.24014444444445 -6.776680555555555,39.24013333333333 -6.755633333333333))\",\n \"gsd\": 0.04069,\n \"file_size\": 2121158626,\n \"acquisition_start\": \"2015-04-20T00:00:00.000Z\",\n \"acquisition_end\": \"2015-04-21T00:00:00.000Z\",\n \"platform\": \"UAV\",\n \"provider\": \"\",\n \"contact\": \"\",\n \"properties\": {\n \"tms\": \"\",\n \"thumbnail\": \"\"\n },\n \"meta_uri\": \"\",\n \"geojson\": {},\n \"bbox\": []\n }",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "post",
    "url": "/meta",
    "title": "Add an image metadata",
    "group": "Meta",
    "description": "<p>Add an image to the catalog. <strong>This is an authenticated endpoint.</strong></p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "string",
            "optional": true,
            "field": "uuid",
            "description": "<p>Location of image.</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": true,
            "field": "footprint",
            "description": "<p>GeoJSON footprint of image.</p>"
          },
          {
            "group": "Parameter",
            "type": "string",
            "optional": true,
            "field": "bbox",
            "description": "<p>Bounding box of image</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "statusCode",
            "description": "<p>The error code</p>"
          },
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "error",
            "description": "<p>Error name</p>"
          },
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "message",
            "description": "<p>Error message</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Error Response:",
          "content": "HTTP/1.1 400 Bad Request\n{\n \"statusCode\": 400,\n \"error\": \"Bad Request\",\n \"message\": \"Missing required data.\"\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "routes/meta.js",
    "groupTitle": "Meta",
    "name": "PostMeta",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "string",
            "optional": false,
            "field": "_id",
            "description": "<p>Unique internal ID</p>"
          },
          {
            "group": "Success 200",
            "type": "url",
            "optional": false,
            "field": "uuid",
            "description": "<p>Image source</p>"
          },
          {
            "group": "Success 200",
            "type": "string",
            "optional": false,
            "field": "title",
            "description": "<p>Name of image</p>"
          },
          {
            "group": "Success 200",
            "type": "string",
            "optional": false,
            "field": "projection",
            "description": "<p>Image projection information</p>"
          },
          {
            "group": "Success 200",
            "type": "string",
            "optional": false,
            "field": "footprint",
            "description": "<p>Image footprint</p>"
          },
          {
            "group": "Success 200",
            "type": "number",
            "optional": false,
            "field": "gsd",
            "description": "<p>Spatial resolution of image (in meters)</p>"
          },
          {
            "group": "Success 200",
            "type": "number",
            "optional": false,
            "field": "file_size",
            "description": "<p>File size of image (in bytes)</p>"
          },
          {
            "group": "Success 200",
            "type": "date",
            "optional": false,
            "field": "acquisition_start",
            "description": "<p>Start of image capture</p>"
          },
          {
            "group": "Success 200",
            "type": "date",
            "optional": false,
            "field": "acquisition_end",
            "description": "<p>End of image capture</p>"
          },
          {
            "group": "Success 200",
            "type": "string",
            "optional": false,
            "field": "platform",
            "description": "<p>Recording platform of image (UAV, satellite, etc)</p>"
          },
          {
            "group": "Success 200",
            "type": "string",
            "optional": false,
            "field": "provider",
            "description": "<p>Imagery provider</p>"
          },
          {
            "group": "Success 200",
            "type": "string",
            "optional": false,
            "field": "contact",
            "description": "<p>Imagery contact point</p>"
          },
          {
            "group": "Success 200",
            "type": "object",
            "optional": false,
            "field": "properties",
            "description": "<p>Optional metadata about the image</p>"
          },
          {
            "group": "Success 200",
            "type": "url",
            "optional": false,
            "field": "meta_uri",
            "description": "<p>URL of metadata information</p>"
          },
          {
            "group": "Success 200",
            "type": "string",
            "optional": false,
            "field": "geojson",
            "description": "<p>GeoJSON information for image</p>"
          },
          {
            "group": "Success 200",
            "type": "string",
            "optional": false,
            "field": "bbox",
            "description": "<p>Bounding box of image</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success Response:",
          "content": "HTTP/1.1 200 OK\n {\n \"_id\": \"556f7a49ac00a903002fb016\",\n \"uuid\": \"http://hotosm-oam.s3.amazonaws.com/2015-04-20_dar_river_merged_transparent_mosaic_group1.tif\",\n \"title\": \"2015-04-20_dar_river_merged_transparent_mosaic_group1.tif\",\n \"projection\": \"PROJCS[\\\"WGS84/UTMzone37S\\\",GEOGCS[\\\"WGS84\\\",DATUM[\\\"WGS_1984\\\",SPHEROID[\\\"WGS84\\\",6378137,298.257223563,AUTHORITY[\\\"EPSG\\\",\\\"7030\\\"]],AUTHORITY[\\\"EPSG\\\",\\\"6326\\\"]],PRIMEM[\\\"Greenwich\\\",0],UNIT[\\\"degree\\\",0.0174532925199433],AUTHORITY[\\\"EPSG\\\",\\\"4326\\\"]],PROJECTION[\\\"Transverse_Mercator\\\"],PARAMETER[\\\"latitude_of_origin\\\",0],PARAMETER[\\\"central_meridian\\\",39],PARAMETER[\\\"scale_factor\\\",0.9996],PARAMETER[\\\"false_easting\\\",500000],PARAMETER[\\\"false_northing\\\",10000000],UNIT[\\\"metre\\\",1,AUTHORITY[\\\"EPSG\\\",\\\"9001\\\"]],AUTHORITY[\\\"EPSG\\\",\\\"32737\\\"]]\",\n \"footprint\": \"POLYGON((39.24013333333333 -6.755633333333333,39.26116944444444 -6.755622222222223,39.261183333333335 -6.776669444444444,39.24014444444445 -6.776680555555555,39.24013333333333 -6.755633333333333))\",\n \"gsd\": 0.04069,\n \"file_size\": 2121158626,\n \"acquisition_start\": \"2015-04-20T00:00:00.000Z\",\n \"acquisition_end\": \"2015-04-21T00:00:00.000Z\",\n \"platform\": \"UAV\",\n \"provider\": \"\",\n \"contact\": \"\",\n \"properties\": {\n \"tms\": \"\",\n \"thumbnail\": \"\"\n },\n \"meta_uri\": \"\",\n \"geojson\": {},\n \"bbox\": []\n }",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "get",
    "url": "/tms",
    "title": "List all TMS endpoints",
    "group": "TMS",
    "description": "<p>Main endpoint to list TMS endpoints</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "string",
            "optional": true,
            "field": "uri",
            "description": "<p>search for a particular TMS URI</p>"
          }
        ]
      }
    },
    "examples": [
      {
        "title": "Simple example:",
        "content": "curl 'https://oam-catalog.herokuapp.com/tms'",
        "type": "curl"
      }
    ],
    "version": "0.0.0",
    "filename": "routes/tms.js",
    "groupTitle": "TMS",
    "name": "GetTms",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "string",
            "optional": false,
            "field": "_id",
            "description": "<p>Unique internal ID</p>"
          },
          {
            "group": "Success 200",
            "type": "uuid",
            "optional": false,
            "field": "uri",
            "description": "<p>TMS URI</p>"
          },
          {
            "group": "Success 200",
            "type": "object",
            "optional": false,
            "field": "images",
            "description": "<p>An array of images related to this TMS. Each item in the array includes _id and image uuid</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success Response:",
          "content": "HTTP/1.1 200 OK\n{\n   \"_id\": \"55b671ac2b67227a79b4f3fb\",\n   \"uri\": \"http://a.tiles.mapbox.com/v4/droneadv.l8kc6bho/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZHJvbmVhZHYiLCJhIjoiYmU0ZXQtcyJ9.8Fh95YZQ_WdYEDlgtmH95A\",\n   \"__v\": 0,\n   \"images\": [\n     {\n       \"_id\": \"556f7a49ac00a903002fb01a\",\n       \"uuid\": \"http://hotosm-oam.s3.amazonaws.com/2015-04-17_mburahati_bottomright.tif\"\n     }\n   ]\n}",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "post",
    "url": "/tms",
    "title": "Add a TMS",
    "group": "TMS",
    "description": "<p>Add a TMS (Tiled Map Service) endpoint to the catalog. <strong>This is an authenticated endpoint.</strong></p>",
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "string",
            "optional": true,
            "field": "Authorization",
            "description": "<p>Bearer Token for authentication</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Request-Example:",
          "content": "{ \"Authorization\": \"Bearer token\" }",
          "type": "json"
        }
      ]
    },
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "string",
            "optional": true,
            "field": "uri",
            "description": "<p>TMS' URI. Must be unique. If a TMS with the same URI has been added before, the TMS' info will be updated</p>"
          },
          {
            "group": "Parameter",
            "type": "object",
            "optional": true,
            "field": "images",
            "description": "<p>An array containing the URIs to images included in the TMS.</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "statusCode",
            "description": "<p>The error code</p>"
          },
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "error",
            "description": "<p>Error name</p>"
          },
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "message",
            "description": "<p>Error message</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Error Response:",
          "content": "HTTP/1.1 400 Bad Request\n{\n \"statusCode\": 400,\n \"error\": \"Bad Request\",\n \"message\": \"There is an Error. Fields missing.\"\n}",
          "type": "json"
        }
      ]
    },
    "examples": [
      {
        "title": "Simple example:",
        "content": "curl 'https://oam-catalog.herokuapp.com/tms' -X POST \\\n -H 'Authorization: Bearer token' \\\n -H 'Content-Type: application/json' \\\n -d \\\n '{\n   \"uri\": \"http://a.tiles.mapbox.com/v4/droneadv.l8kc6bho/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZHJvbmVhZHYiLCJhIjoiYmU0ZXQtcyJ9.8Fh95YZQ_WdYEDlgtmH95A\",\n   \"images\": [{\"uuid\": \"http://hotosm-oam.s3.amazonaws.com/2015-04-17_mburahati_bottomright.tif\"}]\n }'",
        "type": "curl"
      }
    ],
    "version": "0.0.0",
    "filename": "routes/tms.js",
    "groupTitle": "TMS",
    "name": "PostTms",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "string",
            "optional": false,
            "field": "_id",
            "description": "<p>Unique internal ID</p>"
          },
          {
            "group": "Success 200",
            "type": "uuid",
            "optional": false,
            "field": "uri",
            "description": "<p>TMS URI</p>"
          },
          {
            "group": "Success 200",
            "type": "object",
            "optional": false,
            "field": "images",
            "description": "<p>An array of images related to this TMS. Each item in the array includes _id and image uuid</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success Response:",
          "content": "HTTP/1.1 200 OK\n{\n   \"_id\": \"55b671ac2b67227a79b4f3fb\",\n   \"uri\": \"http://a.tiles.mapbox.com/v4/droneadv.l8kc6bho/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZHJvbmVhZHYiLCJhIjoiYmU0ZXQtcyJ9.8Fh95YZQ_WdYEDlgtmH95A\",\n   \"__v\": 0,\n   \"images\": [\n     {\n       \"_id\": \"556f7a49ac00a903002fb01a\",\n       \"uuid\": \"http://hotosm-oam.s3.amazonaws.com/2015-04-17_mburahati_bottomright.tif\"\n     }\n   ]\n}",
          "type": "json"
        }
      ]
    }
  }
] });
