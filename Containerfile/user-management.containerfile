FROM docker.io/library/alpine:3.20.6
LABEL org.opencontainers.image.authors="tom.greeff@uni-oldenburg.de"

ENV HOST="localhost"
ENV PORT="9010"
ENV PASSWD_SALT="TO SET"
ENV JWT_SECRET="TO SET"
ENV DB_HOST="TO SET"
ENV DB_PORT="TO SET"
ENV DB_USER="TO SET"
ENV DB_PASSWD="TO SET"

COPY ./dist/main /srv/main
COPY ./create-cert.sh /srv/create-cert.sh
COPY ./config /srv/config
RUN chmod u+x /srv/create-cert.sh
RUN apk add openssl -q

ENTRYPOINT ["/bin/sh", "-c", "/srv/create-cert.sh && cd /srv && ./main"]