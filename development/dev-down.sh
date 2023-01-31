#!/usr/bin/env bash
set -e

kind delete cluster --name permission-manager

# we remove the temporary kubeconfig
rm .kubeconfig .kubeconfig-backend

docker-compose -f development-compose.yml down
