#!/usr/bin/env bash
set -e
# we create the kind cluster with some specific configurations, ex: we allow 'host.docker.internal' on the kubeconf
# we also save the .kubeconfig on the root folder
CLUSTER_VERSION="${1}"
kind create cluster --config=./development/kind-config.yml --kubeconfig=./.kubeconfig --image kindest/node:v"${CLUSTER_VERSION}"
# we make the kubeconfig for the local backend
cp .kubeconfig .kubeconfig-backend
# containers reach the host on the 'host.docker.internal' dns instead of 127.0.0.1
# this line is needed for cross compatibility between osx and unix
sed -i.bak "s/server: $PARTITION_COLUMN.*/server: https:\/\/kind-control-plane:6443/" .kubeconfig-backend && rm -f .kubeconfig-backend.bak

# now that there is the .kubeconfig we can evaluate the .env-cluster
source .env-cluster

make seed

# we spin up the containers
docker-compose -f development-compose.yml up -d --build
