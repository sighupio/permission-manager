FROM golang:1.14

RUN go get -u github.com/cosmtrek/air

WORKDIR /app

COPY ./go.mod go.sum ./

RUN go mod download

ENTRYPOINT air -c air.toml

