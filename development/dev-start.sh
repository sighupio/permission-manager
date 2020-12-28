#!/usr/bin/env bash
set -e

cd ../

kind create cluster --config=./development/kind-config.yml --kubeconfig=./.kubeconfig

docker-compose -f development-compose.yml up -d
