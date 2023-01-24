#!/usr/bin/env bash
# Copyright (c) 2017-present SIGHUP s.r.l All rights reserved.
# Use of this source code is governed by a BSD-style
# license that can be found in the LICENSE file.

OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m | sed 's/x86_64/amd64/')
SOURCE="$(pwd)/.e2e"

function cleanup {
    echo "Stop e2e test and clean up..."
    
    CLUSTER_ID=${1}

    echo "Destroying the cluster ${CLUSTER_ID}"
    kind delete cluster --name "${CLUSTER_ID}"
    echo "Removing source folder ${SOURCE}"
    rm -rf "${SOURCE}"
}

function set_env {
    KIND_VERSION=${1}
    CLUSTER_VERSION=${2}

    mkdir "${SOURCE}"
    echo "Downloading kind v${KIND_VERSION}"
    wget -qO "${SOURCE}/kind" "https://kind.sigs.k8s.io/dl/v${KIND_VERSION}/kind-${OS}-${ARCH}"
    echo "Downloading kubectl v${CLUSTER_VERSION}"
    wget -qO "${SOURCE}/kubectl" "https://storage.googleapis.com/kubernetes-release/release/v${CLUSTER_VERSION}/bin/${OS}/${ARCH}/kubectl"
    chmod +x "${SOURCE}/kind" "${SOURCE}/kubectl"
    export PATH="${SOURCE}:$PATH"  
}

function create_kind_cluster {
    CLUSTER_NAME=${1}
    CLUSTER_VERSION=${2}

    kind create cluster --name "${CLUSTER_NAME}" --image kindest/node:"v${CLUSTER_VERSION}" --config development/kind-config.yml
    kind get kubeconfig --name "${CLUSTER_NAME}" > "${SOURCE}/kubeconfig.yml"
    export KUBECONFIG="${SOURCE}/kubeconfig.yml"
    export CONTROL_PLANE_ADDRESS=$(kubectl config view --minify | grep server | cut -f 2- -d ":" | tr -d " ")
}

function run_e2e_test {
    make KIND_CLUSTER_NAME="${1}" build
    
    bats -t tests/setup.sh
    bats -t tests/create-user.sh
}
