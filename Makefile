# run permission-manager
run:
	go run cmd/run-server.go

# execute go tests
gotest:
	go test sighupio/permission-manager/...

# execute e2e tests
e2e:
	cd e2e-test && yarn test

# compile the UI to a static go file
build-ui:
	rm -r statik
	rm -r ./web-client/build
	npm run build --prefix ./web-client 
	statik -src=./web-client/build


# apply to the cluster the test manifests
manifests-dev:
	kubectl apply -f k8s/k8s-seeds/namespace.yml
	kubectl apply -f k8s/k8s-seeds
	kubectl apply -f k8s/test-manifests


# run permission-manager using Kind
kind: kind-cluster manifests kind-run

# create a local Kind cluster
kind-cluster:
	kind create cluster --name permission-manager-dev --config hack/kind-config.yaml -q || true

# run and connect permission-manager to the local Kind cluster
kind-run:
	CLUSTER_NAME=kind-permission-manager-dev \
	CONTROL_PLANE_ADDRESS=https://127.0.0.1:61999 \
	BASIC_AUTH_PASSWORD=secret \
	PORT=4000 \
	go run cmd/run-server.go
