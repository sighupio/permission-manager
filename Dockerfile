FROM golang:1.14 as builder

WORKDIR /app
COPY go.mod go.sum ./
RUN apt-get update && apt-get install -y npm=5.8.0+ds6-4+deb10u2
RUN npm install -g yarn@1.22.10
COPY ./ /app/
RUN make clean dependencies ui permission-manager

FROM alpine:3.9
WORKDIR /root/
COPY --from=builder /app/permission-manager .
EXPOSE 4000
CMD ["./permission-manager"]
