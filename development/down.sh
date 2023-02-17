#!/usr/bin/env bash

FORCE="${1}"

echo "Deleting cluster..."
docker rm -f permission-manager-kind-control-plane

if [[ "${FORCE}" -eq "1" ]]; then
  echo "Deleting local registry..."
  docker rm -f permission-manager-kind-registry
fi

echo "Done."
