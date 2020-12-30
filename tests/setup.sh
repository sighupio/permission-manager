#!/usr/bin/env bats

load "./lib/helper"
@test "[SETUP] Deploy Permission manager Requirements" {
    info
    deploy(){
        kubectl delete namespace permission-manager

        kubectl create namespace permission-manager

        current_context=$(kubectl config view -o json | jq -r '.["current-context"]')
        export CLUSTER_NAME=$(kubectl config view -o json | jq -r '.contexts[] | select( .name | "${current_context}") | .context.cluster')
        # todo remove hardcoded password. It is used as base46 in the manifests
        export CONTROL_PLANE_ADDRESS=$(kubectl config view -o json | jq -r '.clusters[] | select( .name | "${CLUSTER_NAME}") | .cluster.server')
        { cat <<-EOF
		---
		apiVersion: v1
		kind: Secret
		metadata:
		  name: permission-manager
		  namespace: permission-manager
		type: Opaque
		stringData:
		  PORT: "4000" # port where server is exposed
		  CLUSTER_NAME: "${CLUSTER_NAME}" # name of the cluster to use in the generated kubeconfig file
		  CONTROL_PLANE_ADDRESS: "${CONTROL_PLANE_ADDRESS}" # full address of the control plane to use in the generated kubeconfig file
		  BASIC_AUTH_PASSWORD: "1v2d1e2e67dS" # password used by basic auth (username is `admin`)
		EOF
        } | kubectl apply -f -
        kubectl apply -f deployments/kubernetes/seeds/crd.yml
        kubectl apply -f deployments/kubernetes/seeds/seed.yml

    }

    run deploy
    [ "$status" -eq 0 ]

}

@test "[SETUP] Deploy Permission manager" {
    info

    deploy(){
        # todo it uses static version manifests?
        kubectl apply -f deployments/kubernetes/deploy.yml
        kubectl wait --for=condition=Available deploy/permission-manager -n permission-manager --timeout=300s
    }

    run deploy
    [ "$status" -eq 0 ]

}
