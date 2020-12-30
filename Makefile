.DEFAULT_GOAL := help
SHELL := /bin/bash
BASIC_AUTH_PASSWORD ?= admin

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

.PHONY: development-start
development-start:
	@./development/dev-start.sh

.PHONY: development-down
development-down:
	@./development/dev-down.sh

# Targets

## dependencies: Install node packages for the ui
.PHONY: dependencies
dependencies:
	@yarn --cwd ./web-client install
	@go get github.com/rakyll/statik
	@go mod download


## test-dependencies: Install test dependecies
.PHONY: test-dependencies
test-dependencies:
	@yarn --cwd ./e2e-test install

## ui: Build ui and statify it
.PHONY: ui
ui:
	@yarn --cwd ./web-client build
	@statik -f -src=./web-client/build

## permission-manager: Build go binary
.PHONY: permission-manager
permission-manager:
	@CGO_ENABLED=0 GOOS=linux go build -a -o permission-manager ./cmd/run-server.go

## test: Run server unit tests
.PHONY: test
test:
	@go test -v sighupio/permission-manager/...

## test-e2e: Run e2e test in the kubectl current-context
.PHONY: test-e2e
test-e2e:
	@bats -t tests/setup.sh && bats -t tests/create-user.sh
	@cd e2e-test && yarn install && yarn test

.PHONY: test-e2e-local-up
test-e2e-local-up:
	@./development/e2e-start.sh

.PHONY: test-e2e-local-down
test-e2e-local-down:
	@./development/e2e-down.sh

## test-release: Check dist folder and next tag for the release build
test-release:
	@goreleaser --snapshot --skip-publish --rm-dist
	@bumpversion --allow-dirty --dry-run --verbose minor

## seed: configure permission-manager
.PHONY: seed
seed:
	-@kubectl create namespace permission-manager
	@echo -e '---\n\
	apiVersion: v1\n\
	kind: Secret\n\
	metadata:\n\
	  name: permission-manager\n\
	  namespace: permission-manager\n\
	type: Opaque\n\
	stringData:\n\
	  PORT: "4000"\n\
	  CLUSTER_NAME: "${CLUSTER_NAME}"\n\
	  CONTROL_PLANE_ADDRESS: "${CONTROL_PLANE_ADDRESS}" \n\
	  BASIC_AUTH_PASSWORD: "${BASIC_AUTH_PASSWORD}"' | kubectl apply -f -
	@kubectl apply -f deployments/kubernetes/seeds/crd.yml
	@kubectl apply -f deployments/kubernetes/seeds/seed.yml

## build: local deployment of the current sha
build:
	@docker build . -t ${local-container}
	@kind load docker-image ${local-container}

## deploy: Install deployment for permission-manager
.PHONY: deploy
deploy: 
	@yq w deployments/kubernetes/deploy.yml -d1  \
		spec.template.spec.containers.[0].image ${local-container} \
		| kubectl apply -f -

## port-forward: Connect port 4000 to pod permission-manager
.PHONY: port-forward
port-forward:
	@kubectl port-forward svc/permission-manager 4000 --namespace permission-manager

## clean: Remove artifacts
.PHONY: clean
clean:
	-@rm -rf permission-manager
	-@rm -rf statik/*

## wipe:
.PHONY: wipe
wipe:
	-@rm -rf ./web-client/build
	-@rm -rf ./web-client/node_modules
	-@rm -rf ./e2e-test/node_modules
