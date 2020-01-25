# how to contribute

this guide is for contributing on the development of the Permission Manager itself

## Quick core concepts

- A server written in go is responsive to talk with the k8s cluster
  - in production the UI with be served as static asset from the go server compiled into a go file using [statik](https://github.com/rakyll/statik) so that a single binary can be deploye
- The UI is a ReactJS single page application
  - the UI run indipendently from the go server when developing
- users are CRD inside k8s and will be stored inside ETCD
  the app recognise whenere is run inside kubernetes or not by checking the ENV `KUBERNETES_SERVICE_HOST` this will change how the app tries to autenticate to the api server (via token from within k8s or using `~/.kube/config` otherwhise)

## How the application works

The application allow to select some templates and associated them with an user, a naming convention is used to only show templates in the UI (see below for details)

the template system is an abstraction over cluter-roles, rolebinding and cluster roles bindigs, making the permissions "kubernetes native"

In a future version the naming convention will be changed using CRDs and k8s labels

## Setup

### requirements

- go (developed on v1.13.5)
- nodejs (developed on v13.1.0)
- [minikube](https://kubernetes.io/docs/tasks/tools/install-minikube/)
- [gomon](https://github.com/JulesGuesnon/Gomon)

### local cluster using minikube

The project needs to communicate with a k8 cluster, in developmemt the project [minikube](https://kubernetes.io/docs/tasks/tools/install-minikube/) is used to bootstrap a local cluster

install minikube and run `minikube start`

### local cluster using kind

The project needs to communicate with a k8 cluster, in developmemt the project [kind](https://github.com/kubernetes-sigs/kind) is used to bootstrap a local cluster

install kind and run `kind create cluster`

#### ca.crt

when running `make dev-kind`, the command copies a required file (`ca.crt`) from the kind container to the host machine before starting the server, while not strictly necessary to do on every server startup, the overhead is minimal but it prevent problems caused by having an incorrect version of the file which could be very hard to debug, to change the location where `ca.crt` will be saved file edit the env `CA_CRT_PATH`

## Seed the cluster with manifests

when the cluster is ready apply manifests that install CRD and other Objects required by the application by running

`make seed-cluster`

## Running the application server

### install dependecies

`go mod downlaod`

to run the server use `make dev-minikube` or `make dev-kind` the commands start the server on http://localhost:4000 and watch project to restart the server on change

> the project depends on variables that are likely to change such as the k8s api server address these can be configured in `dev` task in the `Makefile` via environment variables

the api server url can be found by running `kubectl cluster-info`

navigating to http://localhost:4000 will server the UI

## Frontend development

the UI frontend served by the server is a production build, to edit the frontend it need to run as a separate project

```
cd web-client
npm start
```

the UI will be accessible at http://localhost:3000, the server must be started at http://localhost:4000

Basic Auth is protecting the API server, in development the credentials are

username: `admin`  
password: `secret`

### building the frontend

When the frontend development is complete the project can be build and packaged to be server by the server by running `make build-ui`,
it will build the app and save all static files files as a single go file localted at `statik`

## Testing

### Testing Frontend

e2e package uses [Cypress](https://cypress.io) to run browser automation tests, in order for it to work the server must run on port `4000`

the test flow creates a user and save a kubeconfig to disk at `e2e-test/data/kubeconfig/[username-template-timestamp]

use `make e2e` to run the tests

![e2e](./assets/e2e.gif)

### Testing server

to run all test use `make gotest`
For testing the assertion library [testify](https://github.com/stretchr/testify) is used

## how to deploy inside a minikube cluster

use Minikube's docker daemon (all subsequent commands needs to be run in the same shell where this command is run becuase ENV are set)

```sh
eval $(minikube docker-env)
```

build the Docker image

```sh
docker build -t permission-manager:[tag] .
```

deploy the manifest (update the version in `k8s/deploy.yml` to match the new image tag and update ENVs if necessary)

```sh
kubectl apply -f k8s/deploy.yaml
```

port forward the service

```sh
kubectl port-forward service/permission-manager-service 4000:4000
```

navigate to localhost:4000 to see the web UI

## publishing a new version

the registry used is a gitlab repository located at reg.sighup.io

```
make build-ui
docker build -t reg.sighup.io/sighup-products/permission-manager:x.x.x .
docker push reg.sighup.io/sighup-products/permission-manager:x.x.x
```
