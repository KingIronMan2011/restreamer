# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This is a monorepo containing three sub-projects:

- **`core/`** — Go backend (datarhei/core v16). The main binary is the Restreamer API server.
- **`ui/`** — React/TypeScript frontend (restreamer-ui). Communicates with the core API.
- **`docker/`** — Docker bundle configuration that combines core + ui into the final Restreamer image.

The `docker/` folder is the deployable product; it references pre-built images of `core` and `ui`.

## Core (Go backend)

All commands run from `core/`:

```sh
make build          # Build the core binary
make test           # Run all tests with race detector
make run            # Build and run
make lint           # staticcheck static analysis
make vet            # go vet
make fmt            # go fmt
make commit         # vet + fmt + lint + test + build (pre-commit check)
make swagger        # Regenerate Swagger docs (requires swag)
make gqlgen         # Regenerate GraphQL from schema
make coverage       # Generate HTML coverage report in test/cover.html
```

Run a single test package:

```sh
go test -race -v ./restream/...
```

Install dev tools once:

```sh
make init   # installs staticcheck, swag, gqlgen, govulncheck
```

Config file location is resolved via `CORE_CONFIGFILE` env var; defaults are handled in `config/store/location.go`.

### Core Architecture

- **`main.go`** → creates `app/api.API`, starts it, handles SIGINT for graceful shutdown.
- **`app/api/api.go`** — wires together all subsystems: `restream`, `ffmpeg`, filesystems (`diskfs`/`memfs`/`s3fs`), `rtmpserver`, `srtserver`, HTTP server, sessions, Prometheus metrics, Let's Encrypt (certmagic).
- **`restream/`** — core process management. Manages FFmpeg processes (start/stop/state), stores process configs, tracks progress.
- **`ffmpeg/`** — FFmpeg binary wrapper, output parser (`parse/`), and validator.
- **`http/`** — Echo-based HTTP server. `handler/` has REST handlers; `graph/` has GraphQL (gqlgen); `api/` has the route definitions. Swagger docs live in `docs/`.
- **`config/`** — Config loading, versioned schemas (`v1/`, `v2/`), validation via `value/`, and variable substitution via `vars/`.
- **`io/fs/`** — Filesystem abstractions: disk, in-memory, S3 (MinIO), and sized variants.
- **`rtmp/`**, **`srt/`** — Built-in RTMP and SRT servers (using datarhei/joy4 and datarhei/gosrt).
- **`session/`** — Viewer/bandwidth session tracking.
- **`monitor/`** — Resource monitoring (CPU, memory, disk); optionally exported via `prometheus/`.
- **`service/`** — Long-running service abstraction used by the API lifecycle.
- **`app/import/`** — Standalone binary for migrating v1 process configs to the current format. Fixtures in `app/import/fixtures/` are used for import tests.

## UI (React frontend)

All commands run from `ui/`. Uses Yarn (see `.yarnrc.yml`).

```sh
yarn start            # Dev server
yarn build            # Production build
yarn test             # Interactive test runner
yarn test-ci          # Non-interactive tests
yarn test-coverage    # Coverage report
yarn i18n-extract     # Extract i18n strings (lingui)
yarn i18n-compile     # Compile i18n catalogs
yarn format           # Prettier format
```

### UI Architecture

- **`src/views/`** — Page-level React components (wizard, dashboard, publications, settings, etc.).
- **`src/hooks/`** — Custom React hooks, including the API client hook.
- **`src/contexts/`** — React contexts for auth, config, and API state.
- **`src/utils/`** — Utility functions (API wrappers, helpers).
- **`src/locales/`** — i18n catalogs (lingui). Add translations via POEditor; compile with `yarn i18n-compile`.
- **`src/theme/`** — MUI theme configuration.

The UI targets the core REST API and GraphQL endpoint. Auth is via JWT (or optionally Auth0).

## Docker Bundle

The `docker/Dockerfile` pulls pre-built `FFMPEG_IMAGE`, `CORE_IMAGE`, and `RESTREAMER_UI_IMAGE` and combines them. Use `run.sh` to launch locally. Default ports: `8080` (HTTP), `8181` (HTTPS), `1935/1936` (RTMP), `6000/udp` (SRT).
