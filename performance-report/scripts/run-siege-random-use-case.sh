#!/bin/bash

BASE=/home/oam/oam-catalog-load-tests
STAMP=`date +"%Y-%m-%d %r"`
OUT=$BASE/tests.txt
FILES=($BASE/urls/*)

if [ ! -f $OUT ]; then
  touch $OUT
fi

echo $STAMP 1>> $OUT 2>&1

for i in `seq 1 3`; do
  URLS=`printf "%s\n" "${FILES[RANDOM % ${#FILES[@]}]}"`
  CONCURRENT=`jot -r 1 1 5`
  REQUESTS=`jot -r 1 1 10`
  echo $URLS 1>> $OUT 2>&1
  /usr/local/bin/siege -c $CONCURRENT -r $REQUESTS -i -l -f $URLS 1>> $OUT 2>&1
done
