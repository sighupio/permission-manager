FROM golang:1.14

WORKDIR /app
RUN apt-get update && apt-get install -y npm

ENTRYPOINT ["sleep", "100000000"]
