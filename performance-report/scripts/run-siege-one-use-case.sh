#!/bin/bash

BASE=/home/oam/oam-catalog-load-tests
STAMP=`date +"%Y-%m-%d %r"`
OUT=$BASE/tests.txt

if [ ! -f $OUT ]; then
  touch $OUT
fi

echo $STAMP\n 1>> $OUT 2>&1

for i in `seq 1 50`; do
  /usr/local/bin/siege -c 1 -r 1 -i -l -f $BASE/urls/oam-urls-2-explorer.txt 1>> $OUT 2>&1
done
