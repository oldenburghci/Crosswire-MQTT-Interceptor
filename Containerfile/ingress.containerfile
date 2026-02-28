FROM docker.io/library/nginx:1.29.0
LABEL org.opencontainers.image.authors="tom.greeff@uni-oldenburg.de"

COPY --chmod=0555 ./write-nginx-config.sh /docker-entrypoint.d/write-nginx-config.sh
COPY --chmod=0555 ./create-cert.sh /docker-entrypoint.d/create-cert.sh


# RUN chmod u+x /docker-entrypoint.d/create-cert.sh

EXPOSE 80
EXPOSE 443
