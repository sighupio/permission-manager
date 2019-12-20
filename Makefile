run: 
	go run main.go
dev:
	CLUSTER_NAME=minikube CONTROL_PLANE_ADDRESS=https://192.168.64.33:8443 BASIC_AUTH_PASSWORD=secret gomon cmd/run-server.go

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

