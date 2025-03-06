#!/bin/bash

# This script quickly runs up the puppeteer server container; it is intended for development purposes only
# so that you can quickly boot it and see whats been configured

set -e
set -x

docker run --rm --cap-add=SYS_ADMIN \
  --env ZX_AUTO_RESTART=true \
  --env ZX_NODE_INSPECT=--inspect=0.0.0.0 \
  --env ZX_MODE=worker \
  --env "ZX_NODE_ARGS=./runtime/puppeteer-server/index.js start-worker --port=10000" \
  -p 9000:9000 \
  -p 9329:9229 \
  -it \
  $@ \
  zenesisuk/zx-puppeteer-server bash
  #/home/pptruser/bin/start.sh

