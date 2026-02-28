FROM docker.io/library/nginx:1.27.4
LABEL org.opencontainers.image.authors="tom.greeff@uni-oldenburg.de"

COPY ./config/nginx.conf /etc/nginx/nginx.conf
COPY ./create-cert.sh /docker-entrypoint.d/create-cert.sh
COPY ./dist /usr/share/nginx/www/researcher-frontend

RUN chmod u+x /docker-entrypoint.d/create-cert.sh

EXPOSE 80