# Gateway

A Go-based API gateway for the Smart Hotel Lab middleware stack. The service exposes authenticated REST endpoints for configuration management, memo management, automation execution, and proxy communication with downstream services such as Home Assistant and user management.

The gateway is implemented with:

- [Gin](https://github.com/gin-gonic/gin) for HTTP routing
- [GORM](https://gorm.io/) for database access
- JWT-based authentication and access control
- PostgreSQL persistence
- Casbin-based authorization support

---

# Features

- JWT-protected REST API
- Role and resource-based access control
- Configuration CRUD operations
- Memo management endpoints
- Automation substitution management
- Configuration deployment and execution endpoints
- Proxy integration for external middleware services
- PostgreSQL-backed persistence layer
- Container-ready deployment configuration

---

# Directory Structure

```text
.
├── cmd/                          # Application entrypoint
│   └── main.go
├── config/                       # Environment configuration templates
│   └── env.example
├── deploy/                       # Deployment and containerization assets
│   ├── create-cert.sh
│   └── gateway.containerfile
├── serverlib/
│   ├── db/                       # Database providers and persistence layer
│   ├── handler/                  # REST handlers and proxy logic
│   ├── routing/                  # Gin router initialization
│   ├── types/                    # Shared models and interfaces
│   └── utils/                    # Utility functions
├── config.go                     # Global configuration loader
├── go.mod
└── README.md
```

---

# Requirements

- Go `1.23.4`
- PostgreSQL
- Access to the related middleware services:
  - User Management Service
  - Home Assistant instance
  - MQTT Error Injection Engine (optional depending on deployment)
  
---

## Local Development Setup

The golang tool chain is required for a local development setup.
You find the installation package for your distribution here https://go.dev/doc/install. 
We developed with version `go1.23.4`. 

The gateway component has configurable settings which are configured through environment variables. 
We provide a template file in `config/env.example` for you.
Prepare the variables accordingly for your local deployment and execute 

```bash
    source <path/to/your/local/config.file>
```

to map the variables into your local environment.

Change the code and run 

```bash
  go run cmd/main.go
```

to start the component locally. 

---

## Configure Environment Variables

Copy the example environment configuration:

```bash
cp config/env.example .env
```

Edit the file and provide values for your environment.

Example:

```bash
export HOST=localhost
export PORT=8080

export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=postgres
export DB_PASSWD=password

# Shared secret used for JWT signing
export JWT_SECRET=my-secret

# Home Assistant connection
export SHH_ADDRESS=http://localhost:8123
export SHH_TOKEN=<token>

# External middleware services
export MQTT_ERROR_INJECTION_ENGINE_REST_ADDRESS=http://localhost:9000
export USER_MANAGEMENT_ADDRESS=http://localhost:8081
```

Load the variables into your shell:

```bash
source .env
```

---

# Running the Application

The service initializes:

- Environment configuration
- PostgreSQL model provider
- Gin HTTP router
- Authentication middleware
- API routes

---

# API Overview

The gateway exposes its API under:

```text
/middleware/api
```

Most endpoints require:

- A valid JWT
- Access control verification through the user management service

## Health Endpoint

```http
GET /middleware/api/ping
```

## Configuration Endpoints

```http
GET    /middleware/api/configurations
POST   /middleware/api/configurations
GET    /middleware/api/configuration/:id
PUT    /middleware/api/configuration/:id/meta
PUT    /middleware/api/configuration/:id/entities
PUT    /middleware/api/configuration/:id/rules
PUT    /middleware/api/configuration/:id/errors
DELETE /middleware/api/configuration/:id
POST   /middleware/api/configuration/:id/run
```

## Automation Endpoints

```http
POST   /middleware/api/configuration/:id/automation
GET    /middleware/api/configuration/:id/automation/:substitution
PUT    /middleware/api/configuration/:id/automation/:substitution
DELETE /middleware/api/configuration/:id/automation/:substitution
```

## Memo Endpoints

```http
GET    /middleware/api/memos
POST   /middleware/api/memos
GET    /middleware/api/memo/:id
PUT    /middleware/api/memo/:id/items
DELETE /middleware/api/memo/:id
```

---

# Authentication and Authorization

The gateway integrates with the external user management component.

Authentication flow:

1. Incoming requests provide a JWT.
2. JWT validation middleware verifies the token.
3. Resource access policies are validated through the user management service.
4. Authorized requests proceed to the handler layer.

Middleware used in routing:

- `ValidateJWT()`
- `RequestAccessControlPolicyCheck()`
- `RequestResourceAccess()`
- `RequestResourcesAccess()`

---

# Database

The gateway uses PostgreSQL via GORM.

Environment variables:

| Variable | Description |
|---|---|
| `DB_HOST` | PostgreSQL host |
| `DB_PORT` | PostgreSQL port |
| `DB_USER` | PostgreSQL username |
| `DB_PASSWD` | PostgreSQL password |

Database initialization occurs during application startup in `serverlib/init.go`.

---

# Testing

The repository includes unit tests for:

- Database providers
- Automation logic
- Memo persistence
- Server library components

Run all tests:

```bash
go test ./...
```

---

# Development Notes

## Signals and Graceful Shutdown

The application listens for:

- `SIGINT`
- `SIGTERM`

The main process terminates gracefully when an interrupt signal is received.

## Configuration Loading

Environment variables are mandatory.

Missing variables cause startup failure through:

```go
panic(fmt.Sprintf("[SERVE] the mandatory enviroment variable %s isn't present\n", name))
```

---

# Dependencies

Core dependencies include:

| Package | Purpose |
|---|---|
| `github.com/gin-gonic/gin` | HTTP routing |
| `gorm.io/gorm` | ORM |
| `gorm.io/driver/postgres` | PostgreSQL driver |
| `github.com/golang-jwt/jwt/v5` | JWT handling |
| `github.com/casbin/casbin/v2` | Authorization |

---
