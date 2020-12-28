#!/usr/bin/env bash
set -e

cd ../

kind delete cluster

rm .kubeconfig .kubeconfig-backend

docker-compose -f development-compose.yml down
