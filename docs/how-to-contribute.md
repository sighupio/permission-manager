# how to contribute

this guide is for contributing on the development of the Permission Manager itself

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

> when running `make dev-kind`, the command copies a required file (ca.crt) from the kind container to the host machine before starting the server, while not strictly necessary to do on every server startup, the overhead is minimal but it prevent problems caused by having an incorrect version of the file which could be very hard to debug

## Seed the cluster with manifests

when the cluster is ready apply manifests that install CRD and other Objects required by the application by running

`make seed-cluster`

## Running the application server

the server is started by running `make dev-minikube` or `make dev-kind` the commands start the server on http://localhost:4000 and watch project to restart the server on change

> the project depends on variables that are likely to change such as the k8s api server address these can be configured in `dev` task in the `Makefile` via environment variables

the api server url can be found by running `kubectl cluster-info`

## Frontend development

Basic Auth is protecting the API server, in development the credentials are

username: `admin`  
password: `secret`

### compiling

When the frontend development is complete the project can be build and packaged to be server by the server by running `make build-ui`

## Testing

### Testing Frontend

e2e package uses [Cypress](https://cypress.io) to run browser automation tests, in order for it to work the server must run on port `4000`

the test flow creates a user and save a kubeconfig to disk at `e2e-test/data/kubeconfig/[username-template-timestamp]

use `make e2e` to run the tests

### Testing server

to run all test use `make gotest`
For testing the assertion library [testify](https://github.com/stretchr/testify) is used
