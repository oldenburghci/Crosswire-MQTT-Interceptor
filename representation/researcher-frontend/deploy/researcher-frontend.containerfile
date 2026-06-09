FROM docker.io/node:20.11-alpine3.18 AS build
COPY ./researcher-frontend /src/researcher-frontend
WORKDIR /src/researcher-frontend
RUN npm install --save && \
    npm run build

FROM docker.io/library/nginx:1.27.4
COPY --chmod=400 ./researcher-frontend/config/nginx.conf /etc/nginx/nginx.conf
COPY --chmod=500 ./researcher-frontend/deploy/create-cert.sh /docker-entrypoint.d/create-cert.sh
COPY --from=build /src/researcher-frontend/dist /usr/share/nginx/www/researcher-frontend

EXPOSE 80
EXPOSE 443