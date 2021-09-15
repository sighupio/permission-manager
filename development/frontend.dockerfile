FROM golang:1.16

RUN apt-get update && apt-get install -y npm=7.5.2+ds-2

RUN npm install -g yarn@1.22.11

RUN mkdir -p /app/web-client

COPY ./development/frontend.sh /frontend.sh

RUN chmod +x /frontend.sh

ENTRYPOINT ["/frontend.sh"]
