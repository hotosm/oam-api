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

#### page:

- format: `?page=number`
- example: `/meta?page=2`

#### limit:

default is `100`.

- format: `?limit=number`
- example: `/meta?limit=1000`

### Deployment
Changes to `master` branch are automatically deployed via Travis to https://oam-catalog.herokuapp.com.

