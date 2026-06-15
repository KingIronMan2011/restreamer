# Merge Restreamer into a Single Flat Project — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collapse the three nested sub-projects (`core/`, `ui/`, `docker/`) into one flat, self-owned repository whose primary artifact is a single Go binary with the web UI embedded, plus a thin Docker image that adds FFmpeg.

**Architecture:** The Go core becomes the repository root (its module path `github.com/datarhei/core/v16` is unchanged, so no Go imports need editing). The React app stays in a single `ui/` subfolder as a build input; its compiled output is embedded into the Go binary via `//go:embed`, so the running binary self-serves the UI with no external static directory. A single root `Dockerfile` builds UI → builds core (with UI embedded) → layers onto an FFmpeg base. The standalone `core/`, `ui/`, and `docker/` Dockerfiles/CI/metadata are reconciled into one set at the root.

**Tech Stack:** Go 1.22 (Echo v4, `embed`), React 18 / react-scripts / Yarn (lingui, MUI), Docker multi-stage, GitHub Actions.

---

## Spec

### Current state (what we're changing)

The three components live in one git repo (merged earlier via `git subtree`) but are only integrated **at the Docker image layer**:

- `ui/` builds to static files (`PUBLIC_URL="./"`) — a plain React build, served by Caddy in its standalone image.
- `core/` (Go) serves a static directory at the `/ui` route, configured by `CORE_ROUTER_UI_PATH` (`config.Router.UIPath`). See `core/http/server.go:357-372` and `core/http/router/router.go`.
- `docker/Dockerfile` glues **three pre-built images** — `RESTREAMER_UI_IMAGE` + `CORE_IMAGE` + `FFMPEG_IMAGE` — copying `/ui/build` into `/core/ui` and pointing `CORE_ROUTER_UI_PATH=/core/ui`.

There is no source-level integration: the bundle depends on separately published `datarhei/*` images, and each piece keeps its own toolchain, Dockerfile, CI, README, CHANGELOG, LICENSE, and SECURITY.md.

### Decisions (from brainstorming)

1. **Target artifact:** one self-contained Go binary (UI embedded) **and** a thin Docker image that adds FFmpeg.
2. **Ownership:** fully own / flatten — no need to keep the directories subtree-syncable with upstream `datarhei/*`.
3. **Layout:** "all in the root." The Go core's contents move up to the repository root. The React app remains in the single `ui/` subfolder (a separate Node toolchain cannot share a directory with the Go module cleanly, and `ui/` doubles as the embed source). The `docker/` bundling collapses into the root.
4. **Module path stays `github.com/datarhei/core/v16`.** Renaming the module would force rewriting every import for zero functional gain; out of scope.

### Target root layout (after this plan)

```filetree
/                              ← repo root = Go module github.com/datarhei/core/v16
├── go.mod, go.sum, main.go, Makefile, mime.types
├── app/ config/ docs/ encoding/ ffmpeg/ glob/ http/ internal/ io/ log/
│   math/ monitor/ net/ playout/ process/ prometheus/ psutil/ restream/
│   rtmp/ service/ session/ srt/ update/ vendor/      ← unchanged Go packages
├── ui/                        ← React app (former ui/) + ui/embed.go (package ui)
│   ├── package.json, src/, public/, …
│   ├── embed.go               ← //go:embed all:build
│   └── build/index.html       ← committed placeholder (real build overwrites)
├── ui-root/                   ← publication-site placeholder (former docker/ui-root)
├── Dockerfile                 ← unified: UI build → core build (embed) → FFmpeg base
├── Dockerfile.test            ← kept from core
├── run.sh                     ← import → ffmigrate → core (+ ui-root hint)
├── .github/workflows/         ← reconciled (tests + single image build)
├── README.md  CHANGELOG.md  LICENSE  SECURITY.md  ← reconciled to one each
└── .gitignore .dockerignore .editorconfig .prettierrc .yarnrc.yml …
```

### How the UI gets served after the merge

- New package `ui` (`ui/embed.go`) embeds the compiled UI: `//go:embed all:build`.
- `core/http/server.go` static-route block (`server.go:357-372`) gains an **else branch**: when `config.Router.StaticRoute()` returns an empty disk target (the normal case once UI is embedded), the server serves the embedded `build/` filesystem via Echo's `StaticConfig.Filesystem`.
- Disk serving via `CORE_ROUTER_UI_PATH` is **retained** as a dev/override path (set it to point at `ui/build` for live UI iteration without rebuilding the binary).

### Non-goals

- No change to the Go module path or any Go import path.
- No refactor of UI components or core business logic.
- No change to runtime behavior of streaming, RTMP/SRT, sessions, or the REST/GraphQL API.
- Multi-arch base-image publishing pipeline is simplified, not redesigned.

### Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| `go build`/`go test ./...` fails because `ui/build` doesn't exist for `//go:embed`. | Commit a placeholder `ui/build/index.html`; every Go build resolves the embed. Real UI build overwrites it. |
| `go list ./...` descends into `ui/node_modules`. | Go only forms packages from directories containing `.go` files; `node_modules` has none, so they are silently skipped. No `.go` files are ever added under `ui/` except `embed.go`/`embed_test.go`. |
| Metadata collisions when flattening (`Dockerfile`, `README.md`, `LICENSE`, `.github`, …). | Move core to root first (no collisions), then reconcile UI/docker files explicitly in Phase 6. |
| Embedded UI increases binary size. | Acceptable and intended (single artifact). UI build is gzip-served as today. |

---

## Phase 0 — Safety net

### Task 0: Branch and capture a green baseline

**Files:** none (verification only)

- [ ] **Step 1: Create a working branch**

```bash
cd "C:/Users/julia/Downloads/restreamer"
git checkout -b merge-flat-monorepo
```

- [ ] **Step 2: Verify core builds and tests pass BEFORE any move**

```bash
cd core
go build ./...
go test ./app/... ./config/... ./http/router/...
cd ..
```

Expected: build succeeds; tests PASS. Record this as the baseline — the same commands must pass after the flatten (from the new root).

- [ ] **Step 3: Verify the UI builds BEFORE any move**

```bash
cd ui
yarn install --frozen-lockfile
PUBLIC_URL="./" yarn build
cd ..
```

Expected: a `ui/build/index.html` is produced. (On PowerShell use: `$env:PUBLIC_URL="./"; yarn build`.)

- [ ] **Step 4: Commit the baseline marker**

```bash
git add -A
git commit -m "chore: baseline before flattening monorepo"
```

---

## Phase 1 — Flatten `core/` to the repository root

### Task 1: Move all of `core/`'s contents up to root

Because the Go module path stays `github.com/datarhei/core/v16`, moving the package directories up one level does **not** change any import path. Root currently contains only `core/`, `ui/`, `docker/`, `.claude/`, `.git/`, and `docs/`, so none of core's entries collide.

**Files:**

- Move: every entry under `core/` → repository root
- Delete: empty `core/` directory afterward

- [ ] **Step 1: Move every tracked entry (including dotfiles) from `core/` to root**

```bash
cd "C:/Users/julia/Downloads/restreamer"
git mv core/.dockerignore .dockerignore
git mv core/.editorconfig .editorconfig
git mv core/.gitignore .gitignore
git mv core/.github .github
git mv core/app app
git mv core/build.sh build.sh
git mv core/CHANGELOG.md CHANGELOG.md
git mv core/config config
git mv core/Dockerfile Dockerfile.core
git mv core/Dockerfile.bundle Dockerfile.bundle
git mv core/Dockerfile.test Dockerfile.test
git mv core/docs core/docs.tmp && git mv core/docs.tmp docs-core
git mv core/encoding encoding
git mv core/ffmpeg ffmpeg
git mv core/glob glob
git mv core/go.mod go.mod
git mv core/go.sum go.sum
git mv core/http http
git mv core/internal internal
git mv core/io io
git mv core/LICENSE LICENSE
git mv core/log log
git mv core/main.go main.go
git mv core/Makefile Makefile
git mv core/math math
git mv core/mime.types mime.types
git mv core/monitor monitor
git mv core/net net
git mv core/playout playout
git mv core/process process
git mv core/prometheus prometheus
git mv core/psutil psutil
git mv core/README.md README.core.md
git mv core/restream restream
git mv core/rtmp rtmp
git mv core/run.sh run.sh
git mv core/SECURITY.md SECURITY.md
git mv core/service service
git mv core/session session
git mv core/srt srt
git mv core/update update
git mv core/vendor vendor
```

Notes:

- `core/Dockerfile` → `Dockerfile.core` (temporary; the unified `Dockerfile` is created in Phase 5, after which `Dockerfile.core` is deleted in Phase 6).
- `core/README.md` → `README.core.md` (temporary; reconciled in Phase 6).
- The repo already has a top-level `docs/` (this plan lives there). Core's own Swagger `docs/` package would collide, so it is moved to `docs-core/`. **This changes its Go import path** from `.../v16/docs` to `.../v16/docs-core` — fixed in Step 2.

- [ ] **Step 2: Fix the one import path changed by the `docs` rename**

Find references to the core `docs` package:

```bash
grep -rn "core/v16/docs\"" --include=*.go .
```

For each hit (e.g. in `app/api/api.go` and `http/server.go`), change the import path from `github.com/datarhei/core/v16/docs` to `github.com/datarhei/core/v16/docs-core`. If `swag init -g http/server.go` output path is referenced in the `Makefile` `swagger` target, leave the command as-is (it regenerates into the package directory; you will point it at `docs-core` in a later docs regen if needed).

- [ ] **Step 3: Remove the now-empty `core/` directory**

```bash
rmdir core 2>NUL || true
```

Expected: `core/` no longer exists; `git status` shows only renames.

- [ ] **Step 4: Verify the build from the new root**

```bash
go build ./...
```

Expected: success. If it fails on the `docs` import, revisit Step 2.

- [ ] **Step 5: Run the baseline tests from the new root**

```bash
go test ./app/... ./config/... ./http/router/...
```

Expected: PASS (same as Task 0 Step 2).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: flatten core/ contents to repository root"
```

---

## Phase 2 — Embed the UI into the Go binary

### Task 2: Add a committed UI placeholder so `//go:embed` always resolves

**Files:**

- Create: `ui/build/index.html` (placeholder)
- Modify: `ui/.gitignore` (allow committing the placeholder)

- [ ] **Step 1: Allow the placeholder past `.gitignore`**

Open `ui/.gitignore`. If it ignores `/build` or `build`, append an un-ignore line at the end:

```gitignore
# Keep a committed placeholder so go:embed always resolves; real builds overwrite build/.
!/build/
/build/*
!/build/index.html
```

- [ ] **Step 2: Create the placeholder index**

Create `ui/build/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Restreamer UI (not built)</title>
  </head>
  <body>
    <p>The UI has not been built into this binary. Run <code>make ui</code> and rebuild.</p>
  </body>
</html>
```

- [ ] **Step 3: Verify it is tracked**

```bash
git add -f ui/build/index.html ui/.gitignore
git status --short ui/build/index.html
```

Expected: `ui/build/index.html` is staged.

- [ ] **Step 4: Commit**

```bash
git commit -m "chore(ui): commit placeholder build/index.html for go:embed"
```

### Task 3: Create the `ui` Go embed package (TDD)

**Files:**

- Create: `ui/embed.go`
- Test: `ui/embed_test.go`

- [ ] **Step 1: Write the failing test**

Create `ui/embed_test.go`:

```go
package ui

import "testing"

func TestEmbeddedUIContainsIndex(t *testing.T) {
 f, err := FS.Open("build/index.html")
 if err != nil {
  t.Fatalf("embedded UI is missing build/index.html: %v", err)
 }
 f.Close()
}
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
go test ./ui/ -run TestEmbeddedUIContainsIndex -v
```

Expected: FAIL to compile — `undefined: FS`.

- [ ] **Step 3: Write the minimal embed implementation**

Create `ui/embed.go`:

```go
// Package ui embeds the compiled web interface so the core binary can serve
// it without an external static directory. The build/ directory is produced by
// `yarn build` (see the root Makefile `ui` target); a placeholder index.html is
// committed so this package always compiles.
package ui

import "embed"

//go:embed all:build
var FS embed.FS
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
go test ./ui/ -run TestEmbeddedUIContainsIndex -v
```

Expected: PASS.

- [ ] **Step 5: Verify the whole module still builds (embed package included)**

```bash
go build ./...
go vet ./ui/
```

Expected: success.

- [ ] **Step 6: Commit**

```bash
git add ui/embed.go ui/embed_test.go
git commit -m "feat(ui): embed compiled UI via go:embed"
```

### Task 4: Serve the embedded UI from the HTTP server

When no disk UI path is configured, serve the embedded filesystem. Disk serving via `CORE_ROUTER_UI_PATH` remains as a dev override.

**Files:**

- Modify: `http/server.go` (import block + static-route block at `server.go:357-372`)

- [ ] **Step 1: Add the required imports to `http/server.go`**

In the import block of `http/server.go`, add:

```go
iofs "io/fs"

"github.com/datarhei/core/v16/ui"
```

(`net/http` is already imported — it is used by `ServeHTTP` at `server.go:401`.)

- [ ] **Step 2: Add the embedded-UI else branch to the static-route block**

Replace the existing block at `http/server.go:357-372`:

```go
 // Add static routes
 if path, target := config.Router.StaticRoute(); len(target) != 0 {
  group := s.router.Group(path)
  group.Use(middleware.AddTrailingSlashWithConfig(middleware.TrailingSlashConfig{
   Skipper: func(c echo.Context) bool {
    return path != c.Request().URL.Path
   },
   RedirectCode: 301,
  }))
  group.Use(middleware.StaticWithConfig(middleware.StaticConfig{
   Skipper:    middleware.DefaultSkipper,
   Root:       target,
   Index:      "index.html",
   IgnoreBase: true,
  }))
 }
```

with:

```go
 // Add static routes. If a disk path is configured (CORE_ROUTER_UI_PATH),
 // serve from disk (dev/override). Otherwise serve the UI embedded in the
 // binary.
 if path, target := config.Router.StaticRoute(); len(target) != 0 {
  group := s.router.Group(path)
  group.Use(middleware.AddTrailingSlashWithConfig(middleware.TrailingSlashConfig{
   Skipper: func(c echo.Context) bool {
    return path != c.Request().URL.Path
   },
   RedirectCode: 301,
  }))
  group.Use(middleware.StaticWithConfig(middleware.StaticConfig{
   Skipper:    middleware.DefaultSkipper,
   Root:       target,
   Index:      "index.html",
   IgnoreBase: true,
  }))
 } else if uifs, err := iofs.Sub(ui.FS, "build"); err == nil {
  group := s.router.Group("/ui")
  group.Use(middleware.AddTrailingSlashWithConfig(middleware.TrailingSlashConfig{
   Skipper: func(c echo.Context) bool {
    return "/ui" != c.Request().URL.Path
   },
   RedirectCode: 301,
  }))
  group.Use(middleware.StaticWithConfig(middleware.StaticConfig{
   Skipper:    middleware.DefaultSkipper,
   Root:       "/",
   Index:      "index.html",
   Filesystem: http.FS(uifs),
   IgnoreBase: true,
  }))
 }
```

- [ ] **Step 3: Build to verify it compiles**

```bash
go build ./...
```

Expected: success.

- [ ] **Step 4: Verify the http package tests still pass**

```bash
go test ./http/...
```

Expected: PASS.

- [ ] **Step 5: Integration check — binary self-serves the UI**

```bash
go build -o core .
# Run with no CORE_ROUTER_UI_PATH set so the embedded branch is used.
./core &
sleep 2
curl -fsS http://localhost:8080/ui/ | grep -qi "<!doctype html" && echo "UI SERVED OK"
kill %1
```

Expected: prints `UI SERVED OK` (serves the placeholder until a real UI build is embedded). On Windows PowerShell, run the binary in a separate terminal and use `curl.exe http://localhost:8080/ui/`. If the default port differs in your config, adjust accordingly.

- [ ] **Step 6: Commit**

```bash
git add http/server.go
git commit -m "feat(http): serve embedded UI when no disk path is configured"
```

---

## Phase 3 — Build wiring (Makefile + UI output location)

### Task 5: Add a `make ui` target and a real-build path

`make release` (in the `Makefile`) builds the Go binary. With embedding, a *real* (non-placeholder) image requires the UI to be built into `ui/build` first. Keep `release` placeholder-tolerant (fast core-only builds) and add an explicit UI target plus a convenience bundle target.

**Files:**

- Modify: `Makefile`

- [ ] **Step 1: Add `ui` and `bundle` targets to the `Makefile`**

After the existing `release:` target in the `Makefile`, add:

```makefile
## ui: Build the web UI into ui/build (embedded by the core binary)
ui:
 cd ui && yarn install --frozen-lockfile && PUBLIC_URL="./" yarn build

## bundle: Build the UI then build the core binary with the UI embedded
bundle: ui release
 @echo "Built core with embedded UI."
```

- [ ] **Step 2: Register the new targets in `.PHONY`**

In the `Makefile`, append `ui bundle` to the existing `.PHONY:` line so it reads (append the two names to the current list):

```makefile
.PHONY: help init build swagger test vet fmt vulncheck vendor commit coverage lint release import ffmigrate update ui bundle
```

- [ ] **Step 3: Verify the Makefile parses and the core-only build still works**

```bash
make build
```

Expected: success (uses the committed placeholder for embedding).

- [ ] **Step 4: Commit**

```bash
git add Makefile
git commit -m "build: add make ui and make bundle targets"
```

---

## Phase 4 — Collapse the Docker bundling into the root

### Task 6: Move the publication-site placeholder and merge `run.sh`

The bundle's `run.sh` differs from core's only by copying a publication-site placeholder into the data dir. Adopt that behavior at the root and bring `ui-root/` up.

**Files:**

- Move: `docker/ui-root` → `ui-root`
- Modify: root `run.sh` (merge in the ui-root hint from `docker/run.sh`)

- [ ] **Step 1: Move the publication-site placeholder to the root**

```bash
git mv docker/ui-root ui-root
```

- [ ] **Step 2: Update root `run.sh` to add the publication-site hint**

Edit the root `run.sh` (moved from core in Phase 1). Insert the following block **between** the `ffmigrate` block and the final `exec` line:

```sh
# Create a hint for the publication site if there is no index.html in the data dir.
if [ -n "${CORE_STORAGE_DISK_DIR}" ] && [ ! -f "${CORE_STORAGE_DISK_DIR}/index.html" ]; then
    cp /core/ui-root/index.html /core/ui-root/index_icon.svg "${CORE_STORAGE_DISK_DIR}/" 2>/dev/null || true
fi
```

The final line of `run.sh` must remain:

```sh
exec ./bin/core
```

- [ ] **Step 3: Verify `run.sh` is a valid shell script**

```bash
sh -n run.sh
```

Expected: no output (syntax OK).

- [ ] **Step 4: Commit**

```bash
git add run.sh ui-root
git commit -m "build: bring publication-site placeholder and run.sh hint to root"
```

### Task 7: Create the unified root `Dockerfile`

One multi-stage build: UI (Node) → core (Go, UI embedded) → FFmpeg runtime base. No dependency on pre-built `datarhei/core` or `datarhei/restreamer-ui` images.

**Files:**

- Create: `Dockerfile`

- [ ] **Step 1: Write the unified `Dockerfile`**

Create `Dockerfile` at the repo root:

```dockerfile
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
```

- [ ] **Step 2: Build the unified image (single arch)**

```bash
docker build -t restreamer:flat .
```

Expected: all three stages succeed; final image builds.

- [ ] **Step 3: Smoke-test the image**

```bash
docker run --rm -d --name restreamer-flat -p 8080:8080 restreamer:flat
sleep 5
curl -fsS http://localhost:8080/ui/ | grep -qi "<!doctype html" && echo "IMAGE UI OK"
docker logs restreamer-flat | tail -n 20
docker rm -f restreamer-flat
```

Expected: prints `IMAGE UI OK`; logs show core started without a UI-path error.

- [ ] **Step 4: Commit**

```bash
git add Dockerfile
git commit -m "build: unified root Dockerfile (UI build -> core embed -> ffmpeg base)"
```

---

## Phase 5 — Reconcile metadata and remove the old sub-project shells

### Task 8: Reconcile READMEs, CHANGELOG, and remove stale Dockerfiles

**Files:**

- Replace: `README.md` (adopt the product-level docker README)
- Delete: `README.core.md`, `Dockerfile.core`, `Dockerfile.bundle`, `docker/Dockerfile`, `ui/Dockerfile`, `ui/Dockerfile.workflow`, `ui/Caddyfile`
- Move: `docker/README.md` → `README.md`; keep `docker/CONTRIBUTING.md`, `docker/CODE_OF_CONDUCT.md` at root

- [ ] **Step 1: Adopt the product README and contributor docs at root**

```bash
git mv docker/README.md README.md
git mv docker/CONTRIBUTING.md CONTRIBUTING.md
git mv docker/CODE_OF_CONDUCT.md CODE_OF_CONDUCT.md
git mv docker/readme-promo.gif readme-promo.gif
git mv docker/readme.png readme.png
git rm README.core.md
```

- [ ] **Step 2: Update the "Development" section of the new root `README.md`**

In `README.md`, replace the multi-repo "Create a custom image (bundle)" instructions (which `git clone` three separate repos) with the single-repo flow:

```markdown
## Development

This is a single, self-contained repository: the Go core (root), the React UI (`ui/`),
and the Docker bundling all live together. The UI is embedded into the core binary.

### Build everything (binary with embedded UI)

```sh
make bundle      # builds ui/ then the core binary with the UI embedded
./core           # serves the API and the UI at /ui
```

### Build the Docker image

```sh
docker build -t restreamer:local .
docker run -it --rm -p 8080:8080 restreamer:local
```

### UI-only iteration

```sh
make ui          # rebuild ui/build, then rebuild the binary, or
CORE_ROUTER_UI_PATH=./ui/build ./core   # serve the UI from disk without re-embedding
```

- [ ] **Step 3: Remove the superseded Dockerfiles and UI server config**

```bash
git rm Dockerfile.core Dockerfile.bundle
git rm docker/Dockerfile
git rm ui/Dockerfile ui/Dockerfile.workflow ui/Caddyfile
```

Keep `Dockerfile.test` (core's test image) at the root.

- [ ] **Step 4: Reconcile duplicate top-level metadata files**

The root already has `CHANGELOG.md`, `LICENSE`, `SECURITY.md` (from core). Remove the duplicate UI/docker copies, keeping a single set at root:

```bash
git rm ui/CHANGELOG.md ui/LICENSE ui/SECURITY.md ui/CODE_OF_CONDUCT.md
git rm docker/CHANGELOG.md docker/LICENSE docker/SECURITY.md
git rm docker/_BUNDLE_OF docker/_RESTREAMER-UI+CORE
```

(Leave `ui/.gitignore`, `ui/.dockerignore`, `ui/.prettierrc`, `ui/.yarnrc.yml`, etc. in `ui/` — they are tool configs scoped to the Node project.)

- [ ] **Step 5: Verify nothing references the deleted files**

```bash
grep -rn "Dockerfile.bundle\|RESTREAMER_UI_IMAGE\|CORE_IMAGE=" .github Makefile 2>NUL || true
```

Expected: no remaining references except inside the new root `Dockerfile` ARGs (which are fine). Fix any stragglers found in `.github/` or `Makefile`.

- [ ] **Step 6: Remove the now-empty `docker/` directory**

```bash
rmdir docker 2>NUL || true
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "docs: reconcile README/metadata to one set; remove sub-project Dockerfiles"
```

### Task 9: Reconcile GitHub Actions workflows

Collapse the three CI sets (core, ui, docker) into: one Go test workflow + one unified image build.

**Files:**

- Keep: `.github/workflows/go-tests.yml`, `.github/workflows/codeql-analysis.yml`
- Delete: `.github/workflows/build_base*.yaml`, `build_bundle*.yaml`, and the relocated `ui/.github/workflows/*`
- Create: `.github/workflows/build.yaml`

- [ ] **Step 1: Update `go-tests.yml` to also embed a UI placeholder build dependency**

`go-tests.yml` runs `go test ./...`, which now includes the `ui` package and needs `ui/build` to exist. The committed placeholder already satisfies this, so no change is required — but confirm by reading the workflow that it does a plain `actions/checkout` (the placeholder is in git). No edit needed unless the workflow uses a sparse checkout.

- [ ] **Step 2: Remove the superseded base/bundle workflows**

```bash
git rm .github/workflows/build_base.yaml .github/workflows/build_base_dev.yaml .github/workflows/build_base_vod.yaml
git rm .github/workflows/build_bundle.yaml .github/workflows/build_bundle_dev.yaml
```

- [ ] **Step 3: Remove the relocated UI workflows**

The UI's `.github` was left under `ui/.github` during the flatten (core's `.github` won the root slot). Remove the UI-only build workflows; the unified build replaces them:

```bash
git rm -r ui/.github
```

- [ ] **Step 4: Create the unified image build workflow**

Create `.github/workflows/build.yaml`:

```yaml
name: build

on:
  push:
    branches: ["**"]
    tags: ["v*"]
  pull_request:

jobs:
  docker:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      - name: Build image (no push)
        uses: docker/build-push-action@v6
        with:
          context: .
          file: ./Dockerfile
          push: false
          tags: restreamer:ci
```

- [ ] **Step 5: Validate workflow YAML**

```bash
python -c "import yaml,sys; yaml.safe_load(open('.github/workflows/build.yaml')); print('build.yaml OK')"
```

Expected: prints `build.yaml OK`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "ci: unify workflows into go-tests + single image build"
```

---

## Phase 6 — Final verification

### Task 10: Full from-clean verification

**Files:** none (verification only)

- [ ] **Step 1: Clean Go build and vet from root**

```bash
go build ./...
go vet ./...
```

Expected: success.

- [ ] **Step 2: Run the full test suite**

```bash
go test ./...
```

Expected: PASS (allow for any pre-existing flaky/network tests that also failed on the Task 0 baseline — they are not introduced by this change).

- [ ] **Step 3: Full bundle build + run**

```bash
make bundle
CORE_CONFIGFILE=$(mktemp -d)/config.json ./core &
sleep 3
curl -fsS http://localhost:8080/ui/ | grep -qi "restreamer\|<!doctype html" && echo "REAL UI EMBEDDED OK"
kill %1
```

Expected: prints `REAL UI EMBEDDED OK` — the real (not placeholder) UI is now embedded and served.

- [ ] **Step 4: Confirm the tree is flat**

```bash
ls -d core docker 2>NUL && echo "STILL NESTED — FIX" || echo "FLAT OK"
ls Dockerfile go.mod main.go Makefile ui/embed.go ui-root/index.html
```

Expected: prints `FLAT OK`; all listed paths exist.

- [ ] **Step 5: Final commit and merge readiness**

```bash
git add -A
git commit -m "chore: finalize flat monorepo merge" --allow-empty
git log --oneline -12
```

---

## Self-review checklist (done while writing this plan)

- **Spec coverage:** flatten core → Phase 1; UI as single subfolder + embed → Phases 2–3; collapse docker bundling → Phase 4; one binary artifact → Tasks 3–5; thin FFmpeg image → Task 7; full ownership / metadata reconcile → Phase 5; module path unchanged → stated and relied on in Task 1. ✔
- **Module-path invariant:** the only Go import path that changes is core's `docs` → `docs-core` (renamed to avoid colliding with the repo's existing `docs/`), explicitly fixed in Task 1 Step 2. ✔
- **Embed resolvability:** placeholder committed (Task 2) before the embed package is added (Task 3) and before any `go test ./...` that includes the `ui` package. ✔
- **Type/name consistency:** the embed var is `ui.FS` in both `ui/embed.go` (Task 3) and `http/server.go` (Task 4). ✔
- **No placeholders:** every code/file step contains complete content or exact commands. ✔
