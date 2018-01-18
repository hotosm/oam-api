<h1 align="center">OAM Catalog API
  <a href="https://travis-ci.org/hotosm/oam-catalog">
    <img src="https://api.travis-ci.org/hotosm/oam-catalog.svg?branch=develop" alt="Build Status"></img>
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

A catalog and processor for OpenAerialMap imagery. The application indexes all metadata available within Open Imagery Network and creates an API to search and find imagery. It also takes imagery from users and converts to a format and places it in the Open Imagery Network. The API powers the frontend search tool, [OAM Imagery Browser](https://github.com/hotosm/oam-browser). Read the [ecosystem documentation](https://docs.openaerialmap.org/ecosystem/getting-started/) for more information about OpenAerialMap.

Full details of the API endpoints is available at: https://hotosm.github.io/oam-catalog

## Installation

First you will need to have [MongoDB](https://www.mongodb.org/) and [Node.js](https://nodejs.org/) on your machine.

Then you will need to install the applications node module dependencies:

```
npm install
```

## Usage

The API can be started with: `node index.js`

And the background OIN indexer can be run with: `node catalog-worker.js`

## Development Using Docker

To start a self-contained development instance using Docker Compose, run:

```bash
docker-compose up
```

This will download Docker image dependencies and install code for this project into a set of containers.

Once it has started, connect to `http://localhost:4000` to access the API.

The MongoDB command line interface can be run within its container like so: `docker-compose exec mongo mongo`

The following environment variables should be set (probably in `.env`; see `sample.env` for defaults and additional information):

```bash
# AWS credentials for writing to S3
AWS_ACCESS_KEY_ID=<redacted>
AWS_SECRET_ACCESS_KEY=<redacted>
AWS_REGION=us-east-1

# Social login
FACEBOOK_APP_ID=<redacted>
FACEBOOK_APP_SECRET=<redacted>
GOOGLE_CLIENT_ID=<redacted>
GOOGLE_CLIENT_SECRET=<redacted>

# S3 resources
OIN_BUCKET=<redacted>
OIN_BUCKET_PREFIX=<optional>
UPLOAD_BUCKET=<redacted>

# JWT Secret Key
JWT_SECRET_KEY=<redacted>
```

If Docker does not bind / forward ports to `localhost`, set `HOST_TLD` to the Docker hostname and use that to access the API.

To specify a bucket for indexing, modify `test/fixtures/oin-buckets.json`.

Instructions for generating the JWT signing key can be found [here](https://github.com/dwyl/hapi-auth-jwt2#generating-your-secret-key).
If you find that additional environment variables are needed, please submit a pull request!

## Testing

There are 3 test suites:

**Unit-like tests**, under `test/specs`    
These should be isolated and fast, with as much mocking/stubbing as possible, suitable for TDD. Run with: `mocha test/specs`

**Integration tests**, under `test/integration`    
These test the actual interaction of the API against real imagery uploads to Amazon S3. You will need AWS credendtials in your `.env` and, in order to use the imagery processing binaries, a running instance of the Docker image for this repo. There is a customised Docker Compose config at `test/docker-compose.yml` which already has all the necessary and useful changes to run on a local developer machine (such as mounting the live codebase into the running container). It can be run with `docker-compose -f test/docker-compose.yml up`. The actual tests can be run with `mocha test/integration`.

**End-to-end browser tests**, see https://github.com/hotosm/oam-browser    
The frontend code is pinned against a specific version of this API, so it is necessary to ensure that this pinning is still reliable and also, if the version here is bumped, to note if that new version is compatible (if not then the frontend will need updating). These tests require the frontend code itself, generally you will not need to run them locally, they will be run by Travis on every commit to Github.

## Transcoding using AWS Batch

[AWS Batch](https://aws.amazon.com/batch/) can be used for transcoding; this enables use of elastic resources to process large quantities of imagery without requiring the API to run on an instance scaled for imagery ingestion. To enable it, set the following environment variables:

```bash
USE_BATCH=true
# Job Definition name
AWS_BATCH_JD_NAME=oam-transcode
# Job Queue name
AWS_BATCH_JQ_NAME=oam-transcoding
```

Configuring Batch is out of scope for this document, although a sample job definition looks like this:

```json
{
    "jobDefinitionName": "oam-transcode",
    "type": "container",
    "parameters": {},
    "retryStrategy": {
        "attempts": 2
    },
    "containerProperties": {
        "image": "quay.io/mojodna/marblecutter-tools",
        "vcpus": 1,
        "memory": 3000,
        "command": [
            "process.sh",
            "Ref::input",
            "Ref::output",
            "Ref::callback_url"
        ],
        "jobRoleArn": "arn:aws:iam::<redacted>:role/oam-transcoder",
        "volumes": [],
        "environment": [
            {
                "name": "EFS_HOST",
                "value": "<redacted>.efs.us-east-1.amazonaws.com"
            }
        ],
        "mountPoints": [],
        "privileged": true,
        "ulimits": []
    }
}
```

In this sample, an [Amazon Elastic File System (EFS)](https://aws.amazon.com/efs/) volume is mapped into the container through the `EFS_HOST` environment variable. This allows Batch jobs to handle imagery that outstrips available temporary storage on underlying instances (22GB at this writing, shared between all running tasks). If you expect to transcode smaller imagery (or don't need to support concurrent large uploads), this can be omitted.

The `oam-transcoder` role needs to have been created ahead of time with appropriate access to both the upload (`UPLOAD_BUCKET`) and storage (`OIN_BUCKET`) buckets.

The user / role used when running the API itself (typically an instance role if running on AWS) requires permission to submit Batch jobs, specified as:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "batch:SubmitJob"
            ],
            "Resource": "*"
        }
    ]
}
```

## Contributing

Contributions are very welcome. Please see [CONTRIBUTING.md](./CONTRIBUTING.md).

## License
OAM Browser is licensed under **BSD 3-Clause License**, see the [LICENSE](LICENSE) file for more details.
