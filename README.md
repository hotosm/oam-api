# OAM Catalog [![Build Status](https://travis-ci.org/hotosm/oam-catalog.svg)](https://travis-ci.org/hotosm/oam-catalog) 

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

A catalog for OpenAerialMap imagery. The application indexes all metadata available within Open Imagery Network and creates an API to search and find imagery. The API powers the frontend search tool, OAM Browser. 

## Installation and Usage

The steps below will walk you through setting up your own instance of the oam-catalog.

### Install Project Dependencies

- [MongoDB](https://www.mongodb.org/)
- [Node.js](https://nodejs.org/)

### Install Application Dependencies

    $ npm install

### Usage

#### Starting the database:

    $ mongod

The database is responsible for storing metadata about the imagery and analytics.

#### Starting the API:

    $ node index.js

The API exposes endpoints used to access information form the system via a RESTful interface.

#### Starting the backgound worker:

    $ node worker.js

The worker process runs on a schedule and checks for new data, update database when it finds anything to add.

### Environment Variables

- `OAM_DEBUG` - Debug mode `true` or `false` (default)
- `AWS_SECRET_KEY_ID` - AWS secret key id for reading OIN buckets
- `AWS_SECRET_ACCESS_KEY` - AWS secret access key for reading OIN buckets
- `DBURI` - MongoDB connection url
- `SECRET_TOKEN` - The token used for post requests to `/tms` endpoint

## Endpoints and Parameters

More API documentation can be found at: [tbd]. 

### Available Endpoints

-  `/meta` -XGET
-  `/meta/add` -XPOST
-  `/tms` -XGET
-  `/tms` -XPOST
-  `/analytics` -XGET

### POST parameters for `/tms`:

To add/update `/tms` endpoint, the following JSON format should be used:

```json
{
    "uri": "http://example.com/tms_uri",
    "images": [
        {
            "uuid": "http://example.com/image_uri.tif"
        }
    ]
}
```
*Note that the `/tms` endpoint requires authenticated access.*

### Search parameters for `/meta`:

#### bbox:

- format: `?bbox=[lon_min],[lat_min],[lon_max],[lat_max]`
- example: `/meta?bbox=-66.15966796875,46.45678142812658,-65.63232421875,46.126556302418514`

#### title:

- format: `?title=string`
- example: `/meta?title=sometitle`


#### provider:

- format: `?provider=string`
- example: `/meta?provider=someprovider`

#### GSD (Resolution):

- format: `?gsd_from=value&gsd_to=value`
- example: `/meta?gsd_from=0.005&gsd_to=20`

*Note that gsd_from and gsd_to can be used on their own. Values should be provided in meters.*

#### has tiled service?:

- format: `?has_tiled`
- example: `/meta?has_tiled`

#### page:

- format: `?page=number`
- example: `/meta?page=2`

#### date:
- format: `?acquisition_from=date&acquisition_to=date`
- example: `/meta?acquisition_from=2015-04-10&acquisition_to=2015-05-01`

*Note that acquisition_from and acquisition_to can be used on their own.*

#### limit:

default is `100`.

- format: `?limit=number`
- example: `/meta?limit=1000`

#### sorting and ordering:

- format: `?order_by=property&sort=asc|desc`
- example: `/meta?order_by=acquisition_start&sort=asc`

*Note that `sort` and `order_by` are required together and one alone will not be recognized. Default is to show higher resolution and newer imagery first.*

### Docs Deployment
Changes to `master` branch are automatically deployed via Travis to https://oam-catalog.herokuapp.com.

##License
Oam Catalog is licensed under **BSD 3-Clause License**, see the [LICENSE](LICENSE) file for more details.
