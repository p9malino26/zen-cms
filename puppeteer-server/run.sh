#!/bin/bash

COMMAND=$1
shift
echo "Running with command: $COMMAND"

set -e
set -x

docker run --rm --cap-add=SYS_ADMIN \
  --env ZX_AUTO_RESTART=true \
  --env ZX_NODE_INSPECT=--inspect=0.0.0.0 \
  -p 9000:9000 \
  -p 9329:9229 \
  -v "$(cd .. ; pwd)/compiled/source-node:/home/pptruser/app" \
  -it \
  $@ \
  zenesisuk/zx-puppeteer-server-base $COMMAND

