# this docker file is used for the release
FROM golang:1.16 as builder

WORKDIR /app
COPY go.mod go.sum ./
RUN apt-get update && apt-get install -y npm=7.5.2+ds-2
RUN npm install -g yarn@1.22.11
COPY ./ /app/
RUN make clean dependencies ui permission-manager

FROM alpine:3.13 as release
WORKDIR /root/
COPY --from=builder /app/permission-manager .
EXPOSE 4000
CMD ["./permission-manager"]

FROM golang:1.16 as development
ENV CGO_ENABLED=0
ENV XDG_CACHE_HOME="/tmp/.cache"

ARG NETRC_FILE
RUN echo ${NETRC_FILE} > /root/.netrc

WORKDIR /app
COPY go.mod go.mod
COPY go.sum go.sum

RUN go mod download

COPY cmd cmd
COPY internal internal
COPY statik statik

RUN go build -a -o bin/permission-manager cmd/run-server.go

EXPOSE 4000
ENTRYPOINT ["/app/bin/permission-manager"]