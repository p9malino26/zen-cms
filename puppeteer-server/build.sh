#!/bin/bash

docker login

cd base
docker buildx build --platform linux/amd64 --push -t zenesisuk/zx-puppeteer-server-base .
#docker build . -t zenesisuk/zx-puppeteer-server-base
cd ..

#docker login
#docker push zenesisuk/zx-puppeteer-server-base:latest
