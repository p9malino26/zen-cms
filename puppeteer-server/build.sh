#!/bin/bash

cd base
docker buildx build --push -t zenesisuk/zx-puppeteer-server-base .
cd ..
