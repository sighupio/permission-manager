# Installation

this guide refer to installing the permission manager on a running cluster

## Requirements

- Create the Namespace

```
kubectl create namespace permission-manager
```
- Create a secret with this content and update acordingly

```
---
apiVersion: v1
kind: Secret
metadata:
  name: permission-manager
  namespace: permission-manager
type: Opaque
stringData:
  PORT: "4000" # port where server is exposed
  CLUSTER_NAME: "my-cluster" # name of the cluster to use in the generated kubeconfig file
  CONTROL_PLANE_ADDRESS: "https://172.17.0.3:6443" # full address of the control plane to use in the generated kubeconfig file
  BASIC_AUTH_PASSWORD: "changeMe" # password used by basic auth (username is `admin`)
```

# Deploy

- Then apply:
```
kubectl apply -f https://github.com/sighupio/permission-manager/releases/download/v1.7.1-rc1/crd.yml
kubectl apply -f https://github.com/sighupio/permission-manager/releases/download/v1.7.1-rc1/seed.yml
kubectl apply -f https://github.com/sighupio/permission-manager/releases/download/v1.7.1-rc1/deploy.yml
```

## Basic auth

the username is `admin` the password is mounted as a secret `BASIC_AUTH_PASSWORD`

## Visit the application

`kubectl port-forward svc/permission-manager 4000 --namespace permission-manager`

the application can now be accessed by http://localhost:4000
