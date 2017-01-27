#!/usr/bin/env bash
set -e # halt script on error
if [ $TRAVIS_PULL_REQUEST = "false" ] && [ $TRAVIS_BRANCH = ${PRODUCTION_BRANCH} ]; then
	echo "Get ready, we're pushing to gh-pages!"
	npm run docs
	cd docs
	git init
	git config user.name "Travis-CI"
	git config user.email "travis@somewhere.com"
	git add .
	git commit -m "CI deploy to gh-pages"
	git push --force --quiet "https://${GH_TOKEN}@github.com/${TRAVIS_REPO_SLUG}.git" master:gh-pages > /dev/null 2>&1
	echo "Good to go!"
else
	echo "Not a publishable branch so we're all done here"
if