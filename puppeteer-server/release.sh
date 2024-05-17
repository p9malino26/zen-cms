#!/bin/bash

mkdir -p release/app
cp -r ../compiled/source-node/. ./release/app
docker login

cd release
docker buildx  build --platform linux/amd64 --push -t zenesisuk/zx-puppeteer-server .
# docker build . -t zenesisuk/zx-puppeteer-server
cd ..

#docker login
#docker push zenesisuk/zx-puppeteer-server:latest 

