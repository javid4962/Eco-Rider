# Requirements-to-Tests Traceability Matrix (EV-006)

This document establishes the authoritative test matrix for the EcoRide EV-only mobility platform in Andhra Pradesh.
It maps each platform requirement to specific test categories: **API**, **Mobile**, **Admin**, **Concurrency**, **Security**, and **Field Tests**.

> [!IMPORTANT]
> **Release Blocker Governance**: All **Compliance** and **Financial** tests are strictly designated as **Release Blockers**. A build cannot be promoted to pilot or production without signed human acceptance from the recorded owner.
> Every **P0 flow** has an automated measurable verification threshold and a designated human acceptance owner.

---

## 1. Traceability Matrix

| Req ID | Requirement Title | Priority | Type | Release Blocker? | Measurable Verification Threshold | Test Categories | Test Implementation File | Human Acceptance Owner |
|---|---|---|---|---|---|---|---|---|
| **REQ-EV-01** | 100% Battery Electric Propulsion Enforcement | **P0** | Compliance | **YES** (Blocker) | Server validation rejects non-electric fuel types with HTTP 422. DB constraints enforce electric propulsion. Zero ICE/hybrid entries permitted. | API, Mobile, Admin, Security | `apps/api/test/vehicles.spec.ts` | **S. K. Verma**<br>*Head of Regulatory & Transport Compliance* |
| **REQ-EV-02** | Andhra Pradesh Regional Geofencing & Pilot Zone Bounds | **P0** | Compliance | **YES** (Blocker) | `ST_Contains` spatial query returns false for coordinates outside authorized boundary polygon. API returns HTTP 400 `ZONE_RESTRICTED` with zero dispatch broadcast. | API, Mobile, Admin, Field | `apps/api/test/release-boundaries.service.spec.ts` | **Ananya Rao**<br>*AP Operations & City Expansion Director* |
| **REQ-EV-03** | Concurrency-Safe Dispatch Acceptance & Mutex Lock | **P0** | Core Dispatch | **YES** (Blocker) | Redis Redlock / DB row lock ensures that among 5 simultaneous captain accept calls for 1 ride, exactly 1 receives HTTP 200 and 4 receive HTTP 409 Conflict. | API, Concurrency | `apps/api/test/dispatch-concurrency.spec.ts` | **Vikramaditya P.**<br>*Principal Distributed Systems Engineer* |
| **REQ-EV-04** | Concurrency-Safe Shared Shuttle Seat Reservation Lock | **P0** | Core Dispatch | **YES** (Blocker) | PostgreSQL transactional lock (`SELECT FOR UPDATE`) prevents double-booking across 10 concurrent requests for the final seat. 1 succeeds, 9 fail with HTTP 409. | API, Concurrency | `apps/api/test/seat-lock-concurrency.spec.ts` | **Vikramaditya P.**<br>*Principal Distributed Systems Engineer* |
| **REQ-EV-05** | Battery Range Safety Buffer Feasibility Guard | **P0** | Safety | **YES** (Blocker) | Dispatch filter evaluates vehicle battery kWh and remaining range. Captains with < 20% SoC or range < (distance * 1.2) are excluded with 100% accuracy. | API, Mobile, Field | `apps/api/test/battery-feasibility.spec.ts` | **Dr. K. S. Murthy**<br>*EV Battery Systems & Fleet Safety Lead* |
| **REQ-EV-06** | Cryptographic 4-Digit Start OTP & Anti-Spoofing | **P0** | Safety | **YES** (Blocker) | Meter start endpoint rejects calls without valid OTP. 3 failed attempts transition ride to `OTP_FAILED` and trigger dispatch audit alert. | API, Mobile, Security | `apps/api/test/journeys.service.spec.ts` | **Rajesh G.**<br>*Chief Information Security Officer (CISO)* |
| **REQ-EV-07** | Double-Entry Immutable Financial Ledger & Idempotency | **P0** | Financial | **YES** (Blocker) | Sum of debits equals sum of credits for every transaction. Duplicate webhook payloads with identical idempotency key produce zero duplicate ledger records. | API, Concurrency, Security | `apps/api/test/ledger-idempotency.spec.ts` | **Priya M.**<br>*VP Finance & Treasury Operations* |
| **REQ-EV-08** | Automated SLA Delay Compensation & Refund Idempotency | **P0** | Financial | **YES** (Blocker) | Telemetry audit automatically detects > 10 minute tardiness and disburses compensation credit within 60 seconds without manual intervention. | API, Financial, Admin | `apps/api/test/sla-compensation.spec.ts` | **Priya M.**<br>*VP Finance & Treasury Operations* |
| **REQ-EV-09** | One-Touch Emergency SOS & AP Police 112 Dispatch Bridge | **P0** | Safety | **YES** (Blocker) | End-to-end alert latency < 1000ms. Dispatch packet includes GPS coordinate, speed, vehicle plate, driver photo, and passenger contact for AP Police 112. | API, Mobile, Admin, Field | `apps/api/test/journeys.service.spec.ts` | **D. Srinivas**<br>*Director of 24/7 Safety & Incident Response* |
| **REQ-EV-10** | Passenger & Captain PII Protection and KYC Masking | **P0** | Safety | **YES** (Blocker) | Zero unmasked phone numbers in API responses or client logs. Direct S3 buckets blocked; access strictly gated by role-based authorization tokens. | API, Security, Admin | `apps/api/test/health.controller.spec.ts` | **Rajesh G.**<br>*Chief Information Security Officer (CISO)* |
| **REQ-EV-11** | Bilingual Telugu/English UI Parity & WCAG 2.1 Accessibility | **P1** | Experience | NO (Gate P1) | Automated test verifies 100% dictionary coverage in Telugu (`te`). Relative luminance contrast ratios exceed 4.5:1. All interactive touch targets >= 48dp. | Mobile, Admin | `apps/api/test/design-system.service.spec.ts` | **Meenakshi K.**<br>*Head of Product Design & Accessibility* |
| **REQ-EV-12** | High-Frequency Telemetry Ingestion & Dead-Zone Recovery | **P1** | Core Dispatch | NO (Gate P1) | Redis `GEOADD` latency < 5ms under 5000 updates/sec. Stale drivers (> 30s without heartbeat) automatically purged from geospatial radius search. | API, Field | `apps/api/test/telemetry-redis.spec.ts` | **Suresh Babu**<br>*Cloud Infrastructure & SRE Lead* |

---

## 2. Test Category Definitions & Harnesses

### 2.1 API Tests
- **Scope**: NestJS controller, service, and validation pipe test suites.
- **Framework**: Jest with TypeScript strict mode.
- **Measurable Gate**: 100% of routes return typed DTOs and reject invalid inputs with HTTP 400/422.

### 2.2 Mobile Widget & UI Tests
- **Scope**: Flutter Rider and Captain apps.
- **Harness**: Flutter driver / integration test runner.
- **Measurable Gate**: Golden screenshot comparisons, touch targets $\ge 48\text{dp}$, and bilingual text verification.

### 2.3 Admin Portal Tests
- **Scope**: Next.js 15 operations portal.
- **Harness**: Playwright E2E test suite.
- **Measurable Gate**: Operations controller can audit pending KYC queues, view live EV cluster maps, and authorize manual dispatch overrides.

### 2.4 Concurrency Tests (Real Database & Redis Mutexes)
- **Scope**: High-contention race conditions on dispatch offers and shared shuttle seats.
- **Harness**: Concurrent asynchronous Promise batches executing against PostgreSQL transaction locks (`SELECT FOR UPDATE`) and Redis Redlock mutexes.
- **Measurable Gate**: 10 simultaneous booking requests for a single seat produce strictly 1 success (200) and 9 conflict rejections (409). Zero over-booking.

### 2.5 Security & PII Tests
- **Scope**: Authentication, RBAC, PII masking, cryptographic OTPs, and S3 signed URLs.
- **Harness**: Supertest security audit suites.
- **Measurable Gate**: Captain tokens cannot access Admin endpoints (`403 Forbidden`). Unmasked customer phone numbers never appear in payloads.

### 2.6 Field Tests (Real-World Visakhapatnam EV Trials)
- **Scope**: Real EV road tests along the Visakhapatnam urban corridor (Jagadamba Junction, Beach Road, RTC Complex, Dwaraka Nagar).
- **Harness**: GPS telemetry drive recorders and dead-zone recovery simulators.
- **Measurable Gate**: Telemetry reconnects cleanly within 5 seconds after exiting tunnel or cellular dead zones. Battery range safety buffer prevents vehicle stranding.

---

## 3. Human Acceptance Ownership Directory

| Name | Role | Department | Governed Requirements |
|---|---|---|---|
| **S. K. Verma** | Head of Regulatory & Transport Compliance | Legal & Regulatory | REQ-EV-01 (100% BEV Compliance) |
| **Ananya Rao** | AP Operations & City Expansion Director | Operations | REQ-EV-02 (AP Regional Geofencing) |
| **Vikramaditya P.** | Principal Distributed Systems Engineer | Platform Engineering | REQ-EV-03 (Dispatch Mutex), REQ-EV-04 (Seat Concurrency) |
| **Dr. K. S. Murthy** | EV Battery Systems & Fleet Safety Lead | Hardware & Telematics | REQ-EV-05 (Battery Range Safety Buffer) |
| **Rajesh G.** | Chief Information Security Officer (CISO) | Security & InfoSec | REQ-EV-06 (Cryptographic OTP), REQ-EV-10 (PII Masking) |
| **Priya M.** | VP Finance & Treasury Operations | Finance | REQ-EV-07 (Immutable Ledger), REQ-EV-08 (SLA Compensation) |
| **D. Srinivas** | Director of 24/7 Safety & Incident Response | Safety & Trust | REQ-EV-09 (Emergency SOS & Police 112) |
| **Meenakshi K.** | Head of Product Design & Accessibility | Product & UX | REQ-EV-11 (Bilingual Telugu/English & WCAG) |
| **Suresh Babu** | Cloud Infrastructure & SRE Lead | Infrastructure | REQ-EV-12 (High-Frequency Telemetry Ingestion) |

