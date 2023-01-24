#!/usr/bin/env bash
# Copyright (c) 2017-present SIGHUP s.r.l All rights reserved.
# Use of this source code is governed by a BSD-style
# license that can be found in the LICENSE file.

. development/common.sh || exit 1

set -e

RANDOM_FORWARD_PORT=$(LC_ALL=C tr -cd 0-9 </dev/urandom | head -c 3 ; echo)
RANDOM_ID=$(LC_ALL=C tr -dc 'a-z0-9' </dev/urandom | head -c 8 ; echo)
RANDOM_XVFB_PORT=$(LC_ALL=C tr -cd 0-9 </dev/urandom | head -c 2 ; echo)
LISTENING_PORT=$((RANDOM_FORWARD_PORT + 4000))
XVFB_PORT=$((RANDOM_XVFB_PORT + 80))
CLUSTER_NAME=${CLUSTER_NAME}-${RANDOM_ID}
CYPRESS_IMAGE_NAME=cypress-${RANDOM_ID}

trap 'cleanup $(echo ${CLUSTER_NAME})' EXIT
trap 'cleanup $(echo ${CLUSTER_NAME})' ERR

# Set up environment
echo "Set up environment for kind ${KIND_VERSION} and kubectl ${CLUSTER_VERSION}"
set_env "${KIND_VERSION}" "${CLUSTER_VERSION}"

# Create kind cluster
echo "Create cluster ${CLUSTER_NAME} with kind ${KIND_VERSION} and kubectl ${CLUSTER_VERSION}"
create_kind_cluster "${CLUSTER_NAME}" "${CLUSTER_VERSION}"

# Execute e2e test
echo "Start e2e test against cluster ${CLUSTER_NAME}"
run_e2e_test "${CLUSTER_NAME}"

sleep 10

make FORWARD_PORT="${LISTENING_PORT}" port-forward &

# This is a workaround for cypress not supporting CI alpine image and arm64 environment
export CYPRESS_BASE_URL="http://admin:1v2d1e2e67dS@localhost:${LISTENING_PORT}"
docker run -it -e CYPRESS_BASE_URL -e CYPRESS_VIDEO -e DISPLAY=:${XVFB_PORT} --entrypoint=bash -d --network host --name="${CYPRESS_IMAGE_NAME}" cypress/browsers:node18.12.0-chrome107 
docker cp $PWD/e2e-test "${CYPRESS_IMAGE_NAME}":e2e
docker exec -i -w /e2e "${CYPRESS_IMAGE_NAME}" 'yarn' 'install'
docker exec -i -d -w /e2e "${CYPRESS_IMAGE_NAME}" 'Xvfb' ":${XVFB_PORT}"
docker exec -i -w /e2e "${CYPRESS_IMAGE_NAME}" 'yarn' 'test'
