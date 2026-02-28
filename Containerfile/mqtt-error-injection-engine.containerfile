FROM docker.io/library/alpine:3.20.6
LABEL org.opencontainers.image.authors="tom.greeff@uni-oldenburg.de"

ENV REST_ENGINE_PORT="TO SET"
ENV REST_ENGINE_HOST="TO SET"
ENV MQTT_ENGINE_PORT="TO SET"
ENV MQTT_ENGINE_HOST="TO SET"
ENV BROKER_PASSWD="TO SET"
ENV BROKER_USERNAME="TO SET"
ENV FULL_BROKER_ADDR="TO SET"

COPY ./dist/main /srv/main
COPY ./create-cert.sh /srv/create-cert.sh
RUN chmod u+x /srv/create-cert.sh
RUN apk add openssl -q

ENTRYPOINT ["/bin/sh", "-c", "/srv/create-cert.sh && cd /srv && ./main"]