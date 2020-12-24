FROM golang:1.14

ARG KUBECONFIG_PATH

RUN go get -u github.com/radovskyb/watcher/...

WORKDIR /app

COPY ./go.mod go.sum ./

RUN go mod download

ENTRYPOINT watcher -cmd="go run ./cmd/run-server.go" -ignore="./web-client" -startcmd="true" -keepalive

