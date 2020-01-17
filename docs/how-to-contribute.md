# how to contribute

this guide is for contributing on the development of the Permission Manager itself

## Setup

### local cluster with minikube

The project needs to communicate with a k8 cluster, in developmemt the project [minikube](https://kubernetes.io/docs/tasks/tools/install-minikube/) is used to bootstrap a local cluster

install minikube and run `minikube start`

when the cluster is ready apply manifests that install CRD and other Objects required by the application by running

`make seed-cluster`

### local cluster with king (DONT USE, currently not working)

The project needs to communicate with a k8 cluster, in developmemt the project [kind](https://github.com/kubernetes-sigs/kind) is used to bootstrap a local cluster

install kind and run `kind create cluster`

when the cluster is ready apply manifests that install CRD and other Objects required by the application by running

`make seed-cluster`

> running `make run` copies a required file (ca.crt) from the kind container to the host machine before starting the server, while not strictly necessary to do on every server startup, the overhead is minimal but it prevent problems caused by having an incorrect version of the file which could be very hard to debug

## Running the application server

the server is started by running `make dev`, the command start the server on http://localhost:4000 and watch project to restart the server on change

> the project depends on variables that are likely to change such as the k8s api server address these can be configured in `dev` task in the `Makefile` via environment variables

the api server url can be found by running `kubectl cluster-info`

### Frontend development

Basic Auth is protecting the API server, in development the credentials are

username: `admin`  
password: `secret`

#### compiling

When the frontend development is complete the project can be build and packaged to be server by the server by running `make build-ui`

## testing

### Frontend

e2e package uses [Cypress](https://cypress.io) to run browser automation tests, in order for it to work the server must run on port `4000`

the test flow creates a user and save a kubeconfig to disk at `e2e-test/data/kubeconfig/[username-template-timestamp]

### server
