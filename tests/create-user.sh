#!/usr/bin/env bats

load "./lib/helper"

@test "[USERS] Create test-user" {
    info
    test(){
        kubectl apply -f tests/manifests/create-user.yaml
        kubectl wait --for=condition=complete --timeout=30s job/create-user
    }
    run test
    [ "$status" -eq 0 ]
}

@test "[USERS] Create role-binding to test-user" {
    info
    test(){
        kubectl apply -f tests/manifests/create-rolebinding.yaml
        kubectl wait --for=condition=complete --timeout=30s job/create-rolebinding
    }
    run test
    [ "$status" -eq 0 ]
}

@test "[USERS] Create cluster-role-binding to test-user" {
    info
    test(){
        kubectl apply -f tests/manifests/create-cluster-rolebinding.yaml
        kubectl wait --for=condition=complete --timeout=30s job/create-cluster-rolebinding
    }
    run test
    [ "$status" -eq 0 ]
}

@test "[USERS] Create kubeconfig to test-user" {
    info
    test(){
        kubectl apply -f tests/manifests/create-kubeconfig.yaml
        kubectl wait --for=condition=complete --timeout=30s job/create-kubeconfig
        kubectl logs job/create-kubeconfig | jq .kubeconfig -r > test.kubeconfig
    }
    run test
    [ "$status" -eq 0 ]
}

@test "[USERS] Test generated kubeconfig - test-user can not deploy pods in kube-system" {
    info
    test(){
        status=$(kubectl auth can-i create pods -n kube-system --kubeconfig test.kubeconfig)
        if [ "${status}" != "no" ]; then return 1; fi
    }
    run test
    [ "$status" -eq 0 ]
}

@test "[USERS] Test generated kubeconfig - test-user can deploy pods in permission-manager" {
    info
    test(){
        status=$(kubectl auth can-i create pods -n permission-manager --kubeconfig test.kubeconfig)
        if [ "${status}" != "yes" ]; then return 1; fi
    }
    run test
    [ "$status" -eq 0 ]
}
