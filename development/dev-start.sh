#!/usr/bin/env bash
set -e

kind create cluster --config=./development/kind-config.yml --kubeconfig=./.kubeconfig

cp .kubeconfig .kubeconfig-backend

sed -i '' 's/127.0.0.1/host.docker.internal/g' .kubeconfig-backend

source .envrc

docker-compose -f development-compose.yml up -d
