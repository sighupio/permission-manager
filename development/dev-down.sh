#!/usr/bin/env bash
set -e

kind delete cluster

# we remove the temporary kubeconfig
rm .kubeconfig .kubeconfig-backend

docker-compose -f development-compose.yml down
