#!/usr/bin/env bash

# Load utils
source ./development/utils.sh

# Variables
WORKING_DIR=$(pwd)
CLUSTER_VERSION="${1}"
FORCE="${2}"

# Setup self-signed TLS certificates for the ingress to work (it install the CA certificate to your browser's trusted certificates).
# Remember to add 0.0.0.0 permission-manager.dev line to your /etc/hosts file.
setup_certs "${WORKING_DIR}/development/manifests" "${WORKING_DIR}/development/certs" "${FORCE}"

# Start dev environment
if [[ -n "$(docker ps -q -a -f name=permission-manager-kind-registry || true)" ]] && [[ -n "$(docker ps -q -a -f name=permission-manager-kind-control-plane || true)" ]]; then
  start
else
  create "${CLUSTER_VERSION}" "${WORKING_DIR}/development/manifests"
fi

echo "Starting Tilt's dev environment..."
kind get kubeconfig --name permission-manager-kind > "${WORKING_DIR}/development/.kubeconfig"
kubectl --kubeconfig "${WORKING_DIR}/development/.kubeconfig" config set-context permission-manager-kind
export KUBECONFIG=${WORKING_DIR}/development/.kubeconfig && tilt up -f "${WORKING_DIR}/Tiltfile"

echo "Done."
