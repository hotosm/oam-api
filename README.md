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

Search parameters for `/meta`:

- start_date
- end_date
- resolution
- sort_by_date
- pagination
- provider
- bbox
- footprint
