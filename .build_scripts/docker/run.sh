#!/bin/bash

touch local.env
source local.env
PORT=${PORT:-3000}
docker run -it -p $PORT --env-file=local.env --net=\"host\" -v $(pwd):/local oam-uploader-api $1
