#!/bin/bash
set -e

# Note that these run on Browsersrtack and so need the BROWSERSTACK*
# credentials in the ENV.

pushd $HOME
git clone https://github.com/hotosm/oam-browser.git
cd oam-browser
git checkout $FRONTEND_VERSION
npm install
./test/integration/run.sh chrome
popd

