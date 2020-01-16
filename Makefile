run: 
	go run main.go

copy-kind-ca-crt:
	docker cp kind-control-plane:/etc/kubernetes/pki ~/.kind

dev:
	$(MAKE) copy-kind-ca-crt
	CA_CRT_PATH=~/.kind/ca.crt \
	CLUSTER_NAME=local-kind-development \
	CONTROL_PLANE_ADDRESS=https://127.0.0.1:64970 \
	BASIC_AUTH_PASSWORD=secret \
	PORT=4000 \
	gomon cmd/run-server.go



build-ui:
	rm -r statik
	rm -r ./web-client/build

	npm run build --prefix ./web-client 
	statik -src=./web-client/build

delete-users:
	kubectl delete -f ./crd/user-crd-definition.yml && kubectl apply -f ./crd/user-crd-definition.yml

release-image:
	docker build -t reg.sighup.io/sighup-products/permission-manager:1.0.0 .
	docker push reg.sighup.io/sighup-products/permission-manager:1.0.0
	
forward-service:
	kubectl port-forward svc/permission-manager-service 4000 --namespace permission-manager	

