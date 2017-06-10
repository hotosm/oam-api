<h1 align="center">OAM Catalog API
  <a href="https://travis-ci.org/hotosm/oam-catalog">
    <img src="https://api.travis-ci.org/hotosm/oam-catalog.svg?branch=master" alt="Build Status"></img>
  </a></h1>

<div align="center">
  <h3>
  <a href="https://docs.openaerialmap.org/ecosystem/getting-started/">Ecosystem</a>
  <span> | </span>
  <a href="https://github.com/hotosm/oam-browser">Imagery Browser</a>
  <span> | </span>
  <a href="https://github.com/hotosm/openaerialmap.org">OAM Homepage</a>
  </h3>
</div>

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

A catalog for OpenAerialMap imagery. The application indexes all metadata available within Open Imagery Network and creates an API to search and find imagery. The API powers the frontend search tool, OAM Imagery Browser. Read the [ecosystem documentation](https://docs.openaerialmap.org/ecosystem/getting-started/) for more information about OpenAerialMap.

## Installation and Usage

The steps below will walk you through setting up your own instance of the oam-catalog.

### Install Project Dependencies

- [MongoDB](https://www.mongodb.org/)
- [Node.js](https://nodejs.org/)

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

#### Starting the API:

```
node index.js
```

#### Starting the background worker:

```
node worker.js
```

The worker currently has 2 main functions: polling buckets for new imagery and processing uploads.

### API Documentation

See: https://hotosm.github.io/oam-catalog/

