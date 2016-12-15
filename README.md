<h1 align="center">OAM Uploader API
  <a href="https://travis-ci.org/hotosm/oam-uploader-api">
    <img src="https://travis-ci.org/hotosm/oam-uploader-api.svg" alt="Build Status"></img>
  </a></h1>

<div align="center">
  <h3>
  <a href="https://docs.openaerialmap.org/ecosystem/getting-started">Ecosystem</a>
  <span> | </span>
  <a href="http://hotosm.github.io/oam-uploader-api/">API Docs</a>
  <span> | </span>
  <a href="https://github.com/hotosm/oam-uploader">Uploader Interface</a>
  <span> | </span>
  <a href="https://github.com/hotosm/oam-uploader-admin">Token Manager</a>
  </h3>
</div>

The Uploader API powers the [Uploader Interface](https://github.com/hotosm/oam-uploader) by issuing authentication tokens and receiving imagery uploads. Before proceeding, we suggest you read the ecosystem docs.

## Installation and Usage

The steps below will walk you through setting up your own instance of the oam-uploader-api.

### Install Project Dependencies

- [MongoDB](https://www.mongodb.org/)
- [Node.js](https://nodejs.org/) v0.12
- [libvips](https://github.com/jcupitt/libvips) (Make sure to read the instructions specific to your OS)
- [gdal](http://www.sarasafavi.com/installing-gdalogr-on-ubuntu.html)

Using [homebrew](http://brew.sh/), you can install MongoDB and `libvips` using:

    $ brew bundle

### Install Application Dependencies

If you use [`nvm`](https://github.com/creationix/nvm), activate the desired Node version:

```
nvm install
```

Install Node modules:

```
npm install
```

### Usage
You need to set environment variables before starting the API. We suggest you copy `local.sample.env` to `local.env` and modify it. Before starting the API you can run `source local.env` to export the environment variables to the shell.

#### Environment Variables

- `PORT` - the port to listen on
- `OIN_BUCKET` - The OIN bucket that will receive the uploads
- `AWS_REGION` - AWS region of OIN_BUCKET
- `AWS_SECRET_KEY_ID` - AWS secret key id for reading OIN bucket
- `AWS_SECRET_ACCESS_KEY` - AWS secret access key for reading OIN bucket
- `ADMIN_USERNAME` - Token management Admin username
- `ADMIN_PASSWORD` - Token management Admin password
- `DBURI` - MongoDB connection url
- `DBURI_TEST` - MongoDB connection to the test database (not needed for
    production)
- `SENDGRID_API_KEY` - sendgrid API key, for sending notification emails
- `SENDGRID_FROM` - email address from which to send notification emails

#### Starting the API:

```
npm start
```

The API exposes endpoints used to access information form the system via a RESTful interface.

### Install via Docker

Alternatively, if you've got a mongo instance running elsewhere, install and
run on a fresh instance using docker as follows:

[Install Docker](https://docs.docker.com/installation/)

One-time setup:

```sh
# clone the repo
git clone https://github.com/hotosm/oam-uploader-api

# build the docker image
cd oam-uploader-api
docker build -t oam-uploader-api .build_scripts/docker

# set up environment vars:
cp local.sample.env local.env
nano local.env
```

To start up the API server after pulling from the repo:

```sh
# install node dependencies
.build_scripts/docker/run.sh /install.sh
# start server
.build_scripts/docker/run.sh /start.sh
```

# Deployment

To automate some of the above on a remote, you can use
[visionmedia/deploy](https://github.com/visionmedia/deploy) and upstart for
deployment and process management.

First, add a new section to
https://github.com/hotosm/oam-uploader-api/blob/develop/.build_scripts/deploy.conf.
(If you don't want to commit it to the repo, you can just make your own copy of the
config file wherever you want.) Make sure you have ssh creds to the server from
wherever you're running `deploy`. Then do the following, with `ENV` replaced with
whatever you called the section you added to `deploy.conf`.

```sh
deploy -c .build_scripts/deploy.conf ENV setup
```

Now ssh into the server with `deploy -c .build_scripts/deploy.conf ENV console`,
and set up the upstart script and start up the server

```sh
sudo cp .build_scripts/upstart.conf /etc/init/oam-uploader-api.conf
sudo nano /etc/init/oam-uplodaer-api.conf
sudo start oam-uploader-api
exit
```

Now you can use `deploy -c .build_scripts/deploy.conf ENV` at any time to
deploy your local branch.

## License
Oam Uploader Api is licensed under **BSD 3-Clause License**, see the [LICENSE](LICENSE) file for more details.

