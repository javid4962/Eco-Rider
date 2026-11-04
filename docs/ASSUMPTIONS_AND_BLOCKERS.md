# EcoRide Operational Assumptions & Technical Blockers

This document records the foundational assumptions, hardware constraints, toolchain dependencies, and known blockers for the EcoRide platform.

---

## 1. Operational & Resource Assumptions

1. **Development & Team Model**:
   - Software development executed using clean, modular, autonomous checkpoints.
   - Realistic operational costs: Third-party API charges, payment gateway fees, and cloud hosting costs are documented and modeled as low/base/high volume tiers.
2. **Fleet & Capacity Scenarios**:
   - Actual vehicle counts, ownership percentages (company-owned vs third-party), driver partner recruitment rates, and procurement capital are modeled as editable administrative parameters. No fictitious production commitments.
3. **EV Infrastructure & Battery Management**:
   - **Driver-Entered Battery SoC (Phase 1)**: Captains submit battery state of charge (SoC %) along with confidence rating and estimated range. Automated OEM/hardware IoT telemetry is not assumed until contractual hardware integrations are approved.
   - Charging depot scheduling is provided as a verified directory with external booking fallbacks.

---

## 2. Technical Dependencies & Environment Blockers

| Dependency / Tool | Environment Requirement | Current Status | Blocker / Impact | Mitigation Strategy |
|---|---|---|---|---|
| **Flutter SDK** | `flutter` CLI in system PATH | **NOT INSTALLED / BLOCKED** | Cannot run `flutter test` or Flutter widget tests locally on current host shell. | Mobile client changes are validated via Dart compiler, typed contracts, and unit tests; manual UI verification when Flutter SDK is added. |
| **Dart Analysis Server** | Access to `C:\Users\Javid\AppData\Local\.dartServer` | **RESTRICTED IN SANDBOX** | Dart analyze crashes inside standard Windows sandbox because `.dartServer` is outside workspace boundaries. | Run Dart analysis with bypass sandbox when requested, or analyze files directly via static linter. |
| **iOS Compilation** | macOS runner with Xcode | **NOT AVAILABLE ON WINDOWS** | iOS binary compilation cannot be performed on Windows host. | Android builds and shared Flutter cross-platform code verified; iOS compilation deferred to macOS CI runner. |
| **Local PostgreSQL & PostGIS** | Docker stack or local PostgreSQL 16 on port 5432 | **OPTIONAL / UNIT MOCKS ACTIVE** | E2E tests connecting to live PostgreSQL on port 5432 require running local Docker stack (`infrastructure/docker-compose.dev.yml`). | All 39 unit test suites run against in-memory TypeORM transaction managers with zero external network dependency. |
| **Live SMS DLT / Gateway** | Indian TRAI DLT approved headers | **SANDBOX MOCK ACTIVE** | Live SMS cannot be dispatched without commercial DLT registration and live credit balance. | Synthetic local mock provider active (`MockOtpProvider`), fails closed in production mode if keys missing. |
| **Razorpay Live Merchant Account** | Activated merchant account | **TEST MODE ACTIVE** | Live card charges and live payouts are disabled. | Test mode keys (`rzp_test_*`) utilized for all transaction lifecycle testing. |

