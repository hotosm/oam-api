# OAM Uploader API [![Build Status](https://travis-ci.org/hotosm/oam-uploader-api.svg)](https://travis-ci.org/hotosm/oam-uploader-api) 

## [API Docs](http://hotosm.github.io/oam-uploader-api/)

## Installation and Usage

The steps below will walk you through setting up your own instance of the oam-uploader-api.

### Install Project Dependencies

- [MongoDB](https://www.mongodb.org/)
- [Node.js](https://nodejs.org/)
- [libvips](https://github.com/jcupitt/libvips)

### Install Application Dependencies

    $ npm install

### Usage

#### Starting the API:

    $ node index.js

The API exposes endpoints used to access information form the system via a RESTful interface.

### Environment Variables

- `OIN_BUCKET` - The OIN bucket that will receive the uploads
- `AWS_REGION` - AWS region of OIN_BUCKET
- `AWS_SECRET_KEY_ID` - AWS secret key id for reading OIN bucket
- `AWS_SECRET_ACCESS_KEY` - AWS secret access key for reading OIN bucket
- `ADMIN_USERNAME` - Token management Admin username
- `ADMIN_PASSWORD` - Token management Admin password
- `DBURI` - MongoDB connection url
- `DBURI_TEST` - MongoDB connection to the test database (not needed for
  production)

### Install via Docker

Alternatively, if you've got a mongo instance running elsewhere, install and
run on a fresh instance using docker as follows:

[Install Docker](https://docs.docker.com/installation/)

```sh
# install nvm and node
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.26.0/install.sh | bash && source ~/.nvm/nvm.sh
nvm install 0.12

# clone the repo
git clone https://github.com/hotosm/oam-uploader-api

# build the docker image
cd oam-uploader-api
npm run build-docker

# set up environment vars:
cp local.sample.env local.env
nano local.env
```

Now, for each deployment:

```sh
npm run docker-install && npm run docker-start
```

### Docs Deployment
Changes to `master` branch are automatically deployed via Travis to https://oam-uploader-api.herokuapp.com.
