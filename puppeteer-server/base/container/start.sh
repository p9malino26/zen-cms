#!/bin/bash

set -x

echo "Starting..."
pwd

echo "Auto restart: $ZX_AUTO_RESTART"
while true ; do
  # Make sure there is no artifact left over
  rm -f ./.shutdown-docker

  # Add hooks
  . ./pre-start-hook.sh 2>&1 | tee -a ./console.log

  # Run the web server; this shouldnt crash, but if it does, we restart it
  node $ZX_NODE_INSPECT ./app/puppeteer-server/index.js launch 2>&1 | tee -a ./console.log
  if [ -f ./.shutdown-docker ] ; then
    echo "Shutdown detected" >> ./console.log
    exit 0
  fi

  if [[ "$ZX_AUTO_RESTART" != "true" ]] ; then
    break
  else
    sleep 2
  fi
done

