# EcoRide Requirements Traceability Matrix (RTM)

This matrix maps every requirement from **EV-001 through EV-131** along with owner-approved additions to their exact implementation paths, test suites, and verified operational status.

---

## 1. Traceability Status Legend
- **VERIFIED**: Implementation exists, tested with positive and negative cases, passing in CI.
- **PARTIAL**: Implementation partially complete or requires scope alignment.
- **NOT IMPLEMENTED**: Scheduled in upcoming autonomous milestone.
- **BLOCKED**: Blocked by third-party external hardware/license or platform dependency.
- **NOT RUN**: Tests ready but toolchain missing on host environment (e.g. Flutter on Windows).

---

## 2. Requirements Traceability Table

| Task ID | Requirement Summary | Core Implementation Path | Test Suite File | Status | Notes / Milestone |
|---|---|---|---|---|---|
| **EV-001** | PostGIS & Spatial Extensions | `migrations/1700000000000-EnablePostgisExtension.ts` | `migration.spec.ts` | **VERIFIED** | M00 |
| **EV-002** | Initial Schema & Strict EV Constraints | `migrations/1700000000001-CreateInitialSchema.ts` | `migration.spec.ts` | **VERIFIED** | M00 |
| **EV-003** | Release Boundaries & City Service Gates | `release-boundaries.service.ts` | `release-boundaries.service.spec.ts` | **PARTIAL** | M01 (Realigning to Guntur/Vijayawada/Amaravathi) |
| **EV-004** | User Stories & Journey Flows | `docs/USER_STORIES.md` | Doc Review | **VERIFIED** | M00 |
| **EV-005** | Design System & AP Localization | `design-system.service.ts` | `design-system.service.spec.ts` | **VERIFIED** | M00 |
| **EV-006** | Test Matrix & Coverage Framework | `docs/TEST_MATRIX.md` | `test-matrix.service.spec.ts` | **VERIFIED** | M00 |
| **EV-007** | MSG91 DLT OTP Provider & Sanitization | `providers/msg91-otp.provider.ts` | `msg91-otp.provider.spec.ts` | **VERIFIED** | M00 |
| **EV-008** | Multi-Role Identity & RBAC Schema | `entities/user.entity.ts`, `auth.service.ts` | `auth.service.spec.ts` | **VERIFIED** | M00 |
| **EV-009** | Session Token Rotation & Replay Protection | `token.service.ts` | `token.service.spec.ts` | **VERIFIED** | M00 |
| **EV-010** | Saved Locations & Rider Preferences | `entities/saved-location.entity.ts` | `rider-profile.spec.ts` | **VERIFIED** | M00 |
| **EV-011** | Privacy, Consent & Data Deletion | `privacy/privacy.service.ts` | `privacy.spec.ts` | **VERIFIED** | M00 |
| **EV-012** | KYC Document Storage & Virus Scanning | `documents/documents.service.ts` | `documents.spec.ts` | **VERIFIED** | M00 |
| **EV-013** | Vehicles Table & 100% BEV Compliance | `vehicles/vehicles.service.ts` | `vehicles.spec.ts` | **VERIFIED** | M00 |
| **EV-014** | Captain Applications & Review History | `captain-applications.service.ts` | `captain-applications.spec.ts` | **VERIFIED** | M00 |
| **EV-015** | Driver Compliance & Duty Status | `compliance/compliance.service.ts` | `compliance.spec.ts` | **VERIFIED** | M00 |
| **EV-016** | Seating Capacity D+X Controls | `vehicles/vehicles.service.ts` | `vehicles.spec.ts` | **VERIFIED** | M00 |
| **EV-017** | Scheduled Compliance Expiry Scans | `compliance/compliance-scanner.service.ts` | `compliance.spec.ts` | **VERIFIED** | M00 |
| **EV-018** | Fleet Organizations & Captain Pairing | `fleet/fleet.service.ts` | `fleet.spec.ts` | **VERIFIED** | M00 |
| **EV-019** | Service Cities & Operational Zones | `zones/zones.service.ts` | `zones.spec.ts` | **PARTIAL** | M01 (Activating Guntur, Vijayawada, Amaravathi) |
| **EV-020** | Fare Rules Engine & Version Audit | `fare-rules/fare-rules.service.ts` | `fare-rules.service.spec.ts` | **VERIFIED** | M00 |
| **EV-021** | Quote Generation & Cryptographic Tokens | `quotes/quotes.service.ts` | `quote-safeguards.spec.ts` | **PARTIAL** | M01 (Activating Guntur, Vijayawada, Amaravathi) |
| **EV-038** | Ride State Machine & DAG Authorization | `bookings/bookings.service.ts` | `ride-state-machine.spec.ts` | **VERIFIED** | M00 |
| **EV-039** | Idempotent Ride Request & Cancellation | `bookings/bookings.service.ts` | `idempotent-rides-cancellation.spec.ts` | **VERIFIED** | M00 |
| **EV-040** | Captain Availability & GPS Freshness | `compliance/captain-availability.service.ts` | `captain-availability.spec.ts` | **VERIFIED** | M00 |
| **EV-041** | Battery-Aware Dispatch Eligibility | `compliance/battery-dispatch.service.ts` | `battery-dispatch-eligibility.spec.ts` | **VERIFIED** | M00 |
| **EV-042** | Nearby Eligible Captain Selection (PostGIS) | `compliance/nearby-eligible-captains.service.ts` | `nearby-eligible-captains.spec.ts` | **VERIFIED** | M00 |
| **EV-043** | Expiring Dispatch Offers & Queue | `dispatch/dispatch-offers.service.ts` | `expiring-dispatch-offers.spec.ts` | **VERIFIED** | M00 |
| **EV-044** | Atomic First-Winner Assignment & Outbox | `dispatch/dispatch-offers.service.ts` | `atomic-first-winner-assignment.spec.ts` | **VERIFIED** | M00 |
| **EV-045** | Pickup Arrival & Rider OTP Start Verification | `bookings/bookings.service.ts` | `pickup-arrival-otp-start.spec.ts` | **VERIFIED** | M00 |
| **EV-046 – 048** | In-Trip Rooms, GPS Telemetry & Completion | `modules/bookings/in-trip.service.ts` | To be implemented | **QUEUED** | M04 |
| **EV-049 – 054** | Razorpay Test Payments & Ledger | `modules/payments/` | To be implemented | **QUEUED** | M05 |
| **EV-055 – 056** | Driver & Fleet Owner Settlement | `modules/settlement/` | To be implemented | **QUEUED** | M06 |
| **EV-057 – 065** | Rider Flutter Journeys | `apps/rider_app/` | `flutter test` | **QUEUED** | M07 |
| **EV-066 – 073** | Captain Flutter Journeys | `apps/captain_app/` | `flutter test` | **QUEUED** | M08 |
| **EV-074 – 082** | Operations Web Portals (Admin/Fleet/Owner) | `apps/ops-web/` | Playwright / Jest | **QUEUED** | M09 |
| **EV-083 – 089** | Shared-Schedule Corridor System | `modules/shared-schedules/` | To be implemented | **QUEUED** | M10 |
| **EV-090 – 097** | Passenger Pooling & Seat Reservation | `modules/pooling/` | To be implemented | **QUEUED** | M11 |
| **EV-098 – 105** | Monthly Commuter Passes | `modules/commuter-passes/` | To be implemented | **QUEUED** | M12 |
| **EV-106 – 109** | Guaranteed Repeat Seats | `modules/repeat-seats/` | To be implemented | **QUEUED** | M13 |
| **EV-110 – 112** | Corporate & Employee Transport Portal | `modules/corporate/` | To be implemented | **QUEUED** | M14 |
| **NEW-CARGO** | Cargo Bookings, Vehicles & COD | `modules/cargo/` | To be implemented | **QUEUED** | M15 & M16 |
| **NEW-CHARGING** | EV Charging Aggregator & Directory | `modules/charging/` | To be implemented | **QUEUED** | M17 |
| **NEW-FLEET** | Driver-Entered Battery SoC & Fleet P&L | `modules/fleet/` | To be implemented | **QUEUED** | M18 |
| **NEW-PRICING** | Unified Admin-Versioned Pricing Engine | `modules/fare-rules/` | To be implemented | **QUEUED** | M19 |
| **EV-117 – 118** | DevSecOps, Privacy & 24/7 Safety Desk | `modules/safety/` | To be implemented | **QUEUED** | M20 |
| **NEW-COMM** | Messaging, WhatsApp & Loyalty Engine | `modules/communications/` | To be implemented | **QUEUED** | M21 |
| **NEW-ANALYTICS** | Server-Derived Business Analytics & Reports | `modules/analytics/` | To be implemented | **QUEUED** | M22 |
| **EV-113 – 118** | End-to-End QA & Concurrency Suite | `test/e2e/` | To be implemented | **QUEUED** | M23 |
| **EV-119 – 124** | Staging Architecture & Disaster Recovery | `infrastructure/` | To be implemented | **QUEUED** | M24 |
| **EV-125 – 126** | Mobile Release Readiness Checklists | `docs/` | To be implemented | **QUEUED** | M25 |
| **EV-127 – 131** | Optimization & Bounded Pooling Research | `modules/optimization/` | To be implemented | **QUEUED** | M26 |

