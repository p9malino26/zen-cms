#!/bin/bash

cd base
docker build . -t zenesisuk/zx-puppeteer-server-base
cd ..

docker login
docker push zenesisuk/zx-puppeteer-server-base:latest 
