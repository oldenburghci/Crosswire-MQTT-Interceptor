FROM docker.io/golang:1.23.4 AS build
COPY ./mqtt-error-injection-engine /src/mqtt-error-injection-engine
WORKDIR /src/mqtt-error-injection-engine
RUN go env -w CGO_ENABLED=0 && \
    go get -v --modfile=containerized.go.mod && \
    go mod tidy --modfile=containerized.go.mod
RUN go build --modfile=containerized.go.mod -o dist/main cmd/main.*go

FROM docker.io/library/alpine:3.20.6
COPY --chmod=500 --from=build /src/mqtt-error-injection-engine/dist/main /srv/main
COPY --chmod=500 --from=build /src/mqtt-error-injection-engine/deploy/create-cert.sh /srv/create-cert.sh
RUN apk add openssl -q

ENV REST_ENGINE_PORT="8080"
ENV REST_ENGINE_HOST="TO SET"
ENV MQTT_ENGINE_PORT="1883"
ENV MQTT_ENGINE_HOST="TO SET"
# set if forwarding to a remote mqtt broker is required
ENV BROKER_PASSWD="TO SET"
ENV BROKER_USERNAME="TO SET"
ENV FULL_BROKER_ADDR="TO SET"

EXPOSE 1883
EXPOSE 8080

WORKDIR "/srv"

ENTRYPOINT ["/bin/sh", "-c", "/srv/create-cert.sh && /srv/main"]