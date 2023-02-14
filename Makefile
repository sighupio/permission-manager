.DEFAULT_GOAL := help

### UTILS ###

# check-variable-%: Check if the variable is defined.
check-variable-%:
	@[[ "${${*}}" ]] || (echo '*** Please define variable `${*}` ***' && exit 1)

.PHONY: help
help: Makefile
	@printf "\nChoose a command run in $(shell basename ${PWD}):\n"
	@sed -n 's/^##//p' $< | column -t -s ":" |  sed -e 's/^/ /'
	@echo
	
### LOCAL DEVELOPMENT ###

# dev-up: Start the local development environment with Tilt. Use FORCE=true to recreate the self-signed TLS certificates.
.PHONY: dev-up

dev-up: check-variable-BASIC_AUTH_PASSWORD check-variable-CLUSTER_NAME check-variable-CONTROL_PLANE_ADDRESS check-variable-NAMESPACE check-variable-PORT
	@./development/dev-up.sh $(FORCE)

# dev-down: Tears down the local development environment. Use FORCE=true to delete local kind registry.
.PHONY: dev-down
dev-down:
	@./development/dev-down.sh $(FORCE)
	
### RUN ###

# run: Run the permission-manager in local with the ui build
.PHONY: run
run: 
	@cp -r ./web-client/build ./static/
	@go run ./cmd/run-server.go

# run-ui: Run the permission-manager ui in local
.PHONY: run-ui
run-ui: 
	@yarn --cwd ./web-client start

### BUILD ###

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

### TEST ###

# test: Run server unit tests
.PHONY: test
test:
	@go test -v sighupio/permission-manager/...

# test-e2e: Run e2e test in the kubectl current-context. Used for local development.
.PHONY: test-e2e
test-e2e: check-variable-CLUSTER_VERSION check-variable-KIND_VERSION check-variable-HELM_VERSION
	@./e2e-test/e2e-up.sh

# test-release: Check dist folder and next tag for the release build
test-release:
	@goreleaser --snapshot --skip-publish --rm-dist
	@bumpversion --allow-dirty --dry-run --verbose minor

### DEPLOY ###
# deploy: Install deployment for permission-manager using helm
.PHONY: deploy
deploy: check-variable-IMAGE_TAG_NAME check-variable-BASIC_AUTH_PASSWORD check-variable-CLUSTER_NAME check-variable-CONTROL_PLANE_ADDRESS check-variable-NAMESPACE
	@helm install permission-manager helm_chart -f helm_chart/values.yaml \
	 --namespace ${NAMESPACE} \
	 --set image.repository=permission-manager \
	 --set image.tag=${IMAGE_TAG_NAME} \
	 --set config.clusterName=${CLUSTER_NAME} \
	 --set config.controlPlaneAddress=${CONTROL_PLANE_ADDRESS} \
	 --set config.basicAuthPassword=${BASIC_AUTH_PASSWORD} \

