#!/usr/bin/env bash
set -e

kind create cluster --config=./development/kind-config.yml --kubeconfig=./.kubeconfig

source .env-cluster

make build

bats -t tests/setup.sh

bats -t tests/create-user.sh

sleep 5

make port-forward &

cd e2e-test && yarn install && yarn test
