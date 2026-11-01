# EcoRide Platform Diagnostics & Observability Architecture

This document describes the observability, container health probes, structured logging, request tracing, service metrics, and privacy redaction guarantees for the EcoRide EV-Only mobility platform in Andhra Pradesh.

---

## 1. Container & Load Balancer Health Probes

The API exposes standards-compliant probes designed for Kubernetes orchestration, cloud load balancers, and DevOps monitoring:

| Probe Endpoint | HTTP Method | Target Layer | Healthy Condition | Degraded Condition | Fail Behavior |
|---|---|---|---|---|---|
| `/health/live` | `GET` | Node.js Process | Event loop responsive | Uncaught blocking crash | Container restarted by orchestrator |
| `/health/ready` | `GET` | Service Dependencies | PostgreSQL **UP** &amp; Redis **UP** | Database or Redis offline | Returns **HTTP 503**; traffic diverted |
| `/health` | `GET` | Platform Overview | Overall platform check | Dependency degraded | Returns HTTP 200 (OK) or 503 (Degraded) |

### Key Liveness vs. Readiness Isolation
- **Liveness probe (`/health/live`)**: Does **NOT** depend on external databases or network cache. If PostgreSQL experiences a transient restart or migration lock, liveness continues returning HTTP 200, preventing orchestrators from executing destructive restart loops.
- **Readiness probe (`/health/ready`)**: Strictly probes `SELECT 1` on PostgreSQL and `PING` on Redis with 2000ms timeouts. If the database is offline, readiness fails immediately with **HTTP 503**, causing ingress load balancers to withhold traffic until the database returns.

---

## 2. Service Metrics & Prometheus Scraping

### Endpoints
- **JSON Metrics**: `GET /health/metrics`
- **Prometheus OpenMetrics Exposition**: `GET /metrics`

### Exposed Metrics Summary
```prometheus
# HELP process_uptime_seconds Total process uptime in seconds
# TYPE process_uptime_seconds gauge
process_uptime_seconds 3450

# HELP process_resident_memory_bytes Resident memory size in bytes
# TYPE process_resident_memory_bytes gauge
process_resident_memory_bytes 78245888

# HELP nodejs_heap_size_used_bytes Process heap memory used in bytes
# TYPE nodejs_heap_size_used_bytes gauge
nodejs_heap_size_used_bytes 42104520

# HELP http_requests_total Total HTTP requests handled
# TYPE http_requests_total counter
http_requests_total{status="2xx"} 1240
http_requests_total{status="4xx"} 12
http_requests_total{status="5xx"} 0

# HELP ecoride_ev_fleet_active_count Number of active battery electric vehicles in fleet
# TYPE ecoride_ev_fleet_active_count gauge
ecoride_ev_fleet_active_count 5

# HELP ecoride_ev_zones_count Number of active PostGIS zones in operation
# TYPE ecoride_ev_zones_count gauge
ecoride_ev_zones_count 4

# HELP ecoride_battery_electric_only_enforced Flag indicating 100% electric propulsion enforcement
# TYPE ecoride_battery_electric_only_enforced gauge
ecoride_battery_electric_only_enforced 1
```

---

## 3. Structured Logging & Privacy Redaction Guard

### Structured JSON Log Schema
All incoming requests and outgoing responses pass through `LoggingInterceptor`, outputting single-line JSON logs with correlated tracing metadata:

```json
{
  "event": "HTTP_REQUEST_FINISH",
  "correlationId": "req-trace-vizag-001",
  "method": "POST",
  "url": "/v1/quotes",
  "statusCode": 200,
  "durationMs": 14,
  "timestamp": "2026-11-01T15:20:00.000Z"
}
```

### Strict Redaction Guarantees (Zero Leak Policy)
Per platform security and privacy directives, `LogSanitizer` automatically inspects and sanitizes all payloads before logging:

1. **OTPs & Start Codes**:
   - Keys (`otp`, `startOtp`, `start_otp`, `code`, `pin`) -> Masked to `[REDACTED_OTP]`.
   - String regex patterns matching OTPs (e.g., `OTP: 4821`) -> Masked to `otp: [REDACTED_OTP]`.
2. **Personal Coordinates & Locations**:
   - Location fields (`pickupLatitude`, `pickupLongitude`, `dropoffLatitude`, `dropoffLongitude`, `pickupLocation`) -> Masked to `[REDACTED_COORDINATES]`.
3. **Credentials & Secrets**:
   - Headers (`Authorization: Bearer ...`), passwords, database connection URIs (`postgres://user:pass@host/db`), and API keys -> Masked to `[REDACTED_SECRET]`.
4. **Phone Numbers & PII**:
   - User telephone numbers (`+919123400001`) -> Masked to `+91*****0001`.
5. **System Stack Traces**:
   - 500 exceptions output sanitized error messages; raw DB driver stack traces are excluded from HTTP responses and client envelopes.

---

## 4. Local Observability Dashboard

Operators and developers can inspect real-time platform health via the Next.js Operations Web Portal:
- **Local Dashboard URL**: `http://localhost:3001/diagnostics`
- Visualizes liveness probe vitality, readiness dependency latencies, memory consumption, active fleet counters, and security redaction policies.

