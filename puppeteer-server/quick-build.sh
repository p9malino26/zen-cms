#!/bin/bash

cd base
docker buildx build --platform linux/arm64 --load -t zenesisuk/zx-puppeteer-server-base .

