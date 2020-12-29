#!/usr/bin/env bash
set -e
# we create the kind cluster with some specific configurations, ex: we allow 'host.docker.internal' on the kubeconf
# we also save the .kubeconfig on the root folder
kind create cluster --config=./development/kind-config.yml --kubeconfig=./.kubeconfig
# we make the kubeconfig for the local backend
cp .kubeconfig .kubeconfig-backend
# containers reach the host on the 'host.docker.internal' dns instead of 127.0.0.1
sed -i '' 's/127.0.0.1/host.docker.internal/g' .kubeconfig-backend
# now that there is the .kubeconfig we can evaluate the .envrc
source .envrc

# we spin up the containers
docker-compose -f development-compose.yml up -d
