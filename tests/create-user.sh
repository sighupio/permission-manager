#!/usr/bin/env bats

load "./lib/helper"

@test "[USERS] Create test-user" {
    info
    test(){
        kubectl apply -f tests/manifests/create-user.yaml
        kubectl wait --for=condition=complete --timeout=30s job/create-user
        kubectl logs job/create-user >&3
    }
    run test
    [ "$status" -eq 0 ]
}

@test "[USERS] Create role-binding to test-user" {
    info
    test(){
        kubectl apply -f tests/manifests/create-rolebinding.yaml
        kubectl wait --for=condition=complete --timeout=30s job/create-rolebinding
        kubectl logs job/create-rolebinding >&3
    }
    run test
    [ "$status" -eq 0 ]
}

@test "[USERS] Create cluster-role-binding to test-user" {
    info
    test(){
        kubectl apply -f tests/manifests/create-cluster-rolebinding.yaml
        kubectl wait --for=condition=complete --timeout=30s job/create-cluster-rolebinding
        kubectl logs job/create-cluster-rolebinding >&3
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
        kubectl logs job/create-kubeconfig >&3
    }
    run test
    [ "$status" -eq 0 ]
}

@test "[USERS] Modify kubeconfig (insecure-skip-tls-verify" {
    info
    cat test.kubeconfig | yq d - clusters[0].cluster.certificate-authority-data | yq w - clusters[0].cluster.insecure-skip-tls-verify true > test.insecure.kubeconfig
}

@test "[USERS] Test generated kubeconfig - test-user can not deploy pods in kube-system" {
    info
    test(){
        can=$(kubectl auth can-i create pods -n kube-system --kubeconfig test.insecure.kubeconfig 2>&1)
        echo "can-i create pods -n kube-system: ${can}" >&3
        if [ "${can}" != "no" ]; then return 1; fi
    }
    run test
    [ "$status" -eq 0 ]
}

@test "[USERS] Test generated kubeconfig - test-user can deploy pods in permission-manager" {
    info
    test(){
        can=$(kubectl auth can-i create pods -n permission-manager --kubeconfig test.insecure.kubeconfig 2>&1)
        echo "can-i create pods -n permission-manager: ${can}" >&3
        if [ "${can}" != "yes" ]; then return 1; fi
    }
    run test
    [ "$status" -eq 0 ]
}
