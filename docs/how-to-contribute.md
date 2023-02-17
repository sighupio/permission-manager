# How to contribute

This guide is for contributors to the Permission Manager development.

## Install Requirements

In order to setup the development environment you need to install the requirements listed above.

- bats 1.8.2
- ctlptl 0.8.16
- golang 1.19
- helm 3.11.1
- jq 1.6
- kind 0.17.0
- kubectl 1.26.0
- make 4.1
- mkcert 1.4.4
- nodejs 18.0.0
- tilt 0.31.1
- yarn 1.22.11
- yq 4.30.8

You can use your preferred package manager to install the requirements but we recommend to use [asdf](https://asdf-vm.com/#/) and [direnv](https://direnv.net/) that we actually use to manage the development environment.

### Use asdf and direnv

1. Install and configure asdf and direnv as described in the [official documentation](https://asdf-vm.com/#/core-manage-asdf-vm?id=install) and [this article](https://blog.sighup.io/manage-tools-with-ease-direnv-asdf/)
2. Add the required asdf plugins to your asdf installation

    ``` shell
    asdf plugin-add bats
    asdf plugin-add ctlptl
    asdf plugin-add direnv
    asdf plugin-add golang
    asdf plugin-add helm
    asdf plugin-add jq
    asdf plugin-add kind
    asdf plugin-add kubectl
    asdf plugin-add make
    asdf plugin-add mkcert
    asdf plugin-add nodejs
    asdf plugin-add tilt
    asdf plugin-add yarn
    asdf plugin-add yq
    ```

3. Run ```asdf install```, it will install all the required versions of the tools listed in the ```.tool-versions``` file that we provide.

4. Run ```direnv allow``` to load the local environment from the ```.envrc``` file. We provide a ```.envrc.example``` file that you can use as a template

## Development

We choose to use Tilt for our development environment. Tilt is a tool that allows you to develop your application in a local Kubernetes cluster. It watches your code and automatically rebuilds and deploys your application when you change code.

### Start the development environment

We provide a Makefile's target that contains all you need to start the development environment. Just run the following command:

``` shell
make dev-up
```

This command will:

1. Setup the self-signed TLS certificates for the ingress to work (it install the CA certificate to your browser's trusted certificates) using [mkcert]("https://mkcert.org/")

    > **IMPORTANT**: If you are using NixOS you need to add the CA certificate to the trusted certificates manually. You can find the CA certificate in the `certs` directory.

2. Start the local Kubernetes cluster and Tilt using our provided [Tiltfile](/Tiltfile). Tilt will build and push the Permission Manager image and deploy it using the Helm chart into the cluster using the local environment variables declared in ```.envrc``` or ```.env-cluster``` file.

    > **NOTE**: Remember to add ```0.0.0.0 permission-manager.dev``` line to your /etc/hosts file to be able to access the Permission Manager UI from ```https://permission-manager.dev```.

## Testing

### Unit Tests

In order to run the server unit tests run `make test`.

### E2E Tests

The E2E tests provide to create a k8s cluster using `helm` and `kind` to the version that you specify the `CLUSTER_VERSION`,`KIND_VERSION`, `HELM_VERSION` variables.

So, Executing the `make test-e2e` command will create a kind cluster, install the CRDs, deploy the Permission Manager and run the E2E tests.

``` shell
CLUSTER_NAME=<your cluster name> \
CLUSTER_VERSION=<your cluster version> \
KIND_VERSION=<your kind version> \
HELM_VERSION=<your helm version> \
make test-e2e
```

## Publish a new release

To build and publish a new Permission Manager release run

``` shell
bumpversion {mayor,minor,patch}
git push
git push --tags
```
