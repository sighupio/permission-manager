# How to contribute

This guide is for contributors to the Permission Manager development.

## Core concepts

Permission Manager consists of two main components:

- A backend server, written in Go, providing a users access management API built on top fo the K8s APIs
  - users are modeled as CRD objects stored, using the K8s APIs, into ETCD
- An single-page web application, built using the ReactJS framework
  - in production, the UI will be compiled to a go file using [statik](https://github.com/rakyll/statik), so that a single binary can be deployed to the K8s cluster
  - during development, the UI can be executed indipendently from the backend server in order to ease development iterations

Operators of the cluster can define permissions templates to be used by Permission Manager to create new Users declaring in the cluster `ClusterRole` objects with the following naming convention: `template-namespaced-resources___<template-name>`.

Note that in a future version of the software, the current naming convention will be replaced by CRDs and/or labels

## Development environment

### Requirements

- go (developed on v1.14)
- nodejs (developed on v13.1.0)
- [kind](https://github.com/kubernetes-sigs/kind)

### Setup a local development cluster

Permission Manager development requires access to a K8s cluster.
The easiest way to create a local Kubernetes cluster is to use [kind](https://github.com/kubernetes-sigs/kind).

To create a local kind cluster, run the `make kind-cluster` command. 

### Develop the Permission Manager server

The `make kind` command can be used to quickly bootstrap a local kind cluster and run the Permission Manager server.
Connect to http://localhost:4000 to access the UI. The default credentials are `admin:secret`.

Note that the UI served by the Permission Manager server is the content of the `statik/statik.go` file.
In order to update the file to the latest UI changes run the `make build-ui` command.

### Develop the Permission Manager frontend

The UI frontend source code is stored in the `web-client` folder.
In order to run the UI locally run the following commands

```
cd web-client
npm start
```

The UI will be accessible at http://localhost:3000, the server must be available at http://localhost:4000, e.g. with `make kind`.
In order to authenticate with the server, use the default credentials: `admin:secret`.

## Testing

### Permission Manager server Unit Tests

In order to run the server unit tests run `make gotest`.

### Permission Manager frontend E2E Tests

[Cypress](https://cypress.io) is used to run frontend e2e tests.
Make sure to run the server on the default port, http://localhost:4000, in order for them to work properly.

The tests creates a user and save a kubeconfig file to disk at `e2e-test/data/kubeconfig/[username-template-timestamp]
Use `make e2e` to run them

![e2e](./assets/e2e.gif)

## Publish a new release

To build and publish a new Permission Manager release run

```
make build-ui
docker build -t reg.sighup.io/sighup-products/permission-manager:x.x.x .
docker push reg.sighup.io/sighup-products/permission-manager:x.x.x
```
