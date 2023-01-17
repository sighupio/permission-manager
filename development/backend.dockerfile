FROM golang:1.19

RUN go install github.com/cosmtrek/air@v1.41.0

WORKDIR /app

COPY ./go.mod go.sum ./

RUN go mod tidy

ENTRYPOINT air -c ./development/air.toml

