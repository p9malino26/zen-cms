#!/bin/bash

set -x

echo "Starting..."
pwd

echo "Auto restart: $ZX_AUTO_RESTART"

HOME=/home/pptruser

function runNode() {
  cd $HOME/app
  if [[ ! -d node_modules ]] ; then
    npm i
  fi
  node $ZX_NODE_INSPECT $@ 2>&1 | tee -a ./console.log
}

function __run_puppeteer() {
  # Make sure there is no artifact left over
  rm -f $HOME/.shutdown-docker

  # Add hooks
  . $HOME/bin/pre-start-hook.sh 2>&1 | tee -a ./console.log

  # Run the web server; this shouldnt crash, but if it does, we restart it
  runNode ./runtime/puppeteer-server/index.js launch
  if [ -f $HOME/.shutdown-docker ] ; then
    echo "Shutdown detected" >> ./console.log
    exit 0
  fi
}

function __run_worker() {
  # Add hooks
  . $HOME/bin/pre-start-hook.sh 2>&1 | tee -a ./console.log

  # Run the node worker
  runNode $ZX_NODE_ARGS
}

while true ; do
  if [[ "$ZX_MODE" == "puppeteer" ]] ; then
    __run_puppeteer
  elif [[ "$ZX_MODE" == "worker" ]] ; then
    __run_worker
  else
    echo "Unknown mode: $ZX_MODE - starting bash"
    bash
  fi

  if [[ "$ZX_AUTO_RESTART" != "true" ]] ; then
    break
  else
    sleep 2
  fi
done

