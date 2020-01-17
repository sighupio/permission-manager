# how to contribute

this guide is for contributing on the development of the Permission Manager itself

## requirements

## using kind

## setup

```bash
kubectl apply -f k8s/k8s-seeds/namespace.yml
kubectl apply -f k8s/k8s-seeds
kubectl apply -f k8s/test-manifests // Optional
```

## Frontend development

Basic Auth is protecting the API server, in development the credentials are

username: `admin`  
password: `secret`

## testing

### UI

e2e package uses [Cypress](https://cypress.io) to run browser automation tests, in order for it to work the server must run on port `4000`

### server
