# oam-catalog [![Build Status](https://travis-ci.org/hotosm/oam-catalog.svg)](https://travis-ci.org/hotosm/oam-catalog)

This repo is in development and rapidly changing.

### Dependencies

- MongoDB

### Installation

    $ npm install

### Usage

Starting the API:

    $ node index.js

Starting the backgound worker:

    $ node worker.js

### Environment Variables

- `OR_DEBUG` - turn on debug mode
- `AWS_SECRET_KEY_ID` - set AWS secret key id
- `AWS_SECRET_ACCESS_KEY` - set AWS secret access key
- `DBURI` - set Mongo DB URI

### Endpoints

-  `/meta` -XGET
-  `/meta/add` -XPOST
-  `/providers` -XGET
-  `/providers/add` -XPOST

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

+#### GSD (Resolution):
+- format: `?gsd_from=value&gsd_to=value`
+- example: `/meta?gsd_from=0.005&gsd_to=20`
+
+*Note that gsd_from and gsd_to can be used on their own. Values should be provided in meters.*

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

### Deployment
Changes to `master` branch are automatically deployed via Travis to https://oam-catalog.herokuapp.com.

