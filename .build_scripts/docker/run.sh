#!/bin/bash

touch local.env && source local.env && docker run -it -p $PORT --env-file=local.env --net=\"host\" -v $(pwd):/local oam-uploader-api $1
