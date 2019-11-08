FROM golang:latest as builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
RUN go get github.com/rakyll/statik
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

FROM alpine:latest  
RUN apk --no-cache add ca-certificates
RUN apk upgrade --update-cache --available && \
    apk add openssl && \
    rm -rf /var/cache/apk/*
WORKDIR /root/
COPY --from=builder /app/main .
EXPOSE 4000
CMD ["./main"]
