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










## ADR-0018: Token and Session Lifecycle, Refresh Rotation (RFC 6819), and Compromise Revocation
- **Date**: 2026-11-01
- **Status**: Accepted
- **Context**: The EcoRide mobility platform requires secure token and session management for commuters (Rider App), drivers (Captain App), and operations staff (Ops Web). Security standards dictate short-lived access tokens, rotation of long-lived refresh tokens, single-use replay protection, device session management, and instant global revocation upon suspected compromise. Furthermore, plaintext refresh secrets must never be persisted to the database.
- **Decision**:
  1. **Short-Lived Access Tokens (15 Minutes)**:
     Implement HMAC-SHA256 JWT access tokens using Node.js built-in `crypto` (`crypto.createHmac`, `crypto.timingSafeEqual`) with a strict 900-second (15-minute) expiration (`ACCESS_TOKEN_EXPIRY_SECONDS`). The token payload encodes `sub` (user UUID), `role`, `scopes`, and `sessionId`. Tampered signatures or expired tokens are immediately rejected with HTTP 401 Unauthorized.
  2. **Refresh Token Rotation (RFC 6819)**:
     Generate 64-character high-entropy hex refresh tokens (`crypto.randomBytes(32).toString('hex')`) with 30-day expiration. In compliance with data protection requirements, plaintext refresh secrets are sent to the client exactly once upon issuance and are NEVER stored in the database. Only the SHA-256 digest is persisted in `sessions.token_hash`. Upon each refresh request (`POST /v1/auth/refresh`), the token is rotated: the current hash is advanced to `sessions.previous_token_hash`, and a newly generated token hash is stored in `sessions.token_hash`.
  3. **Suspected Compromise Detection & Global Revocation**:
     If an incoming refresh token's SHA-256 hash matches `sessions.previous_token_hash`, the server detects an active replay attack (an attacker replaying a stolen token that was already rotated by the legitimate user). The server immediately initiates automated incident response:
     - Atomically revokes all active sessions for that user (`UPDATE sessions SET is_revoked = true WHERE user_id = :userId`).
     - Emits a high-severity `TOKEN_REUSE_DETECTED` security audit event with status `DENIED`.
     - Rejects the request with HTTP 401 Unauthorized ("Suspected token compromise detected. All user sessions have been terminated. Please log in again.").
     - Attempts to refresh using an already-revoked session (`is_revoked = true`) similarly trigger global revocation and audit logging (`REVOKED_TOKEN_REUSE`).
  4. **Explicit Logout & Session Invalidation**:
     `POST /v1/auth/logout` allows clients to invalidate their current session either by passing `refreshToken` in the request body or via the active Bearer token's `sessionId`. The session is marked `is_revoked = true`, halting all subsequent refresh cycles.
  5. **Session & Device Listing with Privacy Isolation**:
     - `GET /v1/auth/sessions` lists active devices/sessions for the authenticated caller, highlighting the caller's active session (`isCurrent = true`).
     - `GET /v1/identity/users/:userId/sessions` strictly enforces account ownership: any user attempting to query another user's sessions is blocked with HTTP 403 Forbidden and logged as `CROSS_ACCOUNT_ACCESS_DENIED`.
     - In all session responses, `token_hash`, `previous_token_hash`, and secret keys are completely stripped and never exposed to clients.
  6. **Endpoint-Driven Global Revocation**:
     `POST /v1/auth/revoke-all` enables authenticated users to immediately revoke all active sessions across all devices (e.g., lost phone, suspicious activity), returning a confirmation of revoked session count.


## ADR-0019: Production OTP Provider Interface (MSG91), DLT Sender Compliance, and Key Segregation
- **Date**: 2026-11-01
- **Status**: Accepted
- **Context**: The EcoRide mobility platform requires SMS OTP verification for passenger and driver onboarding (`LOGIN`), boarding authentication (`RIDE_START`), and critical security alerts (`EMERGENCY`) in Andhra Pradesh. Under the Telecom Regulatory Authority of India (TRAI) TCCCPR (2018) regulations, all SMS traffic must route through registered Distributed Ledger Technology (DLT) portals with approved Principal Entity (PE) credentials, pre-registered 6-alpha headers, and static content templates with variable markers. Real external gateway calls must remain strictly disabled until operational approval, with zero secret leaks.
- **Decision**:
  1. **Production Provider Adapter (`Msg91OtpProvider`)**:
     Implement a robust production adapter implementing `IOtpProvider` for the MSG91 v5 OTP platform. To guarantee production safety, the adapter is protected by a double guard:
     - `MSG91_ENABLED` defaults to `false`. Any dispatch attempt while inactive immediately throws a safe `ServiceUnavailableException` without attempting remote network communication.
     - If `MSG91_ENABLED=true` but `MSG91_AUTH_KEY` is missing or empty, the provider immediately fails safely with `ServiceUnavailableException`.
  2. **TRAI DLT Template Localization (Telugu, English, Hindi)**:
     Register and configure localized DLT templates across the 3 primary languages of Andhra Pradesh:
     - `LOGIN` (6-digit, 5-minute validity): Localized in Telugu (`te`: `1107160000000010001`), English (`en`: `1107160000000010002`), and Hindi (`hi`: `1107160000000010003`).
     - `RIDE_START` (4-digit, 5-minute validity): Localized in Telugu (`te`: `1107160000000010004`), English (`en`: `1107160000000010005`), and Hindi (`hi`: `1107160000000010006`).
     - `EMERGENCY` (6-digit, 5-minute validity): Localized in Telugu (`te`: `1107160000000010007`), English (`en`: `1107160000000010008`), and Hindi (`hi`: `1107160000000010009`).
  3. **Timeout Enforcement & Exponential Backoff Retry**:
     - Configurable request timeout (`MSG91_TIMEOUT_MS`, default 5000ms) enforced via `AbortController`.
     - Automatic exponential backoff retry for transient network anomalies and 5xx carrier errors (`MSG91_MAX_RETRIES`, default 2).
     - Strict no-retry policy for 4xx client errors (e.g., 401 Unauthorized, 400 Bad Request) to prevent resource exhaustion.
  4. **Unified Delivery Status Categories**:
     Map telco SMSC and MSG91 status responses to 8 standard categories: `DELIVERED`, `SUBMITTED`, `PENDING`, `RETRYING`, `FAILED_DND`, `FAILED_OPERATOR`, `FAILED_EXPIRED`, `REJECTED_CREDENTIALS`.
  5. **Privacy Redaction & Secret Scanning**:
     - `LogSanitizer` automatically redacts `authkey`, `apikey`, and query parameters.
     - Logs print masked phone numbers (`+91*****0001`) and never output raw OTP values or secret credentials.
     - Secret scanner rule added to `scripts/scan-secrets.ts` to detect and block live MSG91 auth keys in commits.


## ADR-0020: Rider Profile Management, Chosen Language, and Privacy-Safe Saved Locations
- **Date**: 2026-11-01
- **Status**: Accepted
- **Context**: Commuters using the EcoRide Rider App in Andhra Pradesh need to manage their personal profile, select their preferred interface and SMS notification language (`te` Telugu default, `en` English, `hi` Hindi), and store frequently used pickup and drop locations (e.g., Home, Office, Railway Station). To safeguard commuter privacy and prevent spatial surveillance or unauthorized profile scraping, saved locations must strictly store only necessary metadata, enforce maximum capacity constraints, and enforce multi-layered row-level and path-level account ownership checks.
- **Decision**:
  1. **Preferred Language Enforcement**:
     - Add `preferred_language` (`VARCHAR(10) NOT NULL DEFAULT 'te'`) to `rider_profiles` with database check constraint `IN ('te', 'en', 'hi')`.
     - Update DTO and service layer to validate and accept language changes (`AppLanguage`), defaulting to Telugu (`te`) per regional EV mobility guidelines.
  2. **Privacy-Safe Saved Locations Schema**:
     - Create `saved_locations` table with UUID primary key, `user_id` foreign key with `ON DELETE CASCADE`, `label` (`VARCHAR(50)`), `address_type` (`PICKUP`, `DROP`, `BOTH`), `address_line` (`VARCHAR(255)`), optional `landmark` (`VARCHAR(100)`), `latitude`, `longitude`, and PostGIS `geometry(Point, 4326)` column.
     - Add database constraints on coordinate bounds (`latitude BETWEEN -90 AND 90`, `longitude BETWEEN -180 AND 180`) and create a PostGIS GiST index on `location`.
     - Exclude continuous tracking, user visit timestamps, and device sensor breadcrumbs from saved locations to minimize stored sensitive geo-data.
  3. **Row-Level & Path-Level Ownership Isolation**:
     - Implement dual-layer ownership enforcement in `IdentityService`:
       - Path-level: `assertCanAccessUser(actor, targetUserId)` rejects attempts by Rider A to target Rider B's endpoints with HTTP 403 Forbidden (`CROSS_ACCOUNT_ACCESS_DENIED` audit event).
       - Row-level: Queries filtering by `locationId` verify `location.userId === targetUserId`, returning HTTP 404 Not Found if the resource does not belong to the user, completely preventing horizontal privilege escalation (IDOR).
  4. **Input Limits & Pagination**:
     - Limit commuters to a maximum of 20 saved locations. Attempting to add a 21st location is rejected with HTTP 400 Bad Request ("Maximum limit of 20 saved locations reached").
     - Implement pagination query (`page`, `limit` clamped between 1 and 50) returning `{ items, total, page, limit, totalPages }` with optional `type` filter.
  5. **Dual Routing Architecture**:
     - Commuter shortcut routes under `/v1/riders/profile` and `/v1/riders/saved-locations` bound directly to the authenticated caller's identity (`actor.id`).
     - Administrative / platform routes under `/v1/identity/users/:userId/saved-locations` protected by RBAC scopes and ownership checks.
  6. **Authoritative Security Auditing**:
     - Record immutable audit events in `audit_events` table for `RIDER_PROFILE_UPDATED`, `SAVED_LOCATION_CREATED`, `SAVED_LOCATION_UPDATED`, `SAVED_LOCATION_DELETED`, and `CROSS_ACCOUNT_ACCESS_DENIED`.


## ADR-0021: Privacy, Granular Consent Architecture, DPDP Data Portability, and Erasure with Statutory Retention Exceptions
- **Date**: 2026-11-01
- **Status**: Accepted
- **Context**: The EcoRide electric mobility platform operates in Andhra Pradesh subject to the Digital Personal Data Protection (DPDP) Act 2023, the Companies Act 2013, the Central Goods and Services Tax (CGST) Act 2017, and the Motor Vehicles Act (1988/2019). Commuters and drivers require transparent policy versions, explicit notice acceptance, granular communications opt-ins, and purpose-specific location consents. Furthermore, users have statutory rights to export their personal data portfolio and request account erasure, while the platform must uphold mandatory statutory retention obligations for financial invoices, tax audits, and transport safety records.
- **Decision**:
  1. **Granular Consent & Policy Versioning**:
     - Maintain authoritative policy versioning (`PolicyVersionDto`) across mandatory legal notices (`TERMS_OF_SERVICE` v1.2, `PRIVACY_POLICY` v1.2) and purpose-specific consents (`LOCATION_TRIP_PROCESSING` v1.0, `LOCATION_BACKGROUND_FLEET` v1.0, `LOCATION_NEARBY_OFFERS` v1.0, `COMMUNICATIONS_MARKETING_SMS` v1.0, `COMMUNICATIONS_MARKETING_EMAIL` v1.0, `COMMUNICATIONS_PROMOTIONAL_PUSH` v1.0).
     - Store granular consents in `consents` table with unique constraint `(user_id, consent_type, consent_version)` and composite index `(user_id, consent_type, is_granted)`.
  2. **Authoritative Enforcement of Revoked Permissions**:
     - Implement `PrivacyService.evaluatePermission()`: when an optional permission (e.g. `MARKETING_SMS`, `LOCATION_NEARBY_OFFERS`) is revoked, the system returns `isAllowed: false`, `consentStatus: 'REVOKED'`, and explicitly discloses the revocation timestamp. Dispatches, promotional notifications, and marketing location queries strictly respect revoked permissions server-side.
  3. **DPDP Data Portability & Personal Portfolio Export**:
     - Implement `POST /v1/privacy/export` generating a portable structured JSON export including user identifiers, preferred language, granted/revoked consents, saved locations, sessions, and aggregate booking counts.
     - Strictly mask phone numbers (`+91*****0001`) and emails, and never expose plaintext passwords or session token hashes.
  4. **Account Erasure Workflow & Statutory Retention Exceptions**:
     - Implement `POST /v1/privacy/deletion-request` with blocking retention checks:
       - Active bookings in progress (`IN_PROGRESS`, `IN_TRIP`, `DISPATCHED`, `ARRIVED`, `MATCHING`, `CONFIRMED`) reject deletion with HTTP 422 Unprocessable Entity (`ACTIVE_RIDE_BLOCKS_DELETION`).
       - If eligible, transparently disclose statutory retention exceptions:
         1. `FINANCIAL_TRANSACTIONS_AND_TAX`: 8 years retention under Section 128 of the Companies Act 2013 and CGST Act 2017 for invoices, tax ledger entries, and transaction records in pseudonymized format.
         2. `TRANSPORT_SAFETY_AND_INCIDENT_AUDIT`: 3 years retention under the Motor Vehicles Act (1988/2019) and Andhra Pradesh Aggregator Guidelines for safety audit logs and SOS incident records.
       - Execute immediate erasure: delete saved locations, revoke all active sessions, revoke optional consents, set `isActive: false`, set `name: 'DELETED_COMMUTER'`, and pseudonymize `phone` to `del_<timestamp>` to preserve foreign key references while releasing the user's phone number.
  5. **Auditable Governance & Cross-Account Isolation**:
     - Authoritatively log immutable audit events to `audit_events`: `CONSENT_GRANTED`, `CONSENT_REVOKED`, `DATA_EXPORT_REQUESTED`, `DATA_DELETION_PROCESSED`, `DATA_DELETION_REJECTED`, and `CROSS_ACCOUNT_ACCESS_DENIED`.
     - Enforce strict account ownership (`assertCanAccessUser`): Rider A cannot view, grant, revoke, export, or request deletion of Rider B's data (HTTP 403 Forbidden).



## ADR-0022: Localized Content Infrastructure, Bilingual String Resources, and Backend Response-Message Identifiers
- **Date**: 2026-11-01
- **Status**: Accepted
- **Context**: The EcoRide electric mobility platform operates across Andhra Pradesh. Commuters and EV captains require native Telugu (`te`) as the regional default language and English (`en`) as the universal fallback across both Flutter mobile applications (`apps/rider_app`, `apps/captain_app`) and the NestJS backend API (`apps/api`). Per EV-021 requirements, user-facing UI screens must not hardcode display strings, missing translations must fall back gracefully without blanks or crashes, commuter/captain language choices must persist across sessions, and backend response and error envelopes must emit standard `messageKey` identifiers for client-side localized rendering.
- **Decision**:
  1. **Standardized Response Message Key Taxonomy (`@ecoride/contracts`)**:
     - Define `ResponseMessageKey` enum covering core domain events across Booking (`BOOKING_CREATED`, `BOOKING_MATCHING`, `BOOKING_CAPTAIN_ASSIGNED`, `BOOKING_CAPTAIN_ARRIVED`, `BOOKING_TRIP_STARTED`, `BOOKING_TRIP_COMPLETED`, `BOOKING_CANCELLED`, `BOOKING_ACTIVE_EXISTS`, `BOOKING_ZONE_RESTRICTED`, `BOOKING_NO_DRIVERS`), Payment (`PAYMENT_ORDER_CREATED`, `PAYMENT_SUCCESSFUL`, `PAYMENT_REFUND_PROCESSED`, `PAYMENT_UNSETTLED_DUES`, `PAYMENT_GATEWAY_ERROR`), Safety (`SAFETY_SOS_TRIGGERED`, `SAFETY_TRIP_SHARED`, `SAFETY_SPEED_WARNING`, `SAFETY_CAPTAIN_VERIFIED`), Captain Duty & Telematics (`CAPTAIN_DUTY_ONLINE`, `CAPTAIN_DUTY_OFFLINE`, `CAPTAIN_BATTERY_LOW`, `CAPTAIN_SHIFT_EXPIRED`), and Errors (`AUTH_INVALID_OTP`, `AUTH_SESSION_EXPIRED`, `PRIVACY_CONSENT_REQUIRED`, `SYSTEM_UNEXPECTED`).
     - Define `SupportedLocale = 'en' | 'te' | 'hi'` with Telugu default and English fallback.
     - Centralize authoritative bilingual dictionaries in `LOCALIZED_MESSAGES` with parameter interpolation markers (`{{name}}`, `{{amount}}`, `{{minSoc}}`).
  2. **Backend Localization Engine & REST Endpoints (`apps/api`)**:
     - Implement `@Global()` `LocalizationService` with multi-tier fallback: `targetLocale -> en -> messageKey`. Unknown keys and missing translations never throw runtime errors.
     - Implement `LocalizationController` exposing `GET /v1/localization/messages?locale=...` (full dictionary sync) and `GET /v1/localization/messages/:key?locale=...` (single key resolution).
     - Extend `HttpExceptionFilter` and `ApiErrorPayload` to propagate `messageKey` in error envelopes so mobile clients can look up and render device-localized messages for API exceptions.
  3. **Flutter Mobile Localization Architecture (`apps/rider_app` & `apps/captain_app`)**:
     - `AppLocalizations`: Complete bilingual string dictionaries with typed getters for zero hardcoding in UI screens, supporting Telugu and English with automatic fallback and parameter interpolation (`{name}`, `{amount}`).
     - `LocaleController`: Persistent language state manager extending `ChangeNotifier`, supporting `setLocale(Locale)` and `toggleLocale()` with automatic client-side storage persistence across app restarts and rebuilds.
     - `LanguageSwitcherButton`: One-tap dynamic language switcher widget embedded in AppBars with responsive feedback.
     - Refactored `RiderHomeScreen` and `CaptainHomeScreen` to replace all hardcoded English/Telugu strings with `AppLocalizations` typed getters.



## ADR-0023: Secure KYC Document Management, Private Object Storage, and Temporary Signed Access
- **Date**: 2026-11-01
- **Status**: Accepted
- **Context**: The EcoRide electric mobility platform in Andhra Pradesh requires driver captains and commuters to upload official verification documents (Driving Licenses, Green-Plate 100% BEV Commercial Permits, Vehicle Registration Certificates, Aadhaar/PAN, and Police Verification certificates). Per AGENTS.md Rule 5, KYC files, personal identification, and driver documents must never be exposed publicly or cross-account. Storage infrastructure must protect against extension spoofing (e.g. executable binaries disguised as `.jpg` or `.pdf`), oversized uploads, malware injection, and unauthorized or expired link access.
- **Decision**:
  1. **Private Object Storage Architecture (`IObjectStoreAdapter` & `PrivateDiskStorageAdapter`)**:
     - Store objects strictly in private storage with no public HTTP endpoints or open cloud buckets.
     - Generate isolated storage keys partitioned by user and document type (`kyc/{userId}/{documentType}_{timestamp}_{uuid}.ext`).
     - Sanitize paths to prevent directory traversal (`../`) attacks.
  2. **Binary Inspection & Anti-Spoofing (`inspectMagicBytes`)**:
     - Inspect raw binary magic bytes independently of file extensions or client-reported MIME types.
     - Authorize only standard document types: JPEG (`FF D8 FF`), PNG (`89 50 4E 47...`), PDF (`%PDF`), WebP (`RIFF...WEBP`).
     - Actively detect and reject executable payloads (Windows `MZ` binaries, Unix ELF executables, shell scripts `#!`, HTML/JavaScript markup) with HTTP 400 Bad Request.
  3. **Buffer Size Enforcement**:
     - Enforce a strict 5 MB limit (`MAX_FILE_SIZE_BYTES = 5,242,880`). Oversized uploads are rejected with HTTP 413 Payload Too Large.
  4. **Pluggable Malware Scanning Integration Point (`IMalwareScanner` & `DefaultMalwareScanner`)**:
     - Integrate a security scanner scanning document buffers for synthetic EICAR signatures and malicious embedded PDF actions.
     - Infected files are rejected with HTTP 422 Unprocessable Entity, quarantined, and audited without persisting active records.
  5. **Cryptographic Temporary Signed Access (HMAC-SHA256)**:
     - Direct unauthenticated access to KYC files is refused with HTTP 401 Unauthorized.
     - Cross-account access attempts (Rider B attempting to view Captain A's KYC files) fail with HTTP 403 Forbidden.
     - Presigned access URLs use HMAC-SHA256 signed tokens encoding document ID, storage key, user ID, and millisecond expiration timestamp. Expired links (`Date.now() > exp`) or tampered signatures fail with HTTP 403 Forbidden.
  6. **Statutory Retention Policies & Automatic Expiry**:
     - Enforce `KYC_STATUTORY_5_YEARS` (5-year retention under Motor Vehicles Act 1988/2019 for transport captain licenses) and `TEMPORARY_90_DAYS` for session artifacts.
     - Expired documents refuse download access; `evaluateRetentionPolicies` marks expired records and purges stored files.
  7. **Comprehensive Security Auditing**:
     - Record immutable audit logs for all security events: `DOCUMENT_UPLOADED`, `DOCUMENT_ACCESS_LINK_GENERATED`, `DOCUMENT_DOWNLOADED`, `DOCUMENT_SPOOFING_REJECTED`, `DOCUMENT_MALWARE_REJECTED`, `DOCUMENT_EXPIRED_ACCESS_ATTEMPT`, `CROSS_ACCOUNT_DOCUMENT_ACCESS_DENIED`, and `DOCUMENT_DELETED`.

## ADR-0024: Verified EV Vehicle Records, Electric-Only Enforcement, and Range Telemetry
- **Date**: 2026-11-01
- **Status**: Accepted
- **Context**: Per PRD and AGENTS.md Rule 2, propulsion on the EcoRide mobility platform in Andhra Pradesh must be 100% ELECTRIC (`BATTERY_ELECTRIC`). Category availability and roadworthiness must be enforced server-side by city, vehicle status, green-plate commercial verification, and regulatory document expiry dates. Client requests (such as tampered Flutter payloads or malicious API consumers submitting non-electric vehicles) must never be able to bypass electric-only enforcement.
- **Decision**:
  1. **Authoritative Server-Side Electric-Only Propulsion Enforcement**:
     - Implement `VehiclesService.assertElectricPropulsion()`: strictly validates that `propulsionType === 'BATTERY_ELECTRIC'`.
     - Explicitly checks against `DISALLOWED_PROPULSION_TYPES` (`PETROL`, `DIESEL`, `CNG`, `HYBRID`, `PLUGIN_HYBRID`, `LPG`, `INTERNAL_COMBUSTION`) and rejects non-electric propulsion with HTTP 400 Bad Request.
     - Enforces the same check on `updateVehicle`, preventing any existing vehicle from having its propulsion altered to non-electric.
     - Database Check Constraint `chk_vehicles_electric_only` (`"propulsion_type" = 'BATTERY_ELECTRIC'`) enforces propulsion integrity at the PostgreSQL storage layer.
  2. **Comprehensive EV Vehicle Schema & Multi-Tier Regulatory Compliance**:
     - Expand `vehicles` entity and migration `1700000000008-ExpandVehiclesTableWithEVCompliance`:
       - Electric specs: `make`, `model`, `yearOfManufacture`, `batteryCapacityKwh`, `ratedRangeKm`, `currentSocPercent`.
       - Regulatory fields: `registrationNumber` (unique), `greenPlateVerified`, `insurancePolicyNumber`, `insuranceExpiryDate`, `fitnessCertificateNumber`, `fitnessExpiryDate`, `commercialPermitNumber`, `commercialPermitExpiry`, `verificationStatus`, `rejectionReason`, `city`, `isActive`.
       - Category & seating constraints: Check constraint `chk_vehicles_seating_positive` (`approved_passenger_seating BETWEEN 1 AND 10`) and server-side category caps (2W: 1 seat, 3W: 3 seats, 4W cab: 4 seats, 4W van: 10 seats).
       - Roadworthiness getter `isRoadworthy`: evaluates active flag, green plate verification, verified status, and real-time expiration checks across commercial insurance, transport fitness, and AP green-plate permits.
  3. **Real-Time Battery Telemetry & Dynamic Range Calculation**:
     - Support multiple telemetry sources (`OBD_TELEMATICS`, `BMS_IOT_GATEWAY`, `OEM_CLOUD_API`, `MANUAL_TELEMETRY`).
     - Real-time telemetry endpoint `POST /v1/vehicles/:id/telemetry` updates `currentSocPercent`, `telemetryDeviceId`, and `telemetryLastPingAt`.
     - Dynamically computes `estimatedRangeKm = Math.round(ratedRangeKm * soc / 100)`.
  4. **Regulatory Verification & Compliance Audit Breakdown**:
     - Expose `GET /v1/vehicles/:id/compliance` providing real-time evaluation of `insuranceValid`, `insuranceDaysRemaining`, `fitnessValid`, `commercialPermitValid`, `greenPlateVerified`, `propulsionValid`, and human-readable actionable issues.
     - Restrict verification actions (`POST /v1/vehicles/:id/verify`) to platform operators and fleet administrators with audit logging (`VEHICLE_VERIFICATION_STATUS_CHANGED`). Non-operators attempting verification are rejected with HTTP 403 Forbidden.



## ADR-0025: Captain Onboarding Application Lifecycle, Document Verification, and Independent Review History
- **Date**: 2026-11-01
- **Status**: Accepted
- **Context**: The EcoRide electric mobility platform in Andhra Pradesh requires prospective captains to complete an onboarding workflow including personal KYC, verified EV vehicle registration, commercial green-plate permits, and review history. Prior to EV-024, no authoritative lifecycle managed application drafting, submission validation, independent driver vs. vehicle verification, rejection resubmissions, and operator review auditing. Rejecting an application must never create duplicate records or lose prior review notes. Furthermore, EV propulsion must be guaranteed server-side and cross-account data exposure must be prevented.
- **Decision**:
  1. **Single Application Entity with In-Place Resubmission (`captain_applications`)**:
     - Enforce a unique index on `user_id` (`uq_captain_applications_user_id`) guaranteeing exactly one application per user account.
     - Rejected applications do not spawn duplicate rows. The existing entity remains the single source of truth and unlocks for in-place draft updates (`isEditable = status IN ('DRAFT', 'REJECTED')`).
     - Resubmitting an application updates the status back to `SUBMITTED`, increments `submission_count`, and updates `submitted_at`, preserving the stable application UUID and audit linkage.
  2. **Independent Driver and Vehicle Verification**:
     - Model `driverRequirementsStatus` and `vehicleRequirementsStatus` as distinct independent lifecycle fields (`PENDING`, `APPROVED`, `REJECTED`).
     - Operators can independently reject vehicle documentation (e.g. blurry RC photo) while approving driver KYC, or vice versa, with specific reason strings (`driverRejectionReason`, `vehicleRejectionReason`).
     - Full application approval and promotion to `CAPTAIN` role requires both requirements to be verified and satisfied.
  3. **Immutable Review History Audit Trail (`captain_application_reviews`)**:
     - Maintain a child table storing every state transition and review event with `reviewer_id`, `previous_status`, `new_status`, `driver_requirements_status`, `vehicle_requirements_status`, and human-readable operator `notes`.
     - Expose historical chronological audit trail via `GET /v1/captain-applications/me/history` for captains and `GET /v1/captain-applications/:id` for operators.
  4. **Electric-Only Propulsion Guarantee & Document Ownership Verification**:
     - Database check constraint `chk_captain_apps_propulsion_electric` (`"propulsion_type" = 'BATTERY_ELECTRIC'`) guarantees zero non-electric vehicles at the database layer.
     - Server-side validation rejects non-electric propulsion types (`PETROL`, `DIESEL`, `CNG`, etc.) with HTTP 400 Bad Request.
     - Validate that all referenced document IDs (`drivingLicenseDocId`, `aadhaarDocId`, `vehicleRcDocId`, `greenPlatePermitDocId`) are owned by the applicant user and have passed security scanning (`CLEAN`).
  5. **Automated Activation on Approval**:
     - When an operator approves an application with both driver and vehicle requirements verified, the backend transaction:
       - Promotes the user role in `users` to `CAPTAIN`.
       - Creates or updates `driver_profiles` with `verification_status = 'VERIFIED'` and `green_plate_permit_verified = true`.
       - Automatically creates or links the verified EV vehicle in `vehicles` table with `propulsion_type = 'BATTERY_ELECTRIC'` and assigns it to the driver profile.
  6. **Security & Cross-Account Isolation**:
     - Captains can only access and edit their own application (`GET/PUT /v1/captain-applications/me`). Attempts to view or mutate another applicant's application return HTTP 403 Forbidden.
     - Administrative endpoints (`GET /v1/captain-applications` and `POST /v1/captain-applications/:id/review`) require `OPERATOR` or `SUPER_ADMIN` roles. Regular riders/captains are rejected with HTTP 403 Forbidden.


## 2026-11-01 — ADR-0026: Captain Compliance Lifecycle, Document Validity Expiration, and Duty Assignment State Machine

- **Status**: Accepted
- **Context**:
  In an EV-only mobility platform, driver regulatory compliance and operational duty state must be maintained independently from onboarding draft completeness. A captain whose application was reviewed and approved must never be mislabeled as "draft". Furthermore, assignment eligibility to go online (`duty_status = ONLINE`) and receive ride dispatches requires active verification, valid (unexpired) documents (driving license, commercial green-plate EV permits, insurance), an assigned roadworthy EV vehicle with sufficient battery SoC (&ge; 15%), and municipal EV pilot zone clearance. Drivers with expired credentials or under operational suspension must be strictly prevented from toggling duty to ONLINE. When an operator suspends an active captain, safety protocols dictate immediately forcing the captain to OFFLINE.
- **Decisions**:
  1. **Separation of Application Completeness from Compliance State**:
     - Decouple onboarding application state (`CaptainApplicationStatus`: `DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`) from driver compliance state (`DriverComplianceStatus`: `PENDING`, `UNDER_REVIEW`, `VERIFIED`, `REJECTED`, `SUSPENDED`, `EXPIRED`).
     - A verified captain with a complete application evaluates strictly as `VERIFIED` and `isDraftComplete = true`, preventing false draft relabeling.
  2. **Multi-Constraint Assignment Eligibility Engine**:
     - Implement backend-authoritative eligibility evaluation (`calculateEligibility` in `ComplianceService`) returning `CaptainEligibilityDto`:
       - `approvalDetails`: application approved, driver KYC verified, EV green plate verified, vehicle linked.
       - `documentValidity`: driving license not expired, EV roadworthy, battery SoC above critical threshold (&ge; 15%).
       - `zonePermission`: municipal corridor active and city authorized for EV commercial dispatches.
       - `isEligibleForAssignment`: aggregate boolean requiring all conditions to pass; provides detailed `ineligibilityReasons` array on failure.
  3. **Duty Online / Offline State Machine & Enforcement**:
     - Support `DutyStatus`: `ONLINE`, `OFFLINE`, `ON_TRIP` with timestamp auditing (`duty_last_toggled_at`).
     - Captains may go OFFLINE at any time.
     - Going ONLINE strictly validates assignment eligibility. If compliance status is `EXPIRED`, `SUSPENDED`, or vehicle is unroadworthy, the endpoint rejects the request with HTTP 422 Unprocessable Entity and logs a `CAPTAIN_DUTY_TOGGLE_REJECTED` audit event.
  4. **Safety Auto-Offline on Administrative Suspension**:
     - When an operator or admin updates compliance status to `SUSPENDED` (requiring mandatory `suspensionReason`), any currently online captain is automatically forced to `OFFLINE` in the database transaction, revoking dispatch eligibility immediately.
  5. **Database Schema & Check Constraints**:
     - Migration 10 (`AddDriverComplianceAndDutyStatus1700000000010`) adds `license_expiry_date`, `duty_status`, `duty_last_toggled_at`, `suspension_reason`, and `compliance_notes` to `driver_profiles`.
     - Enforce valid states via check constraints `chk_driver_profiles_compliance_status` and `chk_driver_profiles_duty_status`.
  6. **Security & RBAC Enforcement**:
     - Captains can query their own eligibility (`GET /v1/captains/me/compliance`) and toggle their duty (`POST /v1/captains/me/duty`).
     - Updating compliance status (`POST /v1/captains/:userId/compliance/status`) and querying arbitrary captain compliance (`GET /v1/captains/:userId/compliance`) require `OPERATOR` or `SUPER_ADMIN` roles (`'driver:read'`, `'driver:write'`). Cross-account unauthorized access returns HTTP 403 Forbidden.


## 2026-11-02 — ADR-0027: Flutter Captain Onboarding Flow, Document Upload Resiliency, and Application Lifecycle State Presentation

- **Status**: Accepted
- **Context**:
  Captain onboarding is the gateway for enrolling verified EV drivers and vehicles into the Andhra Pradesh zero-emission transit network. The onboarding user experience must handle intermittent 4G/5G mobile connectivity, device camera permission restrictions, complex regulatory document uploads (DL, Aadhaar, EV RC, Commercial Green-Plate Permit), statutory EV compliance declarations, and administrative review states (`DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`). Crucially, if an application is rejected by operators for blurry images or missing details, the captain must be able to resume and edit their rejected application without re-entering existing personal or vehicle data.
- **Decisions**:
  1. **Step-by-Step Onboarding Architecture (`CaptainOnboardingController`)**:
     - Modeled a 6-step state machine: `phoneLogin` -> `personalDetails` -> `vehicleDetails` -> `documents` -> `previewSubmit` -> `applicationStatus`.
     - Step progression is governed by strict form and field-level validation before advancing (`canProceedToNextStep`), preventing premature submission of incomplete profiles.
     - Implemented `ListenableBuilder` reactive bindings across all sub-screens ensuring real-time UI updates when inputs change or upload states transition.
  2. **Strict Client-Side EV-Only Assurance**:
     - Vehicle details screen enforces 100% Battery Electric Propulsion (`BATTERY_ELECTRIC`).
     - Hard-coded UI banner and disabled non-EV selectors reinforce that internal combustion engines (ICE), CNG, and hybrid vehicles are prohibited on the platform.
     - Captures vehicle battery capacity in kWh, ensuring compatibility with telemetry and range calculations.
  3. **Document Upload Resiliency & Permission Fallback**:
     - Modeled document item state machine: `idle` -> `uploading` -> `uploaded` / `interrupted` / `failed`.
     - Added simulated latency and network drop detection with a dedicated "Slow Connection Detected" warning banner.
     - Handled interrupted uploads with in-place "Retry" actions that resume failed documents without clearing previously uploaded files.
     - Handled camera permission denial (`setCameraDenied(true)`) by displaying an explanatory dialog with an automatic fallback action to select files from device storage.
  4. **Non-Destructive Review, Edit & Resubmission**:
     - `CaptainPreviewSubmitScreen` provides high-level summary cards for Personal, Vehicle, and Document data with direct "Edit" jump links to respective steps without data loss.
     - Requires an explicit statutory EV driver declaration checkbox before enabling the submission action.
     - `CaptainApplicationStatusScreen` displays real-time status banners with reviewer feedback notes for `REJECTED` applications.
     - Tapping "Edit Draft & Resubmit" preserves all previously saved fields in `CaptainDraftData`, navigates the user back to editable steps, and allows re-submission with an updated payload.
  5. **Bilingual Localization (Telugu & English)**:
     - All onboarding screen titles, form labels, helper captions, permission alerts, and error messages are localized in `AppLocalizations` with English and Telugu translations and type-safe getters.
  6. **Deterministic Asynchronous Widget Test Suite**:
     - Decoupled periodic countdown timers (OTP resend cooldown) via configurable `enableCooldownTimer: false` flag to prevent non-settling timers in `WidgetTester.pumpAndSettle()`.
     - Built comprehensive widget tests covering phone OTP authentication, personal details validation, EV vehicle details, document upload interruptions and camera fallbacks, preview editing, and full end-to-end onboarding lifecycle.


## 2026-11-02 — ADR-0028: One-Review Verification Queue, Discrepancy Reason Taxonomy, and Immediate Duty Availability Synchronization

- **Status**: Accepted
- **Context**:
  To onboard verified EV captains into the Andhra Pradesh mobility network without operational friction, platform operators require a centralized, searchable single-pane reviewer UI. Reviewers must inspect the exact candidate data submitted during mobile onboarding (personal identity, AP commercial driving license, 100% BEV specs, AP green-plate registration, and uploaded KYC certificates) without manual duplicate field re-entry. Furthermore, reviewer verification decisions must immediately synchronize with the driver duty availability engine: approval must activate captain compliance and duty eligibility (`ONLINE`), while rejection must record granular discrepancy reasons, unlock candidate drafts without duplicate records, and immediately force active duty `OFFLINE`. Access to private KYC documents must be strictly restricted to authenticated reviewers with audit logging.
- **Decisions**:
  1. **Searchable Verification Queue Architecture (`packages/contracts`, `apps/api`, `apps/ops-web`)**:
     - Extended `CaptainApplicationsQuery` and query DTO with `search?: string` to support server-side and client-side multi-field matching across candidate name, phone number, driving license number, vehicle registration number, and operating corridor.
     - Implemented real-time searchable reviewer UI in Next.js Ops Portal (`apps/ops-web/src/app/captain-applications/page.tsx`) with queue metrics, filter chips (status and city), and instant fuzzy matching.
  2. **Single-Pane Inspection Without Manual Duplicate Field Entry**:
     - The verification desk renders candidate information pre-populated directly from submitted onboarding data across Driver KYC and Vehicle Requirements panels.
     - Eliminates duplicate data re-entry: reviewers only review candidate credentials, verify certificates, and record decision verdicts.
  3. **Standardized Discrepancy Reason Taxonomy**:
     - Categorized discrepancy reasons for Driver KYC (blurry license photo, expired license, name mismatch, unverified transport badge, cropped ID proof) and Vehicle KYC (blurry RC scan, missing AP commercial green-plate permit, plate mismatch, sub-standard battery capacity, non-electric vehicle rejection).
     - Provides pre-defined discrepancy selectors alongside custom remarks, ensuring precise, actionable feedback for captain draft resumption.
  4. **Immediate Duty Availability Synchronization**:
     - Approval: Updates application status to `APPROVED`, promotes user role to `CAPTAIN`, activates `DriverProfile` with `verificationStatus = VERIFIED`, sets `licenseExpiryDate`, links verified EV vehicle, and immediately authorizes duty toggle to `ONLINE`.
     - Rejection: Updates application status to `REJECTED`, updates `DriverProfile` with `verificationStatus = REJECTED`, records discrepancy notes, forces active duty to `OFFLINE` (`duty_last_toggled_at` updated), and immediately rejects any attempt to toggle duty to `ONLINE` with HTTP 422 Unprocessable Entity.
  5. **Authorized Reviewer Document Security & Access Control**:
     - KYC document viewing is strictly enforced via `assertCanAccessDocument` in `DocumentsService`.
     - Only authorized reviewers (`OPERATOR`, `SUPER_ADMIN`, `SUPPORT`, `SAFETY_OFFICER`, or `kyc:read` scope) and document owners can generate temporary HMAC-SHA256 signed access URLs or download files.
     - Unauthorized cross-account access attempts by regular riders or other captains are rejected with HTTP 403 Forbidden and logged as `CROSS_ACCOUNT_DOCUMENT_ACCESS_DENIED` security audit events.


## 2026-11-02 — ADR-0029: Permitted Seating Capacity Breakdown, D+3 Passenger Derivation, and Vehicle Classification Controls

- **Status**: Accepted
- **Context**:
  Commercial passenger vehicles in Andhra Pradesh operate under strict Regional Transport Authority (RTA) stage and contract carriage regulations. Under standard commercial transport conventions, vehicle seating is specified in `D+X` notation, where `D` explicitly represents 1 driver seat and `X` represents the legal passenger/customer carrying capacity. For example, in an electric 3-wheeler auto rickshaw (`AUTO_COMMUTE_3W`), `D+3` denotes 1 captain/driver seat and strictly 3 legal passenger seats (a total seating capacity of 4). Misinterpreting `D+3` as 3 total seats or allowing over-capacity carriage violates statutory safety regulations, invalidates commercial insurance, and risks passenger safety.
  Furthermore, per AGENTS.md Rule 2 and Rule 3:
  1. Propulsion must be 100% ELECTRIC and category availability must be enforced server-side by city, zone, service permission, driver and vehicle status.
  2. Never invent operational permit approvals, tariffs, contracts or live keys. Keep uncertain service types disabled by default.
  Consequently, vehicle records must derive and store passenger capacity separately from the driver, enforce category seating ceilings, validate service class / city matching server-side, reject missing registrations, and block over-capacity and incompatible operations from dispatch and duty availability.

- **Decisions**:
  1. **Explicit Seating Capacity Breakdown Model (`packages/contracts`, `apps/api`)**:
     - Extended vehicle data models with `seatingConfiguration` (string e.g. `'D+1'`, `'D+3'`, `'D+4'`, `'D+7'`), `driverSeatCount` (integer, fixed at 1), `legalPassengerCapacity` (integer, customer seats), and `totalSeatingCapacity` (integer, driver + customer seats).
     - Defined check constraint in PostgreSQL `chk_vehicles_seating_driver_separate`: `total_seating_capacity = approved_passenger_seating + 1`.
     - Defined regex format check `chk_vehicles_seating_config_format`: `seating_configuration ~ '^D\+[0-9]+$'`.
     - Provided authoritative derivation method `VehiclesService.deriveSeatingCapacity()` that strictly treats `D+3` as 3 customer seats, 1 driver seat, and 4 total seats.
  2. **Category Seating Ceilings and Classification Controls**:
     - Enforced category limits in `CATEGORY_SEATING_LIMITS`:
       - `CITY_COMMUTE_2W`: exactly 1 customer seat (`D+1`, total 2 seats).
       - `AUTO_COMMUTE_3W`: up to 3 customer seats (`D+3`, total 4 seats).
       - `CAB_PRIVATE_4W`: up to 4 customer seats (`D+4`, total 5 seats).
       - `VAN_COMMUTE_4W`: 5 to 10 customer seats (e.g. `D+7`, total 8 seats).
     - Mapped vehicle categories to service classes (`ECO_BIKE`, `ECO_AUTO`, `ECO_CAB`, `ECO_VAN`).
  3. **Server-Side City and Service Class Compatibility Matching (Rules 2 & 3)**:
     - Enforced `CITY_PERMITTED_CATEGORIES`: Visakhapatnam urban pilot permits `CITY_COMMUTE_2W`, `AUTO_COMMUTE_3W`, and `CAB_PRIVATE_4W`. `VAN_COMMUTE_4W` is disabled in the standard urban commute pilot.
     - Future expansion cities (`vijayawada`, `guntur`, `tirupati`) remain strictly disabled by default until official municipal launch gates are satisfied.
     - Rejected any registration, update, or dispatch request pairing incompatible service classes or unauthorized cities with HTTP 400 Bad Request.
  4. **Audited Capacity Changes**:
     - Updates to vehicle seating configuration or passenger capacity trigger explicit `VEHICLE_CAPACITY_CHANGED` audit events in `audit_events`, capturing previous and new capacity states, configuration strings, and acting reviewer/operator IDs.
  5. **Authoritative Operational Readiness Validation Endpoint (`POST /v1/vehicles/:id/validate-operation`)**:
     - Evaluates dispatch operational readiness against requested seats, requested service class, and operating city.
     - Accumulates blocking reasons:
       - `MISSING_REGISTRATION`: blank or absent registration plate.
       - `UNVERIFIED_REGISTRATION`: commercial green plate unverified.
       - `OVER_CAPACITY`: requested seats exceed vehicle `legalPassengerCapacity`.
       - `INCOMPATIBLE_SERVICE_CLASS`: vehicle service class does not match requested service class.
       - `INCOMPATIBLE_CITY`: vehicle registered city does not match operational city.
       - `VEHICLE_NOT_ROADWORTHY`: vehicle insurance, fitness, or commercial permit is expired.
  6. **Driver Duty Availability Integration**:
     - In `ComplianceService.calculateEligibility`, assigned vehicle records are evaluated for valid registration, category capacity limits, and city service class compatibility.
     - Any violation marks `isEligibleForAssignment = false`, preventing the driver from toggling duty to `ONLINE` with HTTP 422 Unprocessable Entity.


## 2026-11-02 — ADR-0030: Scheduled Compliance Expiry Scans, Advance Warning Tiers, Local Boundary Suspension, and Audit-Preserving Re-Verification

- **Status**: Accepted
- **Context**:
  Commercial EV drivers (Captains) and vehicles in Andhra Pradesh operate under time-bound statutory credentials, including Regional Transport Authority (RTA) transport driving licenses, commercial third-party insurance, fitness certificates, and Andhra Pradesh Green Plate commercial carriage permits.
  Operating with expired statutory credentials violates AP Motor Vehicle rules, invalidates commercial insurance coverage, and creates severe public liability and safety risks.
  Furthermore, per AGENTS.md:
  1. Rule 2: Category availability and propulsion must be enforced server-side by driver and vehicle status.
  2. Rule 4: Use database as single source of truth for bookings, entitlements, and audit history. Concurrency and transitions must be audit-tracked.
  3. Rule 5: Preserve historical records rather than deleting the evidence.
  Consequently, the platform requires scheduled expiry scans evaluating documents at the local Andhra Pradesh midnight boundary (`Asia/Kolkata` / UTC+05:30), 4-tier advance warning notifications prior to statutory expiry, automated duty suspension (`ONLINE` -> `OFFLINE`) upon document expiration, and an audit-preserving re-verification workflow that resolves active warnings while permanently preserving historical records.

- **Decisions**:
  1. **Local Midnight Boundary Evaluation (`calculateDaysRemainingToLocalBoundary`)**:
     - Evaluates statutory document expiration against Andhra Pradesh local midnight boundary (`Asia/Kolkata`).
     - Any document where `expiryDate.getTime() - now.getTime() <= 0` evaluates to `daysRemaining <= 0` and is authoritatively treated as expired at that boundary.
  2. **4-Tier Advance Warning Taxonomy (`determineWarningTier`)**:
     - `WARNING_30D`: 16 to 30 days remaining prior to statutory expiry.
     - `WARNING_15D`: 8 to 15 days remaining prior to statutory expiry.
     - `WARNING_7D`: 2 to 7 days remaining prior to statutory expiry.
     - `WARNING_1D`: 1 day (<= 24 hours) remaining prior to statutory expiry.
     - `EXPIRED`: `<= 0` days remaining; account suspended from duty.
     - Idempotent: Warnings avoid duplicate spamming if an active unresolved warning for the same tier and statutory target is already recorded.
  3. **Automated Suspension & Safety Auto-Offline Guard (`runScheduledExpiryScan`)**:
     - Background scheduled scan method and endpoint `POST /v1/captains/scans/run-expiry-check` (restricted to operators and compliance officers).
     - When a verified captain's transport driving license reaches local expiry boundary:
       - Automatically transitions `DriverProfile.verificationStatus` to `DriverComplianceStatus.EXPIRED`.
       - If captain was `DutyStatus.ONLINE`, safely and immediately forces duty status to `DutyStatus.OFFLINE` with updated timestamp.
       - Dispatches and attempts to toggle duty to `ONLINE` are strictly blocked server-side with HTTP 422 Unprocessable Entity.
       - Emits `CAPTAIN_AUTO_SUSPENDED_FOR_EXPIRY` audit event with previous and new states.
     - When an assigned vehicle's insurance, fitness, or green-plate permit expires:
       - Vehicle is marked non-roadworthy.
       - If captain was `DutyStatus.ONLINE`, safely forces captain duty to `DutyStatus.OFFLINE`.
       - Emits `CAPTAIN_AUTO_SUSPENDED_FOR_VEHICLE_EXPIRY` audit event.
  4. **Preservation of Historical Records (Rule 4 & Scope)**:
     - Historical records are NEVER deleted.
     - Created dedicated table `compliance_warnings` (Migration 12) storing full warning history (`userId`, `driverProfileId`, `vehicleId`, `targetType`, `expiryDate`, `daysRemaining`, `warningTier`, `actionRequired`, `createdAt`).
     - Prior KYC documents in `documents` table remain permanently retained for compliance audit inspection.
  5. **Audit-Preserving Re-Verification Workflow (`reverifyCompliance`)**:
     - Exposed endpoints `POST /v1/captains/me/reverify` (for captains) and `POST /v1/captains/:userId/reverify` (for operators on behalf of captains).
     - Validates that `newExpiryDate` is in the future and that renewal document exists and is not malware-infected (`CLEAN`).
     - Updates `DriverProfile.licenseExpiryDate` (or vehicle credential expiry dates).
     - Restores `DriverProfile.verificationStatus` from `EXPIRED` back to `VERIFIED` and clears `suspensionReason`.
     - Marks outstanding active warnings for that target as resolved (`isResolved = true`, `resolvedAt = now`, `resolutionType = 'REVERIFIED'`), preserving historical evidence.
     - Records `CAPTAIN_COMPLIANCE_REVERIFIED` audit event.
     - Immediately restores assignment eligibility, enabling the captain to resume duty `ONLINE`.


## 2026-11-02 — ADR-0031: Fleet Organizations, Vehicle Membership, Reassignment Auditing, Shift Telemetry, and Cross-Fleet Tenant Restrictions

- **Status**: Accepted
- **Context**:
  Commercial EV fleets (fleet aggregators, EV corporate shuttle partners, and regional transit operators) manage multiple 100% BEV electric vehicles and rosters of certified commercial drivers in Andhra Pradesh.
  Per AGENTS.md:
  1. Rule 2: Propulsion must be ELECTRIC and category availability must be enforced server-side.
  2. Rule 4: Use database as single source of truth for bookings, seat allocation, entitlements, payment, and audit history.
  3. Rule 5: Strict privacy and tenant isolation: Do not expose other users' or organizations' trips, vehicles, locations, or financial data.
  4. Ticket EV-030 Scope: Add fleet organizations, vehicle membership, driver assignment, shift records, and scoped fleet-owner APIs. Prevent cross-fleet visibility and track assignment history.
  Acceptance / Demonstrate: Fleet owner can access only vehicles and earnings in their organization; reassignment is audited.

- **Decisions**:
  1. **Relational Schema & Migration 13 (`CreateFleetOrganizationsAndAssignments1700000000013`)**:
     - Created `fleet_organizations` table storing corporate profile, unique business registration number (GSTIN / CIN), operating city, contact details, unique payout account identifier, and status (`ACTIVE`, `SUSPENDED`, `INACTIVE`).
     - Added nullable foreign key `fleet_organization_id` to `vehicles` table referencing `fleet_organizations(id)` on delete set null.
     - Created `fleet_vehicle_assignments` table with audit columns (`assigned_at`, `unassigned_at`, `status`, `assignment_reason`, `notes`), linking organization, vehicle, driver, and assigner.
     - Created `fleet_shifts` table tracking shift lifecycle (`SCHEDULED`, `ACTIVE`, `COMPLETED`, `CANCELLED`), shift types (`MORNING`, `EVENING`, `NIGHT`, `CUSTOM`), start/end odometer readings, and battery SoC gauge telemetry (`start_soc_percent`, `end_soc_percent`).
  2. **Strict Cross-Fleet Tenant Isolation & Access Control (`resolveFleetOrganization`)**:
     - All fleet operations (`/v1/fleet/*`) resolve the caller's organization context.
     - If a non-operator / non-admin user attempts to query or manipulate vehicles, shifts, or earnings of another fleet organization, the request is immediately rejected with HTTP 403 Forbidden.
     - Security audit event `CROSS_FLEET_ACCESS_DENIED` is logged into `audit_events` with actor ID, target organization ID, and IP address.
     - Platform Operators (`OPERATOR`, `ADMIN`) retain authorized elevated supervision across organizations without violating tenant boundary enforcement.
  3. **100% BEV Vehicle Membership Validation (`addVehicleToFleet`)**:
     - Validates that vehicle propulsion is strictly 100% Battery Electric (`BATTERY_ELECTRIC`). Hybrid and ICE vehicles are rejected.
     - Prevents vehicle double-membership: a vehicle already attached to another fleet cannot be claimed without formal release (HTTP 409 Conflict).
     - Logs `FLEET_VEHICLE_MEMBERSHIP_ATTACHED` audit event.
  4. **Driver Assignment, Reassignment & Audit Trail (`assignDriverToVehicle`)**:
     - Requires driver to be verified (`DriverComplianceStatus.VERIFIED`). Unverified or suspended drivers are rejected with HTTP 422 Unprocessable Entity.
     - When reassigning a vehicle to a new driver:
       - The active assignment row is marked `COMPLETED` and stamped with `unassignedAt = now`.
       - A new assignment row is inserted with `status = ACTIVE`.
       - Historical assignment rows are NEVER overwritten or deleted, ensuring full regulatory and insurance audit traceability.
       - The driver's active vehicle profile is updated.
       - Emits `FLEET_VEHICLE_REASSIGNED` audit event into `audit_events`.
  5. **Operational Shift Lifecycle & Battery SoC Thresholds (`startShift`, `endShift`)**:
     - Validates that vehicle battery state of charge meets the operational safety floor of >= 15% SoC.
     - Starts shift with `ACTIVE` status and initial odometer/SoC readings.
     - On handover/completion, records final odometer, return SoC, completed trips, and revenue, transitioning shift status to `COMPLETED`.
  6. **Scoped Financial Ledger & Earnings Segregation (`getFleetEarnings`)**:
     - Financial ledgers are queried strictly using the organization's unique `payoutAccountId`.
     - Cross-tenant earnings requests return HTTP 403 Forbidden.
     - Calculates gross earnings, 15% platform commission, net payout, and chronological ledger transaction items.


## 2026-11-02 — ADR-0032: Service Cities, Polygonal PostGIS Geofence Zones, Permit Expiry Boundaries, and Backend-Authoritative Category Switches

- **Status**: Accepted
- **Context**:
  Municipal mobility services across Andhra Pradesh (e.g. Visakhapatnam, Vijayawada) operate within legally gazetted municipal territories and specific polygonal operational zones (e.g., beach corridors, IT SEZs, industrial areas).
  Per AGENTS.md:
  1. Rule 2: Propulsion must be ELECTRIC and category availability must be enforced server-side by city, zone, service permission, driver and vehicle status.
  2. Rule 3: Never invent operational permit approvals, tariffs, contracts or live keys. Keep uncertain service types disabled by default.
  3. Rule 4: Use database as single source of truth for bookings, seat allocation, entitlements, payment, and audit history.
  4. EV-031 Scope: Model city, polygonal service zones, operational status, evidence reference, permit expiry and individual service-category switches. Default all real categories disabled.
  Acceptance / Demonstrate: Requests outside approved zones or with disabled/expired category flags fail even when a client forges availability.

- **Decisions**:
  1. **Spatial & Relational Schema (`CreateServiceCitiesAndExpandServiceZones1700000000014`)**:
     - Created `service_cities` table storing municipal territory metadata, unique city code (e.g. `visakhapatnam`), state (`Andhra Pradesh`), operational status (`ACTIVE`, `PILOT`, `INACTIVE`, `SUSPENDED`, `DISABLED`), statutory evidence reference, permit expiry date, centroid coordinates, and category switch flags.
     - Expanded existing `zones` table with unique code, operational status check constraint, statutory evidence reference, permit expiry date (`permit_expires_at`), centroid coordinates, and individual `category_switches` JSONB object.
  2. **Default-Disabled Category Switches (`DEFAULT_DISABLED_CATEGORY_SWITCHES`)**:
     - In `@ecoride/contracts`, defined `DEFAULT_DISABLED_CATEGORY_SWITCHES` where all real commercial mobility categories (`CITY_COMMUTE_2W`, `AUTO_COMMUTE_3W`, `CAB_PRIVATE_4W`, `VAN_COMMUTE_4W`, `private_ev`, `scheduled_sharing`, etc.) are explicitly initialized to `false`.
     - Whenever a new city or polygonal zone is registered without explicit category overrides, the database defaults every real category to disabled (`false`).
  3. **Server-Side Authoritative Point-in-Polygon & Category Verification (`ZonesService.verifyLocation`)**:
     - Validates GPS coordinates against active polygonal boundaries using PostGIS `ST_Contains(z.boundary, ST_SetSRID(ST_MakePoint(longitude, latitude), 4326))` with in-memory ray-casting algorithm fallback for unit test environments.
     - Operational status enforcement: requests inside zones with status `SUSPENDED`, `DISABLED`, or `INACTIVE` are denied.
     - Statutory permit boundary enforcement: requests inside zones where `permit_expires_at <= now()` are denied with explicit expiry reason.
     - Category switch enforcement: queries the zone's database record to verify `category_switches[category] === true`.
     - Client forgery resistance: even if a client sends `{ clientForgedAvailability: true }`, the backend enforces the database source of truth and rejects unauthorized requests.
  4. **Audited Category Switch Toggling (`toggleCategorySwitch`)**:
     - Restricted to authorized Platform Operators via `JwtAuthGuard` and `CurrentActor`.
     - Requires an audited statutory evidence reference (`evidenceReference`) citing government permits or regulatory approvals before a category can be toggled.
     - Persists an immutable audit log entry into `audit_events` with `action = 'ZONE_CATEGORY_SWITCH_TOGGLED'`, recording actor ID, previous switch state, and updated switch state.
  5. **Authoritative Quotes Integration (`POST /v1/quotes/authoritative`)**:
     - Invokes `ZonesService.verifyLocation` server-side before computing spherical distance and integer paise fare.
     - Rejects out-of-zone or disabled-category requests with HTTP 400 Bad Request and error code `ApiErrorCode.ZONE_RESTRICTED`.


## 2026-11-02 — ADR-0033: Maps, Geocoding & Route Provider Abstraction with Fault Injection, Bounded Retries, and Local Geometric Fallback

- **Status**: Accepted
- **Context**:
  Rider and Captain mobile apps and operations web require address autocompletion suggestions, reverse geocoding, route distance, ETA, and coordinate validation across Andhra Pradesh.
  Per AGENTS.md:
  1. Rule 3: Zero chargeable live keys, external contracts, or live third-party gateway dependencies in tests and local development.
  2. Ticket EV-032 Scope: Build maps interfaces for address suggestions, reverse geocoding, route distance, ETA and coordinate validation, plus mocked local provider and retry/cache limits.
  3. Acceptance / Demonstrate: Tests simulate timeouts, invalid coordinates and provider downtime without trapping the user in loading state.

- **Decisions**:
  1. **Provider Abstraction (`IMapsProvider`) & Contracts (`@ecoride/contracts/maps`)**:
     - Defined shared contracts for `GeoPoint`, `CoordinateValidationResult`, `AddressSuggestion`, `ReverseGeocodeResponse`, `RouteCalculationResponse`, and `ProviderSimulationMode`.
     - Expanded `IMapsProvider` with `suggestAddresses`, `reverseGeocodeDetails`, `validateCoordinates`, and simulation controls while preserving backward compatibility for existing distance matrix and routing methods.
  2. **Local Andhra Pradesh Mock Engine (`MockMapsProvider`)**:
     - Embedded curated landmark dataset spanning Visakhapatnam (RK Beach, MVP Colony, RTC Complex, Rushikonda IT SEZ, Gajuwaka), Vijayawada (Benz Circle, PNBS Bus Station, Kanaka Durga Temple), Guntur, Tirupati, and Amaravati.
     - Supports runtime fault injection modes: `NORMAL`, `TIMEOUT`, `DOWNTIME` (500 error), `DEGRADED` (latency), and `RATE_LIMITED` (429).
  3. **Resilience, Timeout Protection & Zero Loading Trap (`MapsService.executeWithResilience`)**:
     - Enforces strict 2500ms timeout limit on provider calls using `Promise.race`.
     - Applies bounded exponential retry backoff (maximum 2 retries on transient upstream failures).
     - When timeouts or provider downtime occur, automatically activates deterministic offline geometric fallback:
       - Reverse geocoding resolves to nearest known AP landmark proximity or formatted AP municipal coordinates (`isFallback: true`).
       - Routing computes road winding Haversine distance (1.25x factor), realistic urban transit duration at 28 km/h, and EV battery consumption (`isFallback: true`).
     - Guarantees requests complete within bounded time and never trap the user or mobile client in an indefinite loading state.
  4. **Strict Coordinate Validation & Territorial Bounds (`validateCoordinates`)**:
     - Rejects non-numeric, NaN, Infinite, and out-of-world coordinates (latitude outside [-90, 90], longitude outside [-180, 180]) with immediate HTTP 400 Bad Request.
     - Validates geographic inclusion within Andhra Pradesh bounding envelope (`[12.5, 19.9]°N`, `[76.5, 84.8]°E`).
  5. **Bounded LRU/FIFO Cache & Performance Protection**:
     - Implements in-memory cache with strict capacity limit of 500 entries and 10-minute TTL.
     - Evicts oldest entries on overflow (FIFO/LRU) to prevent unbounded memory growth.
     - Tracks hit/miss telemetry accessible via `GET /v1/maps/status`.
