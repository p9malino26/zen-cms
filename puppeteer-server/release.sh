#!/bin/bash

mkdir -p release/app
cp -r ../compiled/source-node/. ./release/app

cd release
docker build . -t littlejohnuk/zx-puppeteer-server
cd ..

docker login
docker push littlejohnuk/zx-puppeteer-server-base:latest 
docker push littlejohnuk/zx-puppeteer-server:latest 

