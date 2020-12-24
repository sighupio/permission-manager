FROM golang:1.14

RUN apt-get update && apt-get install -y npm=5.8.0+ds6-4+deb10u2

RUN npm install -g yarn

RUN mkdir -p /app/web-client

COPY ./development/frontend.sh /frontend.sh

RUN chmod +x /frontend.sh

ENTRYPOINT ["/frontend.sh"]
