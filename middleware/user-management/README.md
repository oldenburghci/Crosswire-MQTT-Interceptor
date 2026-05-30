# User Management Service

A Go-based authentication and authorization microservice built with the Gin web framework, PostgreSQL, JWT authentication, and Casbin RBAC/ABAC enforcement.

This service provides centralized user management, authentication, password management, and fine-grained resource authorization for distributed applications and middleware systems.

---

## Features

- JWT-based authentication
- Role-based access control (RBAC)
- Attribute-based access control (ABAC) support via Casbin
- PostgreSQL-backed persistence layer
- Password hashing with salt support
- TLS-enabled HTTPS server
- Middleware integration for protected services
- Resource-level authorization checks
- User profile and password management
- Automatic database initialization and migration
- Preconfigured default users for development

---

## Tech Stack

| Component | Technology |
|---|---|
| Language | Go 1.23.4 |
| HTTP Framework | Gin |
| Database | PostgreSQL |
| ORM | GORM |
| Authentication | JWT |
| Authorization | Casbin |
| TLS | Native Go TLS |

---

## Directory Structure

```text
user-management/
├── cmd/
│   └── main.go                  # Application entry point
├── config/
│   ├── env.example              # Environment variable template
│   ├── rbac_model.conf          # Casbin RBAC model
│   └── abac_model.conf          # Casbin ABAC model
├── deploy/
│   ├── user-management.containerfile
│   └── create-cert.sh           # TLS certificate generation helper
├── serverlib/
│   ├── auth/                    # Authentication and middleware logic
│   ├── db/                      # Database access layer
│   ├── routing/                 # HTTP routing and handlers
│   ├── test/                    # Integration tests
│   └── types/                   # Domain models and interfaces
├── go.mod
└── README.md
```

---

## Environment Configuration

Create an environment configuration file based on `config/env.example`.

### Example

```bash
export HOST=0.0.0.0
export PORT=8443

export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=postgres
export DB_PASSWD=postgres

export JWT_SECRET=super-secret-key
export PASSWD_SALT=random-salt
```

Load the variables into your shell:

```bash
source config/env.example
```

---

## Requirements

- Go 1.23.4+
- PostgreSQL
- OpenSSL (for certificate generation)

---

### Local Development Setup

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

### Generate TLS Certificates

The server runs using HTTPS/TLS.

Generate local certificates:

```bash
chmod +x deploy/create-cert.sh
./deploy/create-cert.sh
```

This creates:

```text
config/certs/cert.pem
config/certs/key.pem
```

### Start PostgreSQL

Ensure PostgreSQL is running and the configured user has permission to create databases.

The service automatically creates the `rbac-model` database if it does not exist.

### Start the Service

```bash
go run cmd/main.go
```

Expected startup message:

```text
start User Management
```

---

## Default Development Users

The application initializes default users automatically during startup.

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Operator | `operator1` | `operator1` |

These users are intended for local development only.

---

## API Overview

### Public Routes

#### Login

```http
POST /login
```

Request body:

```json
{
  "username": "admin",
  "password": "admin123"
}
```

Successful response:

```json
{
  "message": "success",
  "token": "<jwt-token>"
}
```

---

### Protected Routes

All `/auth/*` endpoints require a valid JWT bearer token.

Example:

```http
Authorization: Bearer <token>
```

#### Health Check

```http
GET /auth/ping
```

#### Current User Information

```http
GET /auth/whoami
```

#### Change Password

```http
PUT /auth/password
```

Request body:

```json
{
  "currentPassword": "old-password",
  "newPassword": "new-password"
}
```

#### Update User Information

```http
PUT /auth/user
```

#### Check Resource Access

```http
GET /auth/resource/:id
```

#### List Accessible Resources

```http
GET /auth/resources
```

#### Evaluate Access Policies

```http
POST /auth/check-access
```

---

## Authorization Model

The service integrates Casbin for authorization management.

### Supported Models

- RBAC (`config/rbac_model.conf`)
- ABAC (`config/abac_model.conf`)

### Access Control Components

- User roles
- Resource ownership
- Permission enforcement middleware
- Resource filtering
- Dynamic policy evaluation

---

## Authentication Flow

1. User authenticates via `/login`
2. Service validates credentials against PostgreSQL
3. JWT token is generated
4. Client includes JWT in subsequent requests
5. Middleware validates token and extracts user identity
6. Authorization policies are enforced before resource access

---

## Middleware Integration

The `serverlib/auth` package exposes middleware helpers for integrating authorization checks into external Gin services.

Available middleware includes:

- `RequestResourceAccess()`
- `RequestResourcesAccess()`
- `ValidateJWT()`
- Security header middleware

Example integration:

```go
router.GET(
    "/resource/:id",
    auth.ValidateJWT(),
    auth.RequestResourceAccess(remoteURL, "id"),
    handler,
)
```

---

## Database Layer

The service uses GORM with PostgreSQL.

### Auto-Migrated Models

- `User`
- `Role`
- Casbin policy tables

### User Model

```go
type User struct {
    Username  string
    Password  string
    Email     string
    Role      Role
    Suspended bool
}
```

---

## Security Considerations

- Passwords are hashed before storage
- JWT-based stateless authentication
- TLS enforced for all traffic
- Password salting supported through environment configuration
- Security headers middleware enabled

For production deployments:

- Replace development certificates
- Use strong JWT secrets
- Configure secure password salts
- Rotate credentials regularly
- Disable default users
- Use managed PostgreSQL backups

---

## Running Tests

Integration tests are located in:

```text
serverlib/test/
```

Run all tests:

```bash
go test ./...
```

---

## Example Login Request

Using `curl`:

```bash
curl -k -X POST https://localhost:8443/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

---
