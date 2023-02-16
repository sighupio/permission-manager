# This function will create the ctlptl registry (which is local registry used by Tilt) and the kind cluster.
function create {
	CLUSTER_VERSION=$1
	
	echo "Creating cluster and local registry..."
	ctlptl apply -f "${WORKING_DIR}/development/manifests/ctlptl-registry.yml"
	KIND_IMAGE="kindest/node:v$CLUSTER_VERSION" yq e '.kindV1Alpha4Cluster.nodes[0].image |= strenv(KIND_IMAGE)' <"${WORKING_DIR}/development/manifests/kind-config.yml" | ctlptl apply -f -
}

# This function will create and inject self-signed TLS certificates into the cluster, using mkcert(it install the CA certificate to your browser's trusted certificates). This is necessary for the ingress to work.
# Remember to add "0.0.0.0 permission-manager.dev" line to your /etc/hosts file
function setup_certs {
	if [[ "${FORCE}" -eq "1" ]]; then
		rm "${WORKING_DIR}/development/manifests/permission-manager.dev-tls.yaml"
		rm "${WORKING_DIR}/development/manifests/wildcard.permission-manager.dev-tls.yaml"
	fi

	# setup self-signed tls certificates
	if [ ! -f "${WORKING_DIR}/development/manifests/permission-manager.dev-tls.yaml" ] ||
		[ ! -f "${WORKING_DIR}/development/manifests/wildcard.permission-manager.dev-tls.yaml" ]; then
		echo "Creating TLS certificates.."

		(cd "${CERTS_DIR}" && mkcert "*.permission-manager.dev" && mkcert "permission-manager.dev" && mkcert -install) &&
			kubectl create secret tls wildcard.permission-manager.dev-tls \
				--cert="${CERTS_DIR}/_wildcard.permission-manager.dev.pem" \
				--key="${CERTS_DIR}/_wildcard.permission-manager.dev-key.pem" \
				-o yaml --dry-run=client >"${WORKING_DIR}/development/manifests/wildcard.permission-manager.dev-tls.yaml"

		kubectl create secret tls permission-manager.dev-tls \
			--cert="${CERTS_DIR}/permission-manager.dev.pem" \
			--key="${CERTS_DIR}/permission-manager.dev-key.pem" \
			-o yaml --dry-run=client >"${WORKING_DIR}/development/manifests/permission-manager.dev-tls.yaml"
	fi
}

# This function will start the ctlptl registry (which is local registry used by Tilt) and the kind cluster.
function start {
	echo "Starting cluster and local registry..."
	docker start permission-manager-kind-registry permission-manager-kind-control-plane
}
