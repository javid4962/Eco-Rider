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
