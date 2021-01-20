FROM golang:1.14 as builder

RUN apt-get update && \
    apt-get install -y npm=5.8.0+ds6-4+deb10u2 && \
    npm install -g yarn@1.22.10

COPY ./ /app/
WORKDIR /app

RUN make clean dependencies ui permission-manager

FROM alpine:3.12

COPY --from=builder /app/permission-manager /permission-manager
EXPOSE 4000

CMD ["/permission-manager"]
