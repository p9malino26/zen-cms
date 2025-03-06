#!/bin/bash

cd $(dirname $0)

docker buildx build --platform linux/amd64,linux/arm64 --push -t zenesisuk/zx-puppeteer-server-base .
