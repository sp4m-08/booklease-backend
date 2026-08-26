# BookLease Backend — Build & Environment Setup Troubleshooting Guide

This document captures the issues encountered when setting up, compiling, and running the Go backend on a fresh Windows machine, why each issue occurred, and how it was resolved.

---

## 1. Summary of Issues Encountered

| # | Issue | Symptoms | Root Cause |
|---|-------|----------|------------|
| 1 | **Go not recognized in PATH** | `The term 'go' is not recognized...` | Fresh Windows install lacked the Go toolchain in system/user `PATH`. |
| 2 | **Single-file compilation failure** | `go run main.go` → `routes\routes.go:4:2: cannot find package` | `go run main.go` only compiles `main.go` in isolation without loading local module packages (`bookapi/routes`, `bookapi/services`, etc.). |
| 3 | **`go.mod` dependencies wiped by `go mod tidy`** | `go: warning: "all" matched no packages` / `unused <package>` | `go mod tidy` stripped dependencies when the local module tree had unresolved imports, converting direct dependencies into unused ones. |
| 4 | **Toolchain network download loop** | `toolchain go1.23.10` directive in `go.mod` | When running a newer Go release (e.g. Go 1.25/1.26), Go attempted to download the older `go1.23.10` binary toolchain over the network rather than using the installed runtime. |
| 5 | **Go proxy DNS / network timeouts** | `Get "https://proxy.golang.org/...": dial tcp: lookup proxy.golang.org: no such host` | Intermittent network or DNS issues reaching the default `proxy.golang.org`. |
| 6 | **Direct vs `// indirect` dependencies in `go.mod`** | `main.go:7:2: cannot find package` | Direct dependencies (`gin`, `cors`, `gorm`, `firebase`, `godotenv`) were tagged as `// indirect`, causing Go's compiler to block direct imports in `main.go` and internal packages (`routes`, `services`). |

---

## 2. Detailed Root Cause Analysis

### Issue A: `go run main.go` vs `go run .`
- **Why it failed**: In Go projects that use internal packages (e.g. `bookapi/routes`, `bookapi/services`, `bookapi/api`), running `go run main.go` specifies a single file build target. Go tries to resolve package imports without the full module context.
- **Resolution**: Always use:
  ```powershell
  go run .
  # or
  go build .
  ```

### Issue B: The `// indirect` Dependency Trap
- **Why it failed**: In Go's module system:
  - Direct requirements in `require (...)` are accessible to your source files.
  - Lines ending in `// indirect` are designated *only* as transitive dependencies of other modules.
  - When `gin-gonic/gin`, `gin-contrib/cors`, and other root packages were tagged `// indirect`, the compiler rejected imports in `main.go` and internal packages with `cannot find package`.
- **Resolution**: Keep direct imports in `go.mod` without `// indirect`:
  ```go
  require (
      firebase.google.com/go/v4 v4.16.1
      github.com/gin-contrib/cors v1.7.2
      github.com/gin-gonic/gin v1.10.1
      github.com/joho/godotenv v1.5.1
      google.golang.org/api v0.239.0
      gorm.io/driver/postgres v1.6.0
      gorm.io/gorm v1.30.0
  )
  ```

### Issue C: Go Proxy Fallback
- **Why it failed**: When `proxy.golang.org` encounters DNS resolution errors on certain ISPs or corporate networks, `go get` fails.
- **Resolution**: Configure fallback proxies using `GOPROXY`:
  ```powershell
  $env:GOPROXY="https://goproxy.io,https://proxy.golang.org,direct"
  ```

---

## 3. Clean Setup & Run Procedure for New Machines

Whenever setting up the project on a new PC, follow this exact sequence:

```powershell
# 1. Ensure Go is installed and verify version
go version

# 2. Set module mode explicitly (persistent)
go env -w GO111MODULE=on

# 3. Configure robust Go proxy mirrors
$env:GOPROXY="https://goproxy.io,https://proxy.golang.org,direct"

# 4. Download and cache all module dependencies
go mod download

# 5. Build and verify the binary
go build .

# 6. Run the server
go run .
```

---

## 4. Expected Startup Output

Once running, the terminal will confirm successful database connection and port listening:

```text
✅ Connected to Supabase PostgreSQL!
🚀 Server running at http://localhost:8080
```
