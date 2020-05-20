FROM golang:1.14 as builder

WORKDIR /app
COPY go.mod go.sum ./
RUN apt-get update && apt-get install -y npm
COPY ./ /app/
RUN make dependencies ui permission-manager

FROM alpine:3.9
WORKDIR /root/
COPY --from=builder /app/permission-manager .
EXPOSE 4000
CMD ["./permission-manager"]
