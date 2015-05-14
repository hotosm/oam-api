# oam-catalog

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

### Endpoints

-  `/meta` -XGET
-  `/meta/add` -XPOST
-  `/providers` -XGET
-  `/providers/add` -XPOST

### Search parameters for `/meta`:

#### bbox:

- format: `?bbox=[lon_min],[lat_min],[lon_max],[lat_max]`
- example: `/meta?bbox=bbox=-66.15966796875,46.45678142812658,-65.63232421875,46.126556302418514`
