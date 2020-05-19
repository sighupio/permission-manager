#!/usr/bin/env bats

load "./lib/helper"

@test "[SETUP] Deploy Permission manager Requirements" {
    info
    deploy(){
        kubectl apply -f k8s/k8s-seeds/namespace.yml
        kubectl apply -f k8s/k8s-seeds
    }
    run deploy
    [ "$status" -eq 0 ]
}

@test "[SETUP] Deploy Permission manager" {
    info
    deploy(){
        current_context=$(kubectl config view -o json | jq -r '.["current-context"]')
        export CLUSTER_NAME=$(kubectl config view -o json | jq -r '.contexts[] | select( .name | "${current_context}") | .context.cluster')
        export CONTROL_PLANE_ADDRESS=$(kubectl config view -o json | jq -r '.clusters[] | select( .name | "${CLUSTER_NAME}") | .cluster.server')
        kustomize build k8s/ | envsubst | kubectl apply -f -
        kubectl wait --for=condition=Available deploy/permission-manager-deployment -n permission-manager --timeout=300s
    }
    run deploy
    [ "$status" -eq 0 ]
}
