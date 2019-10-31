rm -r statik
rm -r ./web-client/build

npm run build --prefix ./web-client 
statik -src=./web-client/build