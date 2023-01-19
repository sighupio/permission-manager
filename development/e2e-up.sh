#!/usr/bin/env bash
# Copyright (c) 2017-present SIGHUP s.r.l All rights reserved.
# Use of this source code is governed by a BSD-style
# license that can be found in the LICENSE file.

. development/common.sh || exit 1

set -e

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

sleep 15

make FORWARD_PORT=4000 port-forward &

export CYPRESS_BASE_URL="http://admin:1v2d1e2e67dS@localhost:4000"

cd e2e-test && yarn install && yarn test
