#!/bin/bash

set -e
set -x

docker run --rm --cap-add=SYS_ADMIN \
  --env ZX_AUTO_RESTART=true \
  --env ZX_NODE_INSPECT=--inspect-brk=0.0.0.0 \
  -p 9000:9000 \
  -p 9230:9229 \
  -v "$(cd .. ; pwd)/compiled/source-node:/home/pptruser/app" \
  -it \
  zenesisuk/zx-puppeteer-server-base "$@"

