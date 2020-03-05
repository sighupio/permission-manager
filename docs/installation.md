# Installation

this guide refer to installing the permission manager on a running cluster

## Deploy

- Edit `k8s/k8s-seeds/auth-secret.yml` to set your password
- Then apply these manifests

```
kubectl apply -f k8s/k8s-seeds/namespace.yml
kubectl apply -f k8s/k8s-seeds
```

- Edit `k8s/deploy.yaml` to set environment variables:

| Env Name              | Description                                                               |
| --------------------- | ------------------------------------------------------------------------- |
| PORT                  | port where server is exposed                                              |
| CLUSTER_NAME          | name of the cluster to use in the generated kubeconfig file               |
| CONTROL_PLANE_ADDRESS | full address of the control plane to use in the generated kubeconfig file |
| BASIC_AUTH_PASSWORD   | password used by basic auth (username is `admin`)                         |

- Then apply
```
kubectl apply -f k8s/deploy.yaml
```

## Basic auth

the username is `admin` the password is mounted as a secret (see `k8s/deploy.yaml`)

## Visit the application

> assuming `k8s/deploy.yaml` file has been used

`kubectl port-forward svc/permission-manager-service 4000 --namespace permission-manager`

the application can now be accessed by http://localhost:4000


