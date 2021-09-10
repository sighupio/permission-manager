.DEFAULT_GOAL := help
SHELL := /bin/bash
BASIC_AUTH_PASSWORD ?= admin
KIND_CLUSTER_NAME = "kind"

local-container = permission-manager:$(shell git rev-parse HEAD)

# Helpers

.PHONY: help
help: Makefile
	@printf "\nChoose a command run in $(shell basename ${PWD}):\n"
	@sed -n 's/^##//p' $< | column -t -s ":" |  sed -e 's/^/ /'
	@echo

#branch-%: Prevents to launch a command if is not in the correct branch
branch-%:
	$(if $(filter-out $(shell git rev-parse --abbrev-ref HEAD), $*), $(error Please swith to branch `$*` ***))

#gitclean: Prevents to launch a command if git has untracked modifications
gitclean:
ifndef GIT_UNCLEAN
	$(if $(shell git status -s), $(error Git is tainted:: $(shell git status -s) ***),)
endif

# Local Development

## development-up: Brings up local development environment
.PHONY: development-up
development-up:
	@./development/dev-up.sh

## development-down: Tears down the local development environment
.PHONY: development-down
development-down:
	@./development/dev-down.sh

# Targets

# dependencies: Install node packages for the ui
.PHONY: dependencies
dependencies:
	@yarn --cwd ./web-client install
	@go get github.com/rakyll/statik
	@go mod download


# test-dependencies: Install test dependecies
.PHONY: test-dependencies
test-dependencies:
	@yarn --cwd ./e2e-test install

# ui: Build ui and statify it
.PHONY: ui
ui:
	@yarn --cwd ./web-client build
	@statik -f -src=./web-client/build

# permission-manager: Build go binary
.PHONY: permission-manager
permission-manager:
	@CGO_ENABLED=0 GOOS=linux go build -a -o permission-manager ./cmd/run-server.go

## test: Run server unit tests
.PHONY: test
test:
	@go test -v sighupio/permission-manager/...

# test-e2e: Run e2e test in the kubectl current-context. Used in the pipeline.
.PHONY: test-e2e
test-e2e: build
	@bats -t tests/setup.sh && bats -t tests/create-user.sh
	@cd e2e-test && yarn install && yarn test

## test-e2e-local: Runs e2e test on the local machine
.PHONY: test-e2e-local
test-e2e-local:
	@./development/e2e-up.sh

## test-e2e-local-down: Tears down the e2e environment once the tests are done
.PHONY: test-e2e-local-down
test-e2e-local-down:
	@./development/e2e-down.sh

# test-release: Check dist folder and next tag for the release build
test-release:
	@goreleaser --snapshot --skip-publish --rm-dist
	@bumpversion --allow-dirty --dry-run --verbose minor

# seed: configure permission-manager
.PHONY: seed
seed:
	-@kubectl create namespace permission-manager
	@cat ./development/manifests/permission-manager-secret.yml | envsubst | kubectl apply -f -
	@kubectl apply -f deployments/kubernetes/seeds/crd.yml
	@kubectl apply -f deployments/kubernetes/seeds/seed.yml

# build: local deployment of the current sha
build:
	@docker build . -t ${local-container}
	@kind load docker-image ${local-container} --name $(KIND_CLUSTER_NAME)

# deploy: Install deployment for permission-manager
.PHONY: deploy
deploy: 
	@yq w deployments/kubernetes/deploy.yml -d1  \
		spec.template.spec.containers.[0].image ${local-container} \
		| kubectl apply -f -
	@kubectl wait --for=condition=Available deploy/permission-manager -n permission-manager --timeout=300s

# port-forward: Connect port 4000 to pod permission-manager
.PHONY: port-forward
port-forward:
	@kubectl port-forward svc/permission-manager 4000 --namespace permission-manager

# clean: Remove artifacts
.PHONY: clean
clean:
	-@rm -rf permission-manager
	-@rm -rf statik/*

# wipe:
.PHONY: wipe
wipe:
	-@rm -rf ./web-client/build
	-@rm -rf ./web-client/node_modules
	-@rm -rf ./e2e-test/node_modules
