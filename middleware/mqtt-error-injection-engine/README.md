# MQTT Error Injection Engine

A Golang-based MQTT man-in-the-middle (MITM) proxy for testing, fault injection, and runtime manipulation of MQTT traffic.

The engine sits between MQTT clients and a target broker, allowing you to:

- Suppress MQTT topics
- Intercept and modify MQTT payloads
- Apply template-based payload substitution rules
- Manually approve or rewrite messages through WebSocket streams
- Observe and manipulate MQTT traffic in real time
- Expose a REST API for runtime configuration

This project is designed for integration testing, resilience testing, IoT simulation environments, and smart infrastructure validation workflows.

---

# Architecture Overview

The application consists of two major components:

1. **MQTT MITM Proxy Server**
   - Accepts MQTT client connections
   - Forwards traffic to the upstream MQTT broker
   - Applies suppression and interception hooks

2. **HTTPS REST API**
   - Provides runtime management endpoints
   - Allows interception and suppression configuration
   - Streams manual interception events through WebSockets

```
MQTT Client
     |
     v
+-----------------------+
| MQTT Error Injection  |
| Engine (MITM Proxy)   |
+-----------------------+
     |
     v
Home Assistant Instance
```

---

# Features

## Topic Suppression

Suppress selected MQTT topics so messages are discarded before reaching the upstream broker.

Supports:

- Single topic suppression
- Bulk suppression
- Dynamic cancellation of suppression rules

---

## Manual Interception

Intercept MQTT messages and decide at runtime whether to:

- Forward unchanged
- Overwrite payloads
- Suppress delivery entirely

Manual interception uses a WebSocket stream for real-time operator interaction.

---

## Template-Based Interception

Define rules that automatically replace MQTT payloads when matching conditions occur.

Supported matching strategies:

- Exact plain-text payload matching
- JSON payload matching
- Wildcard matching (`*`)

Example:

- Incoming payload:

```json
{
  "temperature": 120
}
```

- Matching rule:

```json
{
  "temperature": 120
}
```

- Replacement payload:

```json
{
  "temperature": -999
}
```

---

## HTTPS REST API

The engine exposes a TLS-enabled REST interface for runtime configuration and orchestration.

---

## WebSocket Streaming

Manual interception sessions stream intercepted packets through WebSockets for interactive processing.

---

# Technology Stack

- Go 1.23+
- Gin Web Framework
- Mochi MQTT Server
- Gorilla WebSocket
- UUID-based interception sessions

---

# Directory Structure

```text
.
├── cmd/
│   └── main.go
├── deploy/
│   ├── mqtt-error-injection-engine.containerfile
│   └── create-cert.sh
├── serverlib/
│   ├── http/
│   ├── mqtt/
│   ├── types/
│   └── globals.go
├── utils/
├── configs.go
├── go.mod
└── README.md
```

---

# Requirements

- Go 1.23 or newer
- Access to an MQTT broker
- TLS certificates for HTTPS API startup

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

The application is configured through environment variables.

Example variables:

```bash
export FULL_BROKER_ADDR=tcp://localhost:18883
export BROKER_USERNAME=mainten01
export BROKER_PASSWD=mainten01

export MQTT_ENGINE_HOST=0.0.0.0
export MQTT_ENGINE_PORT=1883

export REST_ENGINE_HOST=0.0.0.0
export REST_ENGINE_PORT=8080
```

You can also source a local configuration file:

```bash
source ./config/env.local
```

---

## Generate TLS Certificates

The REST server runs with TLS enabled.

Generate certificates using:

```bash
./deploy/create-cert.sh
```

Expected certificate files:

```text
./config/certs/cert.pem
./config/certs/key.pem
```

---

## Run the Engine

The application starts:

- MQTT MITM proxy
- HTTPS REST server

---

# Configuration

## Remote MQTT Broker

| Variable | Description | Default |
|---|---|---|
| `FULL_BROKER_ADDR` | Upstream broker address | `tcp://localhost:18883` |
| `BROKER_USERNAME` | MQTT broker username | `mainten01` |
| `BROKER_PASSWD` | MQTT broker password | `mainten01` |

---

## MQTT Engine

| Variable | Description | Default |
|---|---|---|
| `MQTT_ENGINE_HOST` | MQTT bind host | `0.0.0.0` |
| `MQTT_ENGINE_PORT` | MQTT bind port | `1883` |

---

## REST API

| Variable | Description | Default |
|---|---|---|
| `REST_ENGINE_HOST` | REST API bind host | `0.0.0.0` |
| `REST_ENGINE_PORT` | REST API bind port | `8080` |

---

# REST API Endpoints

## Health Check

### `GET /ping`

Returns:

```json
{
  "message": "pong"
}
```

---

# Topic Management

## List Managed Topics

### `GET /topics`

---

## List Suppressed Topics

### `GET /topics/suppressed`

---

## Suppress Multiple Topics

### `POST /topics/suppress`

Example request:

```json
{
  "topicToSuppress": [
    {
      "name": "sensor/temperature"
    }
  ]
}
```

---

## Cancel Topic Suppression

### `POST /topics/cancel-suppression`

---

# Interception API

## List Active Interceptions

### `GET /topics/intercepted`

---

## Manual Interception

### `POST /topics/intercept/manual`

Example request:

```json
{
  "topics": [
    {
      "name": "sensor/temperature"
    }
  ]
}
```

Example response:

```json
{
  "interceptedTopics": [],
  "notInterceptableTopics": [],
  "mode": "manual",
  "redirect": "/topics/intercept/subscribe/<session-id>"
}
```

---

## Template Interception

### `POST /topics/intercept/template`

Example request:

```json
{
  "topics": [
    {
      "name": "sensor/temperature",
      "inputTemplate": {
        "plain": "120"
      },
      "outputTemplate": {
        "plain": "-999"
      }
    }
  ]
}
```

---

## Cancel Interception

### `POST /topics/cancel-interception`

---

## WebSocket Subscription

### `GET /topics/intercept/subscribe/:key`

Streams intercepted MQTT messages to connected clients.

---

# Graceful Shutdown

The application handles:

- `SIGINT`
- `SIGTERM`

and shuts down the MQTT server gracefully.

---

# Use Cases

- MQTT fault injection
- IoT integration testing
- Smart building simulations
- Network resilience testing
- MQTT payload mutation testing
- Broker interoperability testing
- Chaos engineering for MQTT systems

---

# Security Notes

- The REST API currently starts with TLS enabled.
- Authentication and authorization are not yet enforced.
- The router contains TODO notes for:
  - Security headers
  - Token validation

This service should not be exposed directly to untrusted public networks without additional hardening.

---
