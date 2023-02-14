#!/usr/bin/env bash
# Copyright (c) 2017-present SIGHUP s.r.l All rights reserved.
# Use of this source code is governed by a BSD-style
# license that can be found in the LICENSE file.

. ./scripts/kube-utils.sh || exit 1

set -e

####################### VARIABLES #######################
RANDOM_FORWARD_PORT=$(
    LC_ALL=C tr -cd 0-9 </dev/urandom | head -c 3
    echo
)
RANDOM_ID=$(
    LC_ALL=C tr -dc 'a-z0-9' </dev/urandom | head -c 8
    echo
)
RANDOM_XVFB_PORT=$(
    LC_ALL=C tr -cd 0-9 </dev/urandom | head -c 2
    echo
)
LISTENING_PORT=$((RANDOM_FORWARD_PORT + 4000))
XVFB_PORT=$((RANDOM_XVFB_PORT + 80))
CLUSTER_NAME=pm-e2e-${RANDOM_ID}
CYPRESS_IMAGE_NAME=cypress-${RANDOM_ID}

WORKING_DIR=$(pwd)
DEPS_SOURCE="$WORKING_DIR/.e2e"

####################### CLEANUP #######################
trap 'cleanup "${CLUSTER_NAME}" "${CYPRESS_IMAGE_NAME}" "${DEPS_SOURCE}"' EXIT
trap 'cleanup "${CLUSTER_NAME}" "${CYPRESS_IMAGE_NAME}" "${DEPS_SOURCE}"' ERR

####################### SETUP #######################
# Install dependencies
echo -e "Using kind v${KIND_VERSION} and kubectl v${CLUSTER_VERSION}"
echo -e "Cluster version: ${CLUSTER_VERSION}\n"
mkdir -p "${DEPS_SOURCE}"
install_dependencies "${DEPS_SOURCE}" "${KIND_VERSION}" "${HELM_VERSION}" "${CLUSTER_VERSION}"
export PATH="${DEPS_SOURCE}:$PATH"
# Create the cluster and set the kubeconfig
create_kind_cluster "${CLUSTER_NAME}" "${CLUSTER_VERSION}" "${WORKING_DIR}/e2e-test/kubernetes/config/kind-config.yml"
kind get kubeconfig --name "${CLUSTER_NAME}" >"${DEPS_SOURCE}/kubeconfig.yml"
export KUBECONFIG="${DEPS_SOURCE}/kubeconfig.yml"

####################### E2E TESTS #######################
echo "Starting e2e test..."
CONTROL_PLANE_ADDRESS=$(kubectl config view --minify | grep server | cut -f 2- -d ":" | tr -d " ")

echo "Building the local permission-manager image..."
make build-docker CLUSTER_NAME=${CLUSTER_NAME} \
IMAGE_TAG_NAME=e2e \
NAMESPACE=permission-manager-e2e \
BASIC_AUTH_PASSWORD=admin \
PORT=4000 \
CONTROL_PLANE_ADDRESS=${CONTROL_PLANE_ADDRESS}
kind load docker-image permission-manager:e2e --name "${CLUSTER_NAME}"

echo "Deploying the permission-manager..."
kubectl create namespace permission-manager-e2e
make deploy CLUSTER_NAME=${CLUSTER_NAME} \
IMAGE_TAG_NAME=e2e \
NAMESPACE=permission-manager-e2e \
BASIC_AUTH_PASSWORD=admin \
CONTROL_PLANE_ADDRESS=${CONTROL_PLANE_ADDRESS}


echo "Waiting for the permission-manager to be ready..."
kubectl wait --for=condition=available --timeout=20s deployment/permission-manager -n permission-manager-e2e

echo "Running the e2e tests..."
bats -t "$WORKING_DIR/e2e-test/kubernetes/create-user/run.sh" && sleep 15

# run the cypress tests
kubectl port-forward -n permission-manager-e2e service/permission-manager "${LISTENING_PORT}":4000 &
export CYPRESS_BASE_URL="http://admin:admin@localhost:${LISTENING_PORT}"
# if the enviroment is CI, we use the cypress image because we use docker in docker that is based on alpine. Cypress doesn't love it.
# https://github.com/cypress-io/cypress/issues/419
if [ -n "${CI}" ]; then
    docker run -it -e CYPRESS_BASE_URL -e CYPRESS_VIDEO -e DISPLAY=:${XVFB_PORT} --entrypoint=bash -d --network host --name="${CYPRESS_IMAGE_NAME}" cypress/browsers:node18.12.0-chrome107
    docker cp $PWD/e2e-test/ui "${CYPRESS_IMAGE_NAME}":e2e
    docker exec -i -w /e2e "${CYPRESS_IMAGE_NAME}" 'yarn' 'install'
    docker exec -i -d -w /e2e "${CYPRESS_IMAGE_NAME}" 'Xvfb' ":${XVFB_PORT}"
    docker exec -i -w /e2e "${CYPRESS_IMAGE_NAME}" 'yarn' 'test'
else
    cd e2e-test/ui && yarn install && yarn test
fi

