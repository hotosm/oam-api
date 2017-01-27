#!/bin/bash

# This script runs the docker container for this application, by:
#  - passing in the environment variables defined in local.env, if it exists
#  - overriding the above with any relevant variables in the current environment
#    (see config.js)
#  - exposing the $PORT (default: 3000), on which the app listens
#  - setting the container to use the host OS's networking stack (better
#    performance, worse isolation)
#  - mounting the current directory--which should be the project root--as
#    `/local`.
#
#  The intent of the last item is that the app can be setup (npm install) and
#  run directly from its location on the host OS, but using the container as its
#  environment to make dependency management trivial.

if [ -f local.env ] ; then
  ENVFILE="--env-file local.env"
else
  ENVFILE=""
fi

if [[ -t 0 || -p /dev/stdin ]] ; then
  echo "Running in tty mode."
  MODE=-it
else
  MODE=
fi

PORT=${PORT:-3000}

ARGS_LENGTH=$(($#-1))
ARGS=${@:1:$ARGS_LENGTH}
COMMAND=${@:$((ARGS_LENGTH+1)):1}

exec docker run $MODE --rm \
  -p $PORT \
  $ENVFILE \
  -e OAM_TEST \
  -e PORT \
  -e HOST \
  -e OIN_BUCKET \
  -e DBURI \
  -e DBURI_TEST \
  -e MAX_WORKERS \
  -e ADMIN_PASSWORD \
  -e ADMIN_USERNAME \
  -e AWS_SECRET_KEY_ID \
  -e AWS_SECRET_ACCESS_KEY \
  -e AWS_REGION \
  --net=\"host\" \
  -v $(pwd):/app \
  $ARGS \
  oam-uploader-api $COMMAND
