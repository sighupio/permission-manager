## BACKEND ##
FROM golang:1.19.5-alpine3.17 as go-base

ENV GOCACHE=/tmp/.go/cache
ENV GOMODCACHE=/tmp/.go/modcache
ENV GOTMPDIR=/tmp/.go/tmp
ENV CGO_ENABLED=0

ARG CLUSTER_NAME
ARG NAMESPACE
ARG PORT
ARG CONTROL_PLANE_ADDRESS
ARG BASIC_AUTH_PASSWORD

ENV CLUSTER_NAME=${CLUSTER_NAME}
ENV CONTROL_PLANE_ADDRESS=${CONTROL_PLANE_ADDRESS}
ENV NAMESPACE=${NAMESPACE}
ENV PORT=${PORT}
ENV BASIC_AUTH_PASSWORD=${BASIC_AUTH_PASSWORD}

RUN mkdir -p /tmp/.go/cache /tmp/.go/modcache /tmp/.go/tmp /app

WORKDIR /app

COPY go.mod go.mod
COPY go.sum go.sum

RUN go mod download

COPY cmd cmd
COPY internal internal

FROM go-base as development

ENTRYPOINT ["go", "run", "cmd/run-server.go"]

FROM go-base as builder
RUN go build --tags=release -o permission-manager cmd/run-server.go

FROM scratch as release

WORKDIR /app
COPY --from=builder /app/permission-manager /app/permission-manager
EXPOSE 4000

ENTRYPOINT ["./permission-manager"]
