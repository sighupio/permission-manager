#!/usr/bin/env bash
# Copyright (c) 2017-present SIGHUP s.r.l All rights reserved.
# Use of this source code is governed by a BSD-style
# license that can be found in the LICENSE file.

function install_dependencies {
    DEST=$1
    KIND_VERSION=$2
    HELM_VERSION=$3
    CLUSTER_VERSION=$4
    
    OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    ARCH=$(uname -m | sed 's/x86_64/amd64/')
    
    echo "Downloading kind v${KIND_VERSION}"
    wget -qO "${DEST}/kind" "https://kind.sigs.k8s.io/dl/v${KIND_VERSION}/kind-${OS}-${ARCH}"
    echo "Downloading kubectl v${CLUSTER_VERSION}"
    wget -qO "${DEST}/kubectl" "https://storage.googleapis.com/kubernetes-release/release/v${CLUSTER_VERSION}/bin/${OS}/${ARCH}/kubectl"
    chmod +x "${DEST}/kind" "${DEST}/kubectl"
    echo "Downloading helm v${HELM_VERSION}"
    wget -qO "${DEST}/helm.tar.gz" "https://get.helm.sh/helm-v${HELM_VERSION}-${OS}-${ARCH}.tar.gz"
    tar -xzf "${DEST}/helm.tar.gz" -C "${DEST}" --strip-components=1
}

function create_kind_cluster {
    CLUSTER_NAME=$1
    CLUSTER_VERSION=$2
    CONFIG_FILE="$3"
    
    kind create cluster --name "${CLUSTER_NAME}" --image kindest/node:"v${CLUSTER_VERSION}" --config "${CONFIG_FILE}"
}

function cleanup {
    CLUSTER_NAME=$1
    CYPRESS_IMAGE_NAME=$2
    SOURCE=$3
    
    echo "Stop e2e test and clean up..."
    if [[ "$(docker ps -aq -f name="${CYPRESS_IMAGE_NAME}")" ]]; then
        echo "Deleting cypress image ${CYPRESS_IMAGE_NAME}"
        docker rm -f "${CYPRESS_IMAGE_NAME}"
    fi
    echo "Destroying the cluster ${CLUSTER_NAME}"
    kind delete cluster --name "${CLUSTER_NAME}"
    echo "Removing source folder ${SOURCE}"
    rm -rf "${SOURCE}"
}
