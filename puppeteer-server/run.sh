#!/bin/bash

set -e
set -x



docker run --rm --cap-add=SYS_ADMIN \
  --env ZX_AUTO_RESTART=true \
  --env ZX_NODE_INSPECT=--inspect=0.0.0.0 \
  --env ZX_MODE=worker \
  --env "ZX_NODE_ARGS=./runtime/puppeteer-server/index.js start-worker --port=10000" \
  -p 9000:9000 \
  -p 9329:9229 \
  -v "$(cd .. ; pwd)/puppeteer-server/base/container/app:/home/pptruser/app" \
  -v "$(cd .. ; pwd)/puppeteer-server/base/container/bin:/home/pptruser/bin" \
  -v "$(cd .. ; pwd)/compiled/source-node:/home/pptruser/app/runtime" \
  -it \
  $@ \
  zenesisuk/zx-puppeteer-server-base bash
  #/home/pptruser/bin/start.sh

