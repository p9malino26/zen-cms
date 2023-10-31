#!/bin/bash

mkdir -p release/app
cp -r ../compiled/source-node/. ./release/app

cd release
docker build . -t zenesisuk/zx-puppeteer-server
cd ..

docker login
docker push zenesisuk/zx-puppeteer-server:latest 

