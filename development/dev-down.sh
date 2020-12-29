#!/usr/bin/env bash
set -e

kind delete cluster

rm .kubeconfig .kubeconfig-backend

docker-compose -f development-compose.yml down
