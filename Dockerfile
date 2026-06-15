ARG FFMPEG_IMAGE=datarhei/base:alpine-ffmpeg-latest
ARG GOLANG_IMAGE=golang:1.22-alpine3.19
ARG NODE_IMAGE=node:21-alpine3.20

# 1) Build the web UI.
FROM $NODE_IMAGE AS ui
WORKDIR /ui
COPY ui/package.json ui/yarn.lock ./
RUN yarn install --frozen-lockfile
COPY ui/ ./
ENV PUBLIC_URL="./"
RUN yarn build

# 2) Build the core binary with the UI embedded.
FROM --platform=$BUILDPLATFORM $GOLANG_IMAGE AS core
ARG TARGETOS TARGETARCH TARGETVARIANT
ENV GOOS=$TARGETOS GOARCH=$TARGETARCH GOARM=$TARGETVARIANT
WORKDIR /src
RUN apk add --no-cache git make
COPY . .
# Overwrite the committed placeholder with the freshly built UI before embedding.
COPY --from=ui /ui/build ./ui/build
RUN make release && make import && make ffmigrate

# 3) Runtime image on the FFmpeg base.
FROM $FFMPEG_IMAGE
COPY --from=core /src/core /core/bin/core
COPY --from=core /src/import /core/bin/import
COPY --from=core /src/ffmigrate /core/bin/ffmigrate
COPY --from=core /src/mime.types /core/mime.types
COPY run.sh /core/bin/run.sh
COPY ui-root /core/ui-root

RUN mkdir -p /core/config /core/data && ffmpeg -buildconf

# UI is embedded in the binary, so CORE_ROUTER_UI_PATH is intentionally unset.
ENV CORE_CONFIGFILE=/core/config/config.json
ENV CORE_DB_DIR=/core/config
ENV CORE_STORAGE_DISK_DIR=/core/data

EXPOSE 8080/tcp
EXPOSE 8181/tcp
EXPOSE 1935/tcp
EXPOSE 1936/tcp
EXPOSE 6000/udp

VOLUME ["/core/data", "/core/config"]
WORKDIR /core
ENTRYPOINT ["/core/bin/run.sh"]
