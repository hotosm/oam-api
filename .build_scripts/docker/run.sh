#!/bin/bash

# This script runs the docker container for this application, by:
#  - passing in the environment variables defined in `local.env` (creating an
#    empty one if necessary)
#  - exposing the $PORT (default: 3000), on which the app listens
#  - setting the container to use the host OS's networking stack (better
#    performance, worse isolation)
#  - mounting the current directory--which should be the project root--as
#    `/local`.
#
#  The intent of the last item is that the app can be setup (npm install) and
#  run directly from its location on the host OS, but using the container as its
#  environment to make dependency management trivial.

touch local.env
source local.env
PORT=${PORT:-3000}
docker run -it -p $PORT --env-file=local.env --net=\"host\" -v $(pwd):/local oam-uploader-api $1
