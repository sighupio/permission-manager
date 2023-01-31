# Installation

this guide refer to installing the permission manager on a running cluster

## Install with kubectl

- Create the Namespace where the application will be deployed

```
kubectl create namespace permission-manager
```
- Create a secret with the configuration for the application, for example:

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
### Deploy the application
```
kubectl apply -f https://github.com/sighupio/permission-manager/releases/download/v1.8.1-rc1/crd.yml
kubectl apply -f https://github.com/sighupio/permission-manager/releases/download/v1.8.1-rc1/seed.yml
kubectl apply -f https://github.com/sighupio/permission-manager/releases/download/v1.8.1-rc1/deploy.yml
```

### Visit the application

`kubectl port-forward svc/permission-manager 4000 --namespace permission-manager`

> the application can now be accessed by http://localhost:4000

## Install with Helm
It is also possible to deploy Permission Manager using the [provided Helm Chart](/helm_chart).

First create a values file, for example `my-values.yaml`, with your custom values for the release. See the [chart's readme](/helm_chart/README.md) and the [default values.yaml](/helm_chart/values.yaml) for more information.

Then, execute:

```bash
helm repo add permission-manager https://sighupio.github.io/permission-manager
helm upgrade --install --namespace permission-manager --set image.tag=v1.8.0 --values my-values.yaml permission-manager permission-manager/permission-manager
```

> don't forget to replace `my-values.yaml` with the path to your values file.

