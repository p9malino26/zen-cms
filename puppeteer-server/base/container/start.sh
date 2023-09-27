#!/bin/bash

set -x

echo "Starting..."
pwd

echo "Auto restart: $ZX_AUTO_RESTART"
while true ; do
  rm -f ./.shutdown-docker
  node $ZX_NODE_INSPECT ./app/puppeteer-server/index.js launch
  if [ -f ./.shutdown-docker ] ; then
    echo "Shutdown detected"
    exit 0
  fi
  
  if [[ "$ZX_AUTO_RESTART" != "true" ]] ; then
    break
  else
    sleep 2
  fi
done

