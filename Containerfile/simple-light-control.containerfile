FROM docker.io/library/nginx:1.27.4
LABEL org.opencontainers.image.authors="tom.greeff@uni-oldenburg.de"

COPY ./config/nginx.conf /etc/nginx/nginx.conf
COPY ./dist /usr/share/nginx/www/simple-light-control

EXPOSE 80