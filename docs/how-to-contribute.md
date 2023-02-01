# How to contribute

This guide is for contributors to the Permission Manager development.
## Install Requirements
In order to setup the development environment you need to install the requirements listed above.
- bats 1.8.2
- go 1.19
- kind 0.17.0
- kubectl >= 1.23
- make 4.1
- nodejs 18.0.0
- yarn 1.22.11
- yq 4.30.8

You can use your preferred package manager to install the requirements but we recommend to use [asdf](https://asdf-vm.com/#/) and [direnv](https://direnv.net/) that we actually use to manage the development environment.

### Use asdf and direnv
1. Install and configure asdf and direnv as described in the [official documentation](https://asdf-vm.com/#/core-manage-asdf-vm?id=install) and [this article](https://direnv.net/docs/installation.html)
2. Add the required asdf plugins to your asdf installation
``` shell
asdf plugin-add bats
asdf plugin-add direnv
asdf plugin-add golang
asdf plugin-add helm
asdf plugin-add jq
asdf plugin-add kind
asdf plugin-add kubectl
asdf plugin-add make
asdf plugin-add nodejs
asdf plugin-add yarn
```
3. Run ```asdf install```, it will install all the required versions of the tools listed in the ```.tool-versions``` file that we provide.

4. Run ```direnv allow``` to load the local environment from the ```.envrc``` file. We provide a ```.envrc.example``` file that you can use as a template

## Start the development environment

### Build the UI static files
In order to start the development environment we have at first bundle the UI static files that will be served by the backend.

```
make dependencies ui
```

This will update all frontend dependencies and generate the UI files in the `static/build` folder.

### Start the Development Environment
Execute the following command to start environment:

```shell script
make development-up CLUSTER_VERSION=<k8s-version>
```

> ⚠️ IMPORTANT
> If you are not using direnv, you must load the environment variables with `source .env-cluster` before running the command.


The `make development-up` command will create a kind cluster, load the images with docker-compose and start the development environment.

> The frontend container will install node_modules after the boot, so it could take some time before it's ready.

#### Teardown

```shell script
make development-down
```

### Approach B: Build Docker Image and deploy it to kind

#### TL;DR
```
kind create cluster --config=./development/kind-config.yml --kubeconfig=./.kubeconfig
source .env-cluster # if you don't use direnv
make seed build deploy
make port-forward &
```
#### Steps explanation

- The `kind create cluster` command can be used to quickly bootstrap a local Kubernetes cluster.
- Load the environment variables with `source .env-cluster`
- Then you should load permission-manager by running `make seed`. It will take information for your current context.
- You must create a container image with local code wit `make build`. It will push it to kind with the commit_sha.
- Once it's in kind you update the deploy.yml with the image tag and publish it in k8s with `make deploy` command.
- finally exposing the project with `make port-forward` will allow you to connect to the permission-manager
  in localhost:4000 with default credentials `admin:admin`.

### Develop the Permission Manager frontend

The UI frontend source code is stored in the `web-client` folder.

Once the container is done building, you can start developing the UI: the page will refresh automatically after every change.
The UI will be accessible at http://localhost:4001, while the backend will be available at http://localhost:4002.
In order to authenticate to the service using http auth, use `admin:admin`.

## Testing

### Unit Tests

In order to run the server unit tests run `make test`.

### E2E Tests

The E2E tests provide to create a k8s cluster using `kubectl` and `kind` to the version that you specify the `CLUSTER_VERSION` and `KIND_VERSION` variables.

So, Executing the `make test-e2e` command will create a kind cluster, install the CRDs, deploy the Permission Manager and run the E2E tests.


> All dependencies and configurations we'll be installed and removed automatically.

``` shell
CLUSTER_NAME=<your cluster name> \
CLUSTER_VERSION=<your cluster version> \
KIND_VERSION=<your kind version> \
make test-e2e
```
## Publish a new release
To build and publish a new Permission Manager release run

```
bumpversion {mayor,minor,patch}
git push
git push --tags
```
