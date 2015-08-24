#!/usr/bin/env bash

.build_scripts/docker/run.sh /install.sh
sudo stop oam-uploader-api
sudo start oam-uploader-api
