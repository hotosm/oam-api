#!/bin/bash

touch local.env && docker run -Pit --env-file=local.env --net=\"host\" -v $(pwd):/local oam-uploader-api $1
