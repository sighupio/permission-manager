.DEFAULT_GOAL := help
SHELL := /bin/bash


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

# Targets

## dependencies: Install node packages for the ui
.PHONY: dependencies
dependencies:
	@npm install --prefix ./web-client
	@go get github.com/rakyll/statik
	@go mod download


## dev-dependencies: Install development helpers
.PHONY: dev-dependencies
dev-dependencies:
	@go get -u github.com/JulesGuesnon/Gomon

## test-dependencies: Install test dependecies
.PHONY: test-dependencies
test-dependencies:
	@npm install --prefix ./e2e-test

## ui: Build ui and statify it
.PHONY: ui
ui:
	@npm run build --prefix ./web-client
	@statik -f -src=./web-client/build

## permission-manager: Build go binary
permission-manager:
	@CGO_ENABLED=0 GOOS=linux go build -a -o permission-manager ./cmd/run-server.go

## test: Run server unit tests
.PHONY: test
test:
	@go test -v sighupio/permission-manager/...

## test-e2e: Run e2e test over a local port 4000
.PHONY: test-e2e
test-e2e:
	@cd e2e-test && yarn test

## test-release: Check dist folder and next tag for the release build
test-release:
	@goreleaser --snapshot --skip-publish --rm-dist
	@bumpversion --allow-dirty --dry-run --verbose minor

## run: Local development of the server
.PHONY: run
run: copy-kind-ca-crt
	@gomon cmd/run-server.go

## copy-kind-ca-crt: Extract ca from kind to use it in the server
.PHONY: copy-kind-ca-crt
copy-kind-ca-crt:
	@docker cp kind-control-plane:/etc/kubernetes/pki/ca.crt ~/.kind/ca.crt

## seed-cluster: Install CRD and pods for permission-manager
.PHONY: seed-cluster
seed-cluster:
	@kubectl apply -f k8s/k8s-seeds/namespace.yml
	@kubectl apply -f k8s/k8s-seeds

## deploy: Install deployment for permission-manager
.PHONY: deploy
deploy:
	@kubectl apply -f k8s/deploy.yaml

## port-forward: Connect port 4000 to pod permission-manager
.PHONY: port-forward
port-forward:
	@kubectl port-forward svc/permission-manager-service 4000 --namespace permission-manager

## delete-users: Remove users from crd
.PHONY: delete-users
delete-users:
	@kubectl delete -f k8s/k8s-seeds/user-crd-definition.yml && \
		kubectl apply -f k8s/k8s-seeds/user-crd-definition.yml

## clean: Remove artifacts
.PHONY: clean
clean:
	-@rm -rf permission-manager
	-@rm -rf statik/*
	-@rm -rf ./web-client/build
	-@rm -rf ./web-client/node_modules
	-@rm -rf ./e2e-test/node_modules
