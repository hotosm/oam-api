#!/bin/bash

# Run the tests inside docker.
# Assumes that the base directory of this repo has been mounted as /local, e.g.:
# docker run -Pit -v $(pwd):/local oam-uploader-api /local/.build_scripts/docker/start.sh

cd /local
source $NVM_DIR/nvm.sh
npm install
