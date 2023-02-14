#!/usr/bin/env bash

# Load utils
source ./development/utils.sh

# Variables
WORKING_DIR=$(pwd)
CERTS_DIR="${WORKING_DIR}/development/certs"
FORCE="${1}"

# Setup self-signed TLS certificates for the ingress to work (it install the CA certificate to your browser's trusted certificates).
# Remember to add 0.0.0.0 permission-manager.dev line to your /etc/hosts file.
setup_certs "${FORCE}"

# Start dev environment
if [ "$(docker ps -q -a -f name=permission-manager-kind-registry)" ] && [ "$(docker ps -q -a -f name=permission-manager-kind-control-plane)" ]; then
	start
else
	create
fi

echo "Starting Tilt's dev environment..."
kind get kubeconfig --name permission-manager-kind >"${WORKING_DIR}/development/.kubeconfig"
kubectl --kubeconfig "${WORKING_DIR}/development/.kubeconfig" config set-context permission-manager-kind
export KUBECONFIG=${WORKING_DIR}/development/.kubeconfig && tilt up -f "${WORKING_DIR}/Tiltfile"

echo "Done."
