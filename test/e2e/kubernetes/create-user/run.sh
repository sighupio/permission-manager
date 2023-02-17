#!/usr/bin/env bats

load "../helper"

@test "[USERS] Create test-user" {
  info
  test() {
    kubectl apply -f test/e2e/kubernetes/create-user/create-user.yaml -n permission-manager-e2e
    kubectl wait --for=condition=complete --timeout=30s job/create-user -n permission-manager-e2e
    kubectl logs job/create-user -n permission-manager-e2e >&3
  }
  run test
  [ "$status" -eq 0 ]
}

@test "[USERS] Create role-binding to test-user" {
  info
  test() {
    kubectl apply -f test/e2e/kubernetes/create-user/create-rolebinding.yaml -n permission-manager-e2e
    kubectl wait --for=condition=complete --timeout=30s job/create-rolebinding -n permission-manager-e2e
    kubectl logs job/create-rolebinding -n permission-manager-e2e >&3
  }
  run test
  [ "$status" -eq 0 ]
}

@test "[USERS] Create cluster-role-binding to test-user" {
  info
  test() {
    kubectl apply -f test/e2e/kubernetes/create-user/create-cluster-rolebinding.yaml -n permission-manager-e2e
    kubectl wait --for=condition=complete --timeout=30s job/create-cluster-rolebinding -n permission-manager-e2e
    kubectl logs job/create-cluster-rolebinding -n permission-manager-e2e >&3
  }
  run test
  [ "$status" -eq 0 ]
}

@test "[USERS] Create kubeconfig to test-user" {
  info
  test() {
    kubectl apply -f test/e2e/kubernetes/create-user/create-kubeconfig.yaml -n permission-manager-e2e
    kubectl wait --for=condition=complete --timeout=30s job/create-kubeconfig -n permission-manager-e2e
    kubectl logs job/create-kubeconfig -n permission-manager-e2e | jq .kubeconfig -r > test.kubeconfig
    kubectl logs job/create-kubeconfig -n permission-manager-e2e >&3
  }
  run test
  [ "$status" -eq 0 ]
}

@test "[USERS] Modify kubeconfig (insecure-skip-tls-verify" {
  info
  yq 'del(.clusters[0].cluster.certificate-authority-data)' < test.kubeconfig | yq e '.clusters[0].cluster.insecure-skip-tls-verify = true' - > test.insecure.kubeconfig
}

@test "[USERS] Test generated kubeconfig - test-user can not deploy pods in kube-system" {
  info
  test() {
    can=$(kubectl auth can-i create pods -n kube-system --kubeconfig test.insecure.kubeconfig 2>&1)
    echo "can-i create pods -n kube-system: ${can}" >&3
    if [ "${can}" != "no" ]; then return 1; fi
  }
  run test
  [ "$status" -eq 0 ]
}

@test "[USERS] Test generated kubeconfig - test-user can deploy pods in permission-manager" {
  info
  test() {
    can=$(kubectl auth can-i create pods -n permission-manager-e2e --kubeconfig test.insecure.kubeconfig 2>&1)
    echo "can-i create pods -n permission-manager: ${can}" >&3
    if [ "${can}" != "yes" ]; then return 1; fi
  }
  run test
  [ "$status" -eq 0 ]
}
