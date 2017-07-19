#!/bin/bash
set -e

cp .env.sample .env

# docker-compose gives precedence to values in .env, so remove these empty values
# so that the ENV values can take their place.
sed -i '/AWS_ACCESS/d' .env
sed -i '/AWS_SECRET/d' .env
sed -i '/FACEBOOK_APP_ID/d' .env
sed -i '/FACEBOOK_APP_SECRET/d' .env

# Namespace the bucket, otherwise builds will find imagery from previous
# test runs.
sed -i '/OIN_BUCKET_PREFIX/d' .env
echo "OIN_BUCKET_PREFIX=$TRAVIS_BUILD_NUMBER" >> .env

echo "OAM_DEBUG=true" >> .env
