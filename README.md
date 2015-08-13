# OAM Uploader API [![Build Status](https://travis-ci.org/hotosm/oam-uploader-api.svg)](https://travis-ci.org/hotosm/oam-uploader-api) 

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

## [API Docs](http://hotosm.github.io/oam-uploader-api/)

## Installation and Usage

The steps below will walk you through setting up your own instance of the oam-uploader-api.

### Install Project Dependencies

- [MongoDB](https://www.mongodb.org/)
- [Node.js](https://nodejs.org/)
- [GraphicsMagick](http://www.graphicsmagick.org/) (**NOTE:** must be installed with libtiff support.)

### Install Application Dependencies

    $ npm install

### Usage

#### Starting the database:

    $ mongod

The database is responsible for storing metadata about the imagery and analytics.

#### Starting the API:

    $ node index.js

The API exposes endpoints used to access information form the system via a RESTful interface.

### Environment Variables

- `OIN_BUCKET` - The OIN bucket that will receive the uploads
- `AWS_REGION` - AWS region of OIN_BUCKET
- `AWS_SECRET_KEY_ID` - AWS secret key id for reading OIN bucket
- `AWS_SECRET_ACCESS_KEY` - AWS secret access key for reading OIN bucket
- `DBURI` - MongoDB connection url
- `ADMIN_USERNAME` - Token management Admin username
- `ADMIN_PASSWORD` - Token management Admin password

### Docs Deployment
Changes to `master` branch are automatically deployed via Travis to https://oam-uploader-api.herokuapp.com.
