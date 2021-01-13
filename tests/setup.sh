#!/usr/bin/env bats

load "./lib/helper"
@test "[SETUP] Deploy Permission manager Requirements" {
    info
    deploy(){
        kubectl delete namespace permission-manager

        kubectl create namespace permission-manager

        cat tests/manifests/permission-manager-secret.yml | envsubst | kubectl apply -f -

        kubectl apply -f deployments/kubernetes/seeds/crd.yml

        kubectl apply -f deployments/kubernetes/seeds/seed.yml

    }

    run deploy
    [ "$status" -eq 0 ]

}

@test "[SETUP] Deploy Permission manager" {
    info

    deploy(){
      # we build the permission image from the current data and run the tests against it
      make build
      make deploy
      kubectl wait --for=condition=Available deploy/permission-manager -n permission-manager --timeout=300s

    }

    run deploy
    [ "$status" -eq 0 ]

}
