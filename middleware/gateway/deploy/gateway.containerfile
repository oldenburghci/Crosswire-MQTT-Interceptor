FROM docker.io/golang:1.23.4 AS build
# main
COPY ./gateway /src/gateway
# dependency
COPY ./user-management /src/user-management
WORKDIR /src/gateway
RUN go env -w CGO_ENABLED=0 && \
    go get -v --modfile=containerized.go.mod && \
    go mod tidy --modfile=containerized.go.mod
RUN go build --modfile=containerized.go.mod -o dist/main cmd/main.*go

FROM docker.io/library/alpine:3.20.6
COPY --chmod=500 --from=build /src/gateway/dist/main /srv/main
COPY --chmod=500 --from=build /src/gateway/deploy/create-cert.sh /srv/create-cert.sh
RUN apk add openssl -q

ENV DB_HOST="TO SET"
ENV DB_PORT="TO SET"
ENV DB_USER="TO SET"
ENV DB_PASSWD="TO SET"
ENV JWT_SECRET="TO SET"
ENV HOST="TO SET"
ENV PORT="9000"
ENV SHH_TOKEN="TO SET"
ENV SHH_ADDRESS="TO SET"
ENV MQTT_ERROR_INJECTION_ENGINE_REST_ADDRESS="TO SET"
ENV USER_MANAGEMENT_ADDRESS="TO SET"

EXPOSE 9000

ENTRYPOINT ["/bin/sh", "-c", "/srv/create-cert.sh && /srv/main"]