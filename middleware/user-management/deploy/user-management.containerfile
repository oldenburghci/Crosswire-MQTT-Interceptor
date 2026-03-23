FROM docker.io/golang:1.23.4 AS build
# main
COPY ./user-management /src/user-management
# dependencies from other package
COPY ./gateway /src/gateway
WORKDIR /src/user-management
RUN go env -w CGO_ENABLED=0 && \
#   commented to fix "no package to get" error during build, activate if packages
#     go get -v --modfile=containerized.go.mod && \
    go mod tidy --modfile=containerized.go.mod
RUN go build --modfile=containerized.go.mod -o dist/main cmd/main.*go

FROM docker.io/library/alpine:3.20.6
COPY --chmod=500 --from=build /src/user-management/dist/main /srv/main
COPY --chmod=500 --from=build /src/user-management/deploy/create-cert.sh /srv/create-cert.sh
RUN apk add openssl -q

ENV HOST="TO SET"
ENV PORT="9010"
ENV PASSWD_SALT="TO SET"
ENV JWT_SECRET="TO SET"
ENV DB_HOST="TO SET"
ENV DB_PORT="TO SET"
ENV DB_USER="TO SET"
ENV DB_PASSWD="TO SET"

EXPOSE 9010

ENTRYPOINT ["/bin/sh", "-c", "/srv/create-cert.sh && /srv/main"]