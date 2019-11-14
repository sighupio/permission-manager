run: 
	go run main.go
dev:
	gomon .

build-ui:
	rm -r statik
	rm -r ./web-client/build

	npm run build --prefix ./web-client 
	statik -src=./web-client/build