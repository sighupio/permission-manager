.DEFAULT_GOAL := help

# -------------------------------------------------------------------------------------------------
# Private variables
# -------------------------------------------------------------------------------------------------

_DOCKER_CHART_TESTING_IMAGE=quay.io/helmpack/chart-testing:v3.5.0
_DOCKER_FILELINT_IMAGE=cytopia/file-lint:latest-0.8
_DOCKER_HADOLINT_IMAGE=hadolint/hadolint:v2.12.0
_DOCKER_JSONLINT_IMAGE=cytopia/jsonlint:1.6.0
_DOCKER_MAKEFILELINT_IMAGE=cytopia/checkmake:latest-0.5
_DOCKER_MARKDOWNLINT_IMAGE=davidanson/markdownlint-cli2:v0.6.0
_DOCKER_SHELLCHECK_IMAGE=koalaman/shellcheck:v0.9.0
_DOCKER_SHFMT_IMAGE=mvdan/shfmt:v3
_DOCKER_YAMLLINT_IMAGE=cytopia/yamllint:1

_PROJECT_DIRECTORY=$(dir $(realpath $(firstword $(MAKEFILE_LIST))))

# -------------------------------------------------------------------------------------------------
# Utility functions
# -------------------------------------------------------------------------------------------------

# check-variable-%: Check if the variable is defined.
check-variable-%:
	@[[ "${${*}}" ]] || (echo '*** Please define variable `${*}` ***' && exit 1)

.PHONY: help
help: Makefile
	@printf "\nChoose a command run in $(shell basename ${PWD}):\n"
	@sed -n 's/^##//p' $< | column -t -s ":" |  sed -e 's/^/ /'
	@echo

# -------------------------------------------------------------------------------------------------
# Quality Targets
# -------------------------------------------------------------------------------------------------

# Lint ############################################################################################
.PHONY: lint
lint: lint-markdown lint-shell lint-yaml lint-dockerfile lint-makefile lint-json lint-file lint-helm-chart

.PHONY: lint-markdown
lint-markdown:
	@docker run --rm -v ${_PROJECT_DIRECTORY}:/data -w /data ${_DOCKER_MARKDOWNLINT_IMAGE} "**/*.md" "#web-client/node_modules"

.PHONY: lint-shell
lint-shell:
	@docker run --rm -v ${_PROJECT_DIRECTORY}:/data -w /data ${_DOCKER_SHELLCHECK_IMAGE} -a -o all -s bash **/*.sh

.PHONY: lint-yaml
lint-yaml:
	@docker run --rm $$(tty -s && echo "-it" || echo) -v ${_PROJECT_DIRECTORY}:/data ${_DOCKER_YAMLLINT_IMAGE} -c .rules/yamllint.yaml .

.PHONY: lint-dockerfile
lint-dockerfile:
	@docker run --rm -v ${_PROJECT_DIRECTORY}:/data -w /data ${_DOCKER_HADOLINT_IMAGE} hadolint Dockerfile

.PHONY: lint-makefile
lint-makefile:
	@docker run --rm -v ${_PROJECT_DIRECTORY}:/data ${_DOCKER_MAKEFILELINT_IMAGE} --config .rules/checkmake.ini Makefile

.PHONY: lint-json
lint-json:
	@docker run --rm -v ${_PROJECT_DIRECTORY}:/data ${_DOCKER_JSONLINT_IMAGE} -t '  ' -i './web-client/node_modules' *.json

.PHONY: lint-file
lint-file:
	@docker run --rm -v ${_PROJECT_DIRECTORY}:/data ${_DOCKER_FILELINT_IMAGE} file-cr \
	--text \
	--ignore '.git/,.github/,.vscode/,.idea/,static/build,web-client/node_modules,web-client/build' \
	--path .
	docker run --rm -v ${_PROJECT_DIRECTORY}:/data ${_DOCKER_FILELINT_IMAGE} file-crlf \
	--text \
	--ignore '.git/,.github/,.vscode/,.idea/,static/build,web-client/node_modules,web-client/build' \
	--path .
	docker run --rm -v ${_PROJECT_DIRECTORY}:/data ${_DOCKER_FILELINT_IMAGE} file-trailing-single-newline \
	--text \
	--ignore '.git/,.github/,.vscode/,.idea/,static/build,web-client/node_modules,web-client/build' \
	--path .
	docker run --rm -v ${_PROJECT_DIRECTORY}:/data ${_DOCKER_FILELINT_IMAGE} file-trailing-space \
	--text \
	--ignore '.git/,.github/,.vscode/,.idea/,static/build,web-client/node_modules,web-client/build' \
	--path .
	docker run --rm -v ${_PROJECT_DIRECTORY}:/data ${_DOCKER_FILELINT_IMAGE} file-utf8 \
	--text \
	--ignore '.git/,.github/,.vscode/,.idea/,static/build,web-client/node_modules,web-client/build' \
	--path .
	docker run --rm -v ${_PROJECT_DIRECTORY}:/data ${_DOCKER_FILELINT_IMAGE} file-utf8-bom \
	--text \
	--ignore '.git/,.github/,.vscode/,.idea/,static/build,web-client/node_modules,web-client/build' \
	--path .

.PHONY: lint-helm-chart
lint-helm-chart:
	@docker run -it -v ${_PROJECT_DIRECTORY}:/data -w /data ${_DOCKER_CHART_TESTING_IMAGE} ct lint \
	--charts helm_chart \
	--validate-maintainers=false \
	--config ct.yaml

# Format ##########################################################################################
.PHONY: format
format: format-markdown format-shell format-yaml format-dockerfile format-makefile format-json format-file

.PHONY: format-file
format-file:
	@docker run --rm -v ${_PROJECT_DIRECTORY}:/data ${_DOCKER_FILELINT_IMAGE} file-cr \
	--text \
	--ignore '.git/,.github/,.vscode/,.idea/,static/build,web-client/node_modules,web-client/build' \
	--fix \
	--path .
	@docker run --rm -v ${_PROJECT_DIRECTORY}:/data ${_DOCKER_FILELINT_IMAGE} file-crlf \
	--text \
	--ignore '.git/,.github/,.vscode/,.idea/,static/build,web-client/node_modules,web-client/build' \
	--fix \
	--path .
	@docker run --rm -v ${_PROJECT_DIRECTORY}:/data ${_DOCKER_FILELINT_IMAGE} file-trailing-single-newline \
	--text \
	--ignore '.git/,.github/,.vscode/,.idea/,static/build,web-client/node_modules,web-client/build' \
	--fix \
	--path .
	@docker run --rm -v ${_PROJECT_DIRECTORY}:/data ${_DOCKER_FILELINT_IMAGE} file-trailing-space \
	--text \
	--ignore '.git/,.github/,.vscode/,.idea/,static/build,web-client/node_modules,web-client/build' \
	--fix \
	--path .
	@docker run --rm -v ${_PROJECT_DIRECTORY}:/data ${_DOCKER_FILELINT_IMAGE} file-utf8 \
	--text \
	--ignore '.git/,.github/,.vscode/,.idea/,static/build,web-client/node_modules,web-client/build' \
	--fix \
	--path .
	@docker run --rm -v ${_PROJECT_DIRECTORY}:/data ${_DOCKER_FILELINT_IMAGE} file-utf8-bom \
	--text \
	--ignore '.git/,.github/,.vscode/,.idea/,static/build,web-client/node_modules,web-client/build' \
	--fix \
	--path .

.PHONY: format-markdown
format-markdown:
	@docker run --rm -v ${_PROJECT_DIRECTORY}:/data -w /data --entrypoint="markdownlint-cli2-fix" ${_DOCKER_MARKDOWNLINT_IMAGE} "**/*.md" "#web-client/node_modules"

.PHONY: format-shell
format-shell:
	@docker run --rm -v ${_PROJECT_DIRECTORY}:/data -w /data ${_DOCKER_SHFMT_IMAGE} -i 2 -ci -sr -w .

# Test ############################################################################################
# test: Run server unit tests
.PHONY: test
test:
	@go test -v sighupio/permission-manager/...

# test-e2e: Run e2e test in the kubectl current-context. Used for local development.
.PHONY: test-e2e
test-e2e: check-variable-CLUSTER_VERSION check-variable-KIND_VERSION check-variable-HELM_VERSION
	@./test/e2e/up.sh

# test-release: Check dist folder and next tag for the release build
test-release:
	@goreleaser --snapshot --skip-publish --rm-dist
	@bumpversion --allow-dirty --dry-run --verbose minor

# -------------------------------------------------------------------------------------------------
# Normal Targets
# -------------------------------------------------------------------------------------------------

# Development #####################################################################################
# dev-up: Start the local development environment with Tilt. 
# Use FORCE=true to recreate the self-signed TLS certificates.
.PHONY: dev-up

dev-up: check-variable-BASIC_AUTH_PASSWORD check-variable-CLUSTER_NAME check-variable-CLUSTER_VERSION check-variable-CONTROL_PLANE_ADDRESS check-variable-NAMESPACE check-variable-PORT
	@./development/up.sh $(CLUSTER_VERSION) $(FORCE)

# dev-down: Tears down the local development environment. 
# Use FORCE=true to delete local kind registry.
.PHONY: dev-down
dev-down:
	@./development/down.sh $(FORCE)

# Run #############################################################################################
# run: Run the permission-manager in local with the ui build
.PHONY: run
run:
	@cp -r ./web-client/build ./static/
	@go run ./cmd/run-server.go

# run-ui: Run the permission-manager ui in local
.PHONY: run-ui
run-ui:
	@yarn --cwd ./web-client start

# Build ###########################################################################################
# build: Build the permission-manager binary
.PHONY: build
build:
	@CGO_ENABLED=0 go build --tags=release -a -o permission-manager ./cmd/run-server.go

# build-ui: Build the permission-manager ui
.PHONY: build-ui
build-ui:
	@yarn --cwd ./web-client build

.PHONY: build-docker
build-docker: check-variable-IMAGE_TAG_NAME check-variable-BASIC_AUTH_PASSWORD check-variable-CLUSTER_NAME check-variable-CONTROL_PLANE_ADDRESS check-variable-NAMESPACE check-variable-PORT
	@docker build \
	--build-arg BASIC_AUTH_PASSWORD=${BASIC_AUTH_PASSWORD} \
	--build-arg CLUSTER_NAME=${CLUSTER_NAME} \
	--build-arg CONTROL_PLANE_ADDRESS=${CONTROL_PLANE_ADDRESS} \
	--build-arg NAMESPACE=${NAMESPACE} \
	--build-arg PORT=${PORT} \
	--target release \
	-t permission-manager:${IMAGE_TAG_NAME} \
	.

# Deploy ##########################################################################################
# deploy: Install deployment for permission-manager
.PHONY: deploy
deploy: check-variable-IMAGE_TAG_NAME check-variable-BASIC_AUTH_PASSWORD check-variable-CLUSTER_NAME check-variable-CONTROL_PLANE_ADDRESS check-variable-NAMESPACE
	@kubectl create namespace permission-manager
	@cat deployments/kubernetes/secret.yml | envsubst | kubectl apply -f -
	@kubectl apply -f deployments/kubernetes/seeds/crd.yml
	@kubectl apply -f deployments/kubernetes/seeds/seed.yml
	@echo "Deploying permission-manager:${IMAGE_TAG_NAME}"
	@cat deployments/kubernetes/deploy.yml | yq e 'select(document_index == 1).spec.template.spec.containers[0].image |= "permission-manager:${IMAGE_TAG_NAME}"' - | kubectl apply -f -
	@kubectl wait --for=condition=Available deploy/permission-manager -n permission-manager --timeout=300s

# deploy-helm: Install deployment for permission-manager using helm
.PHONY: deploy-helm
deploy-helm: check-variable-IMAGE_TAG_NAME check-variable-BASIC_AUTH_PASSWORD check-variable-CLUSTER_NAME check-variable-CONTROL_PLANE_ADDRESS check-variable-NAMESPACE
	@helm install permission-manager helm_chart -f helm_chart/values.yaml \
	 --namespace ${NAMESPACE} \
	 --set image.repository=permission-manager \
	 --set image.tag=${IMAGE_TAG_NAME} \
	 --set config.clusterName=${CLUSTER_NAME} \
	 --set config.controlPlaneAddress=${CONTROL_PLANE_ADDRESS} \
	 --set config.basicAuthPassword=${BASIC_AUTH_PASSWORD} \
