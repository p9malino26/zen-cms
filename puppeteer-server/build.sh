#!/bin/bash

cd base
#docker buildx create --use
docker buildx build --platform linux/amd64,linux/arm64 --push -t zenesisuk/zx-puppeteer-server-base .

# Uncomment below if you don't want to push:
# docker buildx build --platform linux/arm64 --load -t zenesisuk/zx-puppeteer-server-base .
cd ..
