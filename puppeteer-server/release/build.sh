#!/bin/bash

seut -e
set -x

cd $(dirname $0)

THIS_PLATFORM=
if [[ $(uname -p) == 'arm' ]]; then
  THIS_PLATFORM="linux/arm64"
else
  THIS_PLATFORM="linux/amd64"
fi

PUSH=""
PLATFORMS="linux/amd64,linux/arm64"
while [[ $1 != "" ]] ; do
  case $1 in
    --push)
      PUSH="--push"
      ;;
    --load)
      PUSH="--load"
      PLATFORMS="$THIS_PLATFORM"
      ;;
    --no-push)
      PUSH=""
      ;;
    --amd)
      PLATFORMS="linux/amd64"
      ;;
    --arm)
      PLATFORMS="linux/arm64"
      ;;
  esac
  shift
done

rm -rf container/app/console.log container/app/database-status.json container/app/node_modules
rm -rf runtime
mkdir -p runtime
cp -r ../../compiled/source-node/. ./runtime

docker login
docker buildx build --platform "$PLATFORMS" $PUSH -t zenesisuk/zx-puppeteer-server .
