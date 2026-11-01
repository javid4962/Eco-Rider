# Decision Log (ADRs) - EcoRide

## ADR-0001: Monorepo Structure with pnpm
- **Date**: 2026-11-01
- **Status**: Accepted
- **Context**: The platform encompasses an API backend, operations portal, mobile apps, and shared DTO contracts.
- **Decision**: Adopt a pnpm workspace monorepo layout (`apps/*`, `packages/*`) for efficient dependency deduplication, strict boundary isolation, and rapid TypeScript type-sharing.

## ADR-0002: PostgreSQL 16 + PostGIS for Spatial Geofencing & Booking Truth
- **Date**: 2026-11-01
- **Status**: Accepted
- **Context**: Ride bookings require ACID compliance, idempotency, and spatial queries (point-in-polygon zone checks and nearest-driver calculations).
- **Decision**: Use PostgreSQL 16 with the PostGIS 3.4 extension as the primary transactional database and single source of truth.

## ADR-0003: Redis 7 for Driver Telemetry and Distributed Locking
- **Date**: 2026-11-01
- **Status**: Accepted
- **Context**: 1-5 second GPS heartbeats and concurrent ride dispatch acceptance create high write velocity and race conditions.
- **Decision**: Use Redis 7 with Redlock algorithms for dispatch acceptance mutexes and Redis geospatial indexes (`GEOADD`, `GEORADIUS`) for active driver caching with TTL.

## ADR-0004: NestJS with Strict TypeScript Configuration
- **Date**: 2026-11-01
- **Status**: Accepted
- **Context**: The backend requires high architectural maintainability, modular dependency injection, and complete type safety.
- **Decision**: Standardize on NestJS with strict TypeScript flags (`strict: true`, `noImplicitAny: true`, `strictNullChecks: true`).

## ADR-0005: Release Boundaries, Scope Matrix, and Backend-Authoritative Feature Flags
- **Date**: 2026-11-01
- **Status**: Accepted
- **Context**: The platform has 5 service categories with varying regulatory and operational prerequisites. Per AGENTS.md Rule 3, uncertain service types must remain disabled by default, and category availability must be enforced server-side.
- **Decision**: 
  1. Map the 5 categories into 4 structured release phases: Release A (Pilot: Private EV), Release B (Future: Scheduled Sharing), Release C (Future: Passes & Guarantees), and Release D (Future: Fleet & Charging Optimization).
  2. Implement backend-authoritative feature flag evaluation by city and service in `ReleaseBoundariesService`.
  3. Enforce launch gates: even if a flag is erroneously set to enabled, mandatory unsatisfied launch gates will block activation server-side.
  4. Only Release A in the pilot city of Visakhapatnam is enabled at baseline; all future phases (B, C, D) and expansion cities (Vijayawada, Guntur, Tirupati) remain strictly disabled.


## ADR-0006: State-Oriented Journeys, Role Separation, and Screen Flow Graph
- **Date**: 2026-11-01
- **Status**: Accepted
- **Context**: The platform encompasses 7 distinct user personas (Rider, Captain, Dispatcher, Fleet Owner, Finance, Safety, and Institution) across 5 core workflows. Complex operations require unambiguous state transitions and zero orphaned UI states.
- **Decision**: 
  1. Authoritatively model all 5 core workflows (Private Rides, Shared Seats, Pass Redemption, Refunds, Emergencies) as explicit state machines in `@ecoride/contracts` and `JourneysService`.
  2. Require every journey step to define an explicit Success Path, Empty State, Failure Path, and Responsible Actor.
  3. Maintain an automated screen graph validation test ensuring all 38 screen nodes are reachable, with zero orphaned screens and bidirectional recovery paths.
  4. Enforce server-side role validation on state transitions (e.g., Captain-only OTP validation, Finance-only refund disbursement).


## ADR-0007: Original EV-Only Design System, Design Tokens, and Bilingual Accessibility Guidelines
- **Date**: 2026-11-01
- **Status**: Accepted
- **Context**: The platform requires a cohesive visual identity for its Rider Flutter app, Captain Flutter app, and Next.js operations portal. Per AGENTS.md Rule 1, competitor branding (such as Rapido's yellow/black or Uber's white/black) is prohibited. Commuters and captains in Andhra Pradesh require bilingual English and Telugu typography and WCAG 2.1 AA/AAA accessibility.
- **Decision**: 
  1. Standardize on **Electric Emerald (`#059669`)** and **Deep Voltage Navy (`#0B132B`)** as the primary brand palette, paired with a 4-tier battery SoC health color gauge (Optimal, Good, Low, Critical).
  2. Define an authoritative 4pt grid spacing system and a minimum 48 × 48 dp touch target for all interactive elements.
  3. Require bilingual parity across all user-facing strings using Inter for English and Noto Sans Telugu / Gautami for Telugu script.
  4. Implement an automated accessibility and color contrast audit in `DesignSystemService` to continuously verify WCAG 2.1 AA/AAA compliance on all token pairs.


## ADR-0008: Requirements-to-Tests Traceability Matrix and Release Blocker Governance
- **Date**: 2026-11-01
- **Status**: Accepted
- **Context**: The platform encompasses life-critical safety systems (Emergency SOS, Police 112 escalation, battery range safety guards), strict regulatory mandates (100% BEV, AP regional geofencing), and financial ledger idempotency. A clear governance model is required to prevent unverified code from reaching production.
- **Decision**: 
  1. Authoritatively map all platform requirements to 6 distinct test categories: API, Mobile, Admin, Concurrency, Security, and Field tests in `docs/TEST_MATRIX.md` and `@ecoride/contracts`.
  2. Enforce that all **Compliance** (REQ-EV-01, REQ-EV-02) and **Financial** (REQ-EV-07, REQ-EV-08) requirements are strictly flagged as **Release Blockers**.
  3. Require every P0 requirement to define an automated measurable verification threshold and an assigned Human Acceptance Owner who must sign off prior to pilot or commercial promotion.
  4. Implement an automated matrix coverage validator in `TestMatrixService` that runs as part of the CI pipeline.


## ADR-0009: Four-Application Monorepo Architecture (API, Rider App, Captain App, Ops Web)
- **Date**: 2026-11-01
- **Status**: Accepted
- **Context**: The EcoRide platform comprises four distinct user-facing surfaces: a backend API, two mobile applications (Rider and Captain in Flutter), and an administrative operations portal (Next.js web). Maintaining these within a unified monorepo ensures contracts, design tokens, and domain models remain strictly in sync without dependency drift or duplicated logic.
- **Decision**: 
  1. Authoritatively structure the repository under `apps/` with:
     - `apps/api`: NestJS backend with PostgreSQL/PostGIS, Redis, TypeORM migrations, and strict TypeScript.
     - `apps/rider_app`: Flutter 3.44 mobile client for riders with bilingual English/Telugu UI and EV booking flows.
     - `apps/captain_app`: Flutter 3.44 mobile client for EV drivers with battery SoC gauges, duty management, and dispatch state machines.
     - `apps/ops-web`: Next.js 14 App Router portal for fleet operators, dispatchers, KYC reviewers, and regional zone controllers.
  2. Maintain a shared TypeScript contracts package under `packages/contracts` for data transfer objects, design tokens, release boundaries, and test matrices, transpiled directly by web and backend workspaces.
  3. Enforce that all four applications compile and initialize from a clean clone using synthetic environment configuration (`.env.example`) with zero real credentials.


## ADR-0010: Local Infrastructure Stack (PostGIS & Redis) and Volume Governance
- **Date**: 2026-11-01
- **Status**: Accepted
- **Context**: The platform requires local multi-container development infrastructure supporting geospatial PostGIS queries (geofence boundaries, nearest EV search, spherical distance metrics) and Redis in-memory storage (high-frequency telemetry, mutex locks, BullMQ queue dispatch). Production credentials, cloud databases, and live gateway keys must never be used locally.
- **Decision**: 
  1. Authoritatively define the developer multi-container stack in `infrastructure/docker-compose.dev.yml` using `postgis/postgis:16-3.4` and `redis:7-alpine`.
  2. Isolate developer data in local named Docker volumes (`ecoride_postgis_dev_data` and `ecoride_redis_dev_data`), preventing accidental pollution of host file systems.
  3. Enforce health checks for both services (`pg_isready` for PostgreSQL and `redis-cli ping` for Redis) with automated retry policies.
  4. Provide a unified PowerShell management script `infrastructure/manage-stack.ps1` with an explicit destructive confirmation warning on `reset` (`docker compose down -v`) to prevent accidental local data loss.


## ADR-0011: Database Migrations, TypeORM Configuration, and Initial Schema Constraints
- **Date**: 2026-11-01
- **Status**: Accepted
- **Context**: The platform requires an authoritative relational and spatial schema for users, vehicles, zones, bookings, financial ledgers, and audit logs. The propulsion must strictly be 100% battery-electric, financial mutations must be idempotent and balanced, and automatic schema synchronization (`synchronize: true`) creates severe risks of schema drift and data corruption.
- **Decision**: 
  1. Strictly disable TypeORM schema synchronization (`synchronize: false`) across all environments (local, staging, production). Schema evolution is driven exclusively by versioned, repeatable migration files in `apps/api/src/database/migrations/`.
  2. Enforce primary keys as cryptographically random UUIDs (`DEFAULT uuid_generate_v4()`) via the PostgreSQL `uuid-ossp` extension.
  3. Enforce 100% Battery Electric propulsion at the database level using a table check constraint `CONSTRAINT chk_vehicles_electric_only CHECK (propulsion_type = 'BATTERY_ELECTRIC')`. Disallow any ICE or hybrid vehicles.
  4. Implement spatial columns using PostGIS `geometry(Polygon, 4326)` for city zones and `geometry(Point, 4326)` for booking pickup/dropoff points, indexed via PostGIS GIST indexes.
  5. Implement an immutable double-entry ledger (`ledger_entries`) with mandatory `idempotency_key UNIQUE`, `amount_paise BIGINT`, and `CHECK (entry_type IN ('DEBIT', 'CREDIT'))`.
  6. Require every migration file to provide a deterministic, reversible `down()` method, tested via automated scratch-database migration up/down lifecycle tests.


## ADR-0012: API Versioning, Error Envelopes, Conventions, and OpenAPI Specifications
- **Date**: 2026-11-01
- **Status**: Accepted
- **Context**: The platform exposes endpoints to two Flutter mobile applications (Rider and Captain) and a Next.js operations portal. To ensure long-term stability, traceability, and prevent breaking client releases, all routes require versioning, predictable safe error envelopes, non-leaking exception filtering, and shared money/date conventions.
- **Decision**: 
  1. Enforce global URI prefix `/v1` across all functional routes, while excluding root `/health` for devops and load-balancer probes.
  2. Implement a stable top-level error envelope `ApiErrorEnvelope` returning `success: false`, `error: { code, message, details }`, `correlationId`, `timestamp`, and `path`.
  3. Enforce zero leakage of server stack traces, database credentials, or system paths on 500 errors through `HttpExceptionFilter`.
  4. Track every HTTP interaction via an `x-correlation-id` request/response header, propagated through `CorrelationIdMiddleware`.
  5. Standardize monetary values strictly as integer paise (`amountPaise: number`, currency `'INR'`) to prevent floating-point precision loss. Standardize all timestamps as ISO-8601 UTC strings (`YYYY-MM-DDTHH:mm:ss.sssZ`).
  6. Generate and version OpenAPI 3.0 specifications (`docs/openapi.json`) and automate type-safe Flutter client contracts generation (`scripts/generate-flutter-client.ts`).


## ADR-0013: Synthetic Seed Data and External Provider Adapter Architecture
- **Date**: 2026-11-01
- **Status**: Accepted
- **Context**: The platform requires deterministic end-to-end demo and testing capabilities without chargeable third-party provider calls (Google Maps, Twilio, Razorpay, FCM) or real personal data. Category gating, 100% BEV constraints, and double-entry financial integrity must be verifiable locally.
- **Decision**:
  1. Define external provider contracts behind abstract interfaces (`IMapsProvider`, `IOtpProvider`, `IPaymentsProvider`, `ISmsProvider`, `IPushNotificationProvider`) injected via NestJS dependency injection tokens.
  2. Implement default mock adapters that calculate spherical Haversine distances within Andhra Pradesh, generate cryptographic OTPs with TTL and single-use eviction, simulate integer paise payments with HMAC webhook validation, and record transactional SMS/push messages without billable third-party network egress.
  3. Create an authoritative synthetic seed dataset covering 7 platform roles (Riders, Captains, Dispatcher, Fleet Owner, Finance Admin, Safety Officer, Institution Coordinator) using safe demo phone numbers (`+9191234000xx`), 100% BEVs with AP green plates, PostGIS zone polygons in Visakhapatnam and Vijayawada, and balanced double-entry ledger entries.
  4. Provide a transaction-backed, repeatable, and reversible seeding mechanism via CLI (`pnpm run seed`, `pnpm run seed:reset`) and authenticated HTTP endpoints (`/v1/seed/run`, `/v1/seed/reset`, `/v1/seed/status`).
  5. Enforce release gating server-side: only Visakhapatnam private EV on-demand is enabled; all other city and service combinations are disabled by default with documented blocker codes.


## ADR-0014: Continuous Integration Pipeline, Static Analysis, and Developer Verification Scripts
- **Date**: 2026-11-01
- **Status**: Accepted
- **Context**: To maintain zero regressions across four application shells (API, Ops Web, Rider App, Captain App), prevent broken typechecks or failing tests from merging, and guard against accidental credential or secret leaks, an automated continuous integration pipeline and unified local developer verification tooling are required.
- **Decision**:
  1. Define a multi-stage GitHub Actions CI pipeline (`.github/workflows/ci.yml`) triggered on push and pull requests to `main`, `master`, and `develop`.
  2. Implement an automated secret scanning tool (`scripts/scan-secrets.ts` and `scripts/scan-secrets.ps1`) enforcing zero leaks of live payment keys (Razorpay, Stripe), AWS credentials, private keys, live database passwords, or hardcoded master OTP bypasses.
  3. Require strict TypeScript typecheck (`tsc --noEmit`) across `@ecoride/contracts`, `apps/api`, and `apps/ops-web` as a mandatory blocking gate before merge.
  4. Require Dart static analysis (`dart analyze`) and widget smoke testing (`flutter test`) for both `apps/rider_app` and `apps/captain_app` in CI.
  5. Require database migrations (`pnpm run migration:run`), synthetic seed verification (`pnpm run seed`), backend unit tests, and E2E integration tests against containerized PostGIS and Redis services before allowing any code to merge.
  6. Provide a single-command PowerShell developer script (`scripts/verify-all.ps1`) executing formatting, linting, typechecking, Dart analysis, unit tests, mobile tests, E2E tests, builds, and dependency auditing.


## ADR-0015: Diagnostics, Health Probes, Metrics, and Privacy Log Redaction
- **Date**: 2026-11-01
- **Status**: Accepted
- **Context**: The platform requires enterprise diagnostics, Kubernetes-compatible container liveness and readiness separation, Prometheus metrics exposition, request correlation, and strict privacy redaction preventing personal locations, OTPs, or credentials from leaking into application logs.
- **Decision**:
  1. Isolate Liveness (`GET /health/live`) from external dependencies. The liveness probe signals Node.js process and event loop vitality, ensuring transient database hiccups do not trigger premature, destructive container restarts.
  2. Implement strict Readiness (`GET /health/ready`) requiring active PostgreSQL (PostGIS) and Redis connections. If the database or cache is offline, readiness probe fails with HTTP 503, preventing traffic routing while liveness remains HTTP 200.
  3. Implement Prometheus exposition (`GET /metrics`) and JSON runtime telemetry (`GET /health/metrics`) exposing memory usage, HTTP throughput counters, uptime, and 100% BEV fleet operational counters.
  4. Enforce strict privacy log redaction via `LogSanitizer` and `LoggingInterceptor`:
     - Redact all plain OTPs (`start_otp`, `otp`, `code`) to `[REDACTED_OTP]`.
     - Redact precise geographic coordinates (`latitude`, `longitude`, `pickupLocation`) to `[REDACTED_COORDINATES]`.
     - Redact database connection passwords, tokens, and Authorization headers to `[REDACTED_SECRET]`.
     - Pseudonymize user telephone numbers to `+91*****0001`.
  5. Provide an interactive local observability dashboard in the Next.js Operations Portal (`apps/ops-web/src/app/diagnostics/page.tsx`) and document architecture in `docs/OBSERVABILITY.md`.


## ADR-0016: Identity and Role Schema, Operational Scopes, Ownership Enforcement, and Audit Trail
- **Date**: 2026-11-01
- **Status**: Accepted
- **Context**: The EcoRide mobility platform requires a comprehensive identity, role, and authorization architecture across commuters, captain driver partners, and operations personnel. Strict ownership rules must prevent cross-account data leakage, while privilege escalation and role changes must be authoritatively audited in the database.
- **Decision**:
  1. Define authoritative platform roles and operational permission scopes:
     - `RIDER`: Standard commuter scope (`rider:self`, `booking:create`, `booking:read:self`, `consent:write:self`).
     - `CAPTAIN`: EV driver partner scope (`driver:self`, `shift:manage:self`, `telemetry:emit:self`, `booking:accept:self`).
     - `SUPPORT`: Customer and driver support agent scope with read-only access (`rider:read`, `driver:read`, `booking:read`, `session:read`, `consent:read`, `audit:read`).
     - `FINANCE`: Finance administrator scope (`finance:read`, `finance:write`, `ledger:read`, `payout:manage`, `audit:read`).
     - `FLEET`: Fleet manager scope (`fleet:read`, `fleet:write`, `vehicle:manage`, `telemetry:read`, `depot:manage`).
     - `OPERATOR`: Dispatch and city operator scope (`dispatch:manage`, `zone:manage`, `driver:shift`, `service:toggle`, `booking:read`).
     - `SUPER_ADMIN`: Full platform governance and role administration (`*`).
  2. Implement database-backed relational schema (Migration `1700000000003`):
     - `roles`: Authoritative system roles and JSONB permission scopes.
     - `rider_profiles`: 1:1 user profile with emergency contacts, preferred payment modes, and accessibility flags.
     - `driver_profiles`: 1:1 user profile with commercial license number, verification status (`PENDING`, `VERIFIED`, `REJECTED`, `SUSPENDED`), green-plate permit status, city, and assigned BEV vehicle.
     - `sessions`: User login sessions with SHA-256 token hashing, device fingerprinting, platform tags, and revocation flags.
     - `consents`: User data consents (`TERMS_OF_SERVICE`, `PRIVACY_POLICY`, `LOCATION_TRACKING`, `MARKETING`) with unique composite indexing `(user_id, consent_type, consent_version)`.
     - `audit_events`: Authoritative audit log capturing role changes, cross-account access denials, profile modifications, and session revocations with actor ID, target user ID, previous state, and new state.
  3. Enforce strict server-side ownership rules in `IdentityService`:
     - Self-ownership: A user can access and modify only their own profile, sessions, and consents (`actor.id === targetUserId`).
     - Cross-account access attempts by non-privileged accounts immediately fail with HTTP 403 `ForbiddenException` and are logged as `CROSS_ACCOUNT_ACCESS_DENIED` audit events.
     - Role modifications are strictly restricted to `SUPER_ADMIN`. Any attempt by other roles is blocked and logged as `ROLE_CHANGE_DENIED`. Successful role changes are executed within an atomic database transaction and recorded as `ROLE_CHANGED` with previous and new roles.

## ADR-0017: Mock OTP Send and Verify, Replay Prevention, and Production Adapter Guard
- **Date**: 2026-11-01
- **Status**: Accepted
- **Context**: The platform requires passwordless phone authentication for commuters and captains in Andhra Pradesh, as well as OTP verification for ride starts. Per AGENTS.md Rule 7, no hardcoded OTP bypasses or live gateway calls are permitted in test environments. Production safety demands that synthetic mock adapters cannot be accidentally enabled or executed in production.
- **Decision**:
  1. **Strict India-Format Phone Validation**:
     Enforce `^\+91[6-9]\d{9}$` E.164 mobile format server-side via `@Matches` in DTOs and regex checks in `AuthService`. Rejects non-Indian country codes, 9-digit numbers, and numbers starting with 0-5.
  2. **Short OTP Expiration & Resend Cooldown**:
     Standardize OTP expiration to 5 minutes (300 seconds). Enforce a 60-second cooldown per phone and purpose before subsequent OTP dispatches are permitted. Requests within the cooldown fail with HTTP 429 (`ApiErrorCode.RATE_LIMITED`).
  3. **Attempt Throttling & Brute-Force Lockout**:
     Limit failed verification attempts to a maximum of 3. Each incorrect submission decrements the remaining attempt counter and returns safe user guidance (`Invalid OTP code. X attempt(s) remaining`). Upon the 3rd failed attempt, the record is immediately locked out and purged, triggering a security audit event (`OTP_LOCKOUT`) and returning HTTP 429 (`ApiErrorCode.RATE_LIMITED`).
  4. **Single-Use Replay Prevention**:
     Upon successful OTP verification, the OTP is atomically consumed and purged from memory/cache storage. Immediate or delayed replay attempts with the same code fail with HTTP 400 Bad Request (`OTP not found, expired, or already used`).
  5. **Synthetic Test Adapter & Production Guard**:
     Implement `MockOtpProvider` with dynamic OTP generation (4-digit for `RIDE_START`, 6-digit for `LOGIN`) without any hardcoded bypass values. Check `process.env.NODE_ENV === 'production'` and `process.env.ENABLE_MOCK_PROVIDERS === 'false'` in the constructor and all operational methods (`sendOtp`, `verifyOtp`); any invocation in production throws a fatal configuration exception.
  6. **Auto-Provisioning & Session Issuance**:
     On valid `LOGIN` verification, if the user does not exist, an account is auto-provisioned with `PlatformRole.RIDER` and a standard `RiderProfile`. An authenticated session token is issued via `IdentityService.createSession`. For `RIDE_START` verification, code validity is affirmed without creating a login session.








