#!/bin/bash

cd base
docker buildx create --use
docker buildx build --platform linux/amd64,linux/arm64 --push -t zenesisuk/zx-puppeteer-server-base .
cd ..
