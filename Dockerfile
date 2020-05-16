FROM golang:1.14 as builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main ./cmd/run-server.go

FROM alpine:3.9
WORKDIR /root/
COPY --from=builder /app/main .
EXPOSE 4000
CMD ["./main"]
