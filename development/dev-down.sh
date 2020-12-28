#!/usr/bin/env bash
set -e

cd ../

kind delete cluster

docker-compose -f development-compose.yml down
