# Permission manager

Permission manager is an application that allow to a user specific kubeconfig, and assign permissions to operate within a namespace or globally via a web interface

## Quick core concepts

- A server written in go is responsive to talk with the k8s cluster
  - in production the UI with be served as static asset from the go server compiled into a go file using [statik](https://github.com/rakyll/statik) so that a single binary can be deployed
- The UI is a ReactJS single page application

  - the UI run indipendently from the go server when developing

- users are CRD inside k8s and will be stored inside ETCD
  the app recognise whenere is run inside kubernetes or not by checking the ENV `KUBERNETES_SERVICE_HOST` this will change how the app tries to autenticate to the api server (via token from within k8s or using `~/.kube/config` otherwhise)
- using [`golang-standards/project-layout`](https://github.com/golang-standards/project-layout)
- applying Clean Architecture / Hexgolan architecture patterns to decouple domain logic from implementations to allow easier testing, refactoring and future development

## How it works

It uses a naming convention to identity some roles as "templates", this is used to filter the at UI

the template system is an abstrction over cluter roles, rolebinding and cluster roles bindigs, making the permissions "kubernetes native"

### What is a template

A template a clusterrole with the prefix

`template-namespaced-resources___`

for example
`template-namespaced-resources___developer`

### How to add a new template

Crate a clusterrole starting with `template-namespaced-resources___` and apply it

### setup

these ENV are required

| Env Name              | Description                                                               |
| --------------------- | ------------------------------------------------------------------------- |
| CLUSTER_NAME          | name of the cluster to use in the generated kubeconfig file               |
| CONTROL_PLANE_ADDRESS | full address of the control plane to use in the generated kubeconfig file |
|                       |                                                                           |

#### apply manifests

`developer` and `operation` default templates can be created by applying the manifest located at _k8s-seeds/seed.yml_

CRD for users, and required secrets are can all be installed running

```
kubectl apply -f k8s-seeds
```

## Setup for Local developlment

run UI

```
cd web-client
npm start
```

run go server (assuming using Minikube, othewhise change the ENVs set by `make dev`)

```
make dev
```

> the application is also exposed at index from the go app, but this is not updated when frontend files change, if working only on the server this is enought

### How to make changes in the frontend

to run

```
cd web-client
npm start
```

to build
run `make build-ui`
it will build the app and save the files as a single go file that the server will then expose

### How to test inside Minikube

use Minikube's docker daemon (all subsequent commands needs to be run in the same shell where this command is run becuase ENV are set)

```
eval $(minikube docker-env)
```

build the Docker image

```
docker build -t permission-manager:1.0.x-beta .
```

deploy the manifest (update the version in deploy.yml)

```
kubectl apply -f deploy.yaml
```

port forward the service

```
kubectl port-forward service/permission-manager-service 4000:4000
```

navigate to localhost:4000 to see the web UI

## How To deploy

> change version in the below snippets

```
make build-ui
docker build -t reg.sighup.io/sighup-products/permission-manager:x.x.x .
docker push reg.sighup.io/sighup-products/permission-manager:x.x.x
```

apply files inside `k8s-seeds`

update image tag of the pod
