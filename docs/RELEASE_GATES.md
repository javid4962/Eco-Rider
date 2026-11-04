# EcoRide Statutory, Operational & Technical Release Gates

This document defines the formal verification gates required before any service category, operational city, or vendor provider integration is promoted from sandbox/disabled to live operation in Andhra Pradesh.

---

## 1. Statutory & Regulatory Gates (Andhra Pradesh State Transport Authority - AP-STA)

| Gate ID | Name | Criteria | Verification Evidence | Status |
|---|---|---|---|---|
| **GATE-AP-01** | **Commercial EV Stage/Contract Carriage Permit** | Valid regional commercial electric passenger carriage permit for Vijayawada, Guntur, and Amaravathi capital corridor. | AP-STA regional notification reference & gazette order. | **PENDING OFFICIAL PERMIT** (Default local sandbox enabled) |
| **GATE-AP-02** | **Captain Commercial Driving Badge & Police Verification** | Commercial driving license, transport endorsement, and background/police clearance certificate. | Uploaded and approved via `apps/ops-web` KYC review console. | **ACTIVE FOR ONBOARDING** |
| **GATE-AP-03** | **Green-Plate 100% BEV Compliance** | Vehicle registration certified as Battery Electric Vehicle (`BATTERY_ELECTRIC`) with commercial green plate. | Validated in `VehiclesService` and enforced via DB check constraint `chk_vehicles_electric_only`. | **ENFORCED SERVER-SIDE** |
| **GATE-AP-04** | **Two-Wheeler Commercial EV Taxi Permit** | Explicit statutory permission for electric two-wheeler commercial taxi operation in AP. | Department of Transport AP notification. | **DISABLED BY DEFAULT** (Permission-gated) |
| **GATE-AP-05** | **Cargo Transport Goods Carriage Permit** | Commercial goods carrier permit for light electric cargo vehicles (3W & 4W). | RTO commercial goods vehicle endorsement. | **ENFORCED FOR CARGO VEHICLES** |

---

## 2. Operational & Fleet Safety Gates

| Gate ID | Name | Criteria | Verification Evidence | Status |
|---|---|---|---|---|
| **GATE-OPS-01** | **Driver Battery SoC Safety Buffer** | Driver-entered SoC must exceed 20% plus required trip distance buffer to be eligible for dispatch. | Enforced server-side in `BatteryDispatchEligibilityService`. | **ACTIVE** |
| **GATE-OPS-02** | **Driver Location Freshness** | GPS telemetry must be fresher than 30 seconds with accuracy <= 50 meters. | Enforced in `CaptainAvailabilityService`. | **ACTIVE** |
| **GATE-OPS-03** | **Dual-Reservation & First-Winner Lock** | Atomic dual-reservation of ride and captain in a single ACID transaction with transactional outbox. | Concurrency tests in `atomic-first-winner-assignment.spec.ts`. | **ACTIVE & VERIFIED** |
| **GATE-OPS-04** | **Pickup Arrival & Rider OTP Start** | Captain must mark arrived at pickup; trip requires 4-digit rider OTP with 3-attempt lockout. | Verified in `pickup-arrival-otp-start.spec.ts`. | **ACTIVE & VERIFIED** |
| **GATE-OPS-05** | **24/7 Safety Desk & SOS Escalation** | Audio-visual emergency alert and AP Police 112 dispatch capability. | Safety officer incident console in `apps/ops-web`. | **ACTIVE IMPLEMENTATION** |

---

## 3. Provider & Infrastructure Gates

| Gate ID | Provider / System | Criteria for Live Activation | Fallback / Sandbox Mode | Status |
|---|---|---|---|---|
| **GATE-PRV-01** | **Razorpay Payments** | Approved merchant KYC, live key generation, webhook secret configuration, and INR test transaction pass. | Synthetic Razorpay test mode / Mock payments provider. | **SANDBOX ACTIVE** (Fail-closed if live keys missing) |
| **GATE-PRV-02** | **DLT SMS / WhatsApp** | AP DLT registration, approved Sender IDs, registered OTP templates, Meta WhatsApp Business verification. | Synthetic local SMS mock / MSG91 test sandbox. | **SANDBOX ACTIVE** |
| **GATE-PRV-03** | **Aadhaar / PAN KYC** | Consented DigiLocker / Surepass / Signzy provider contract with compliant audit trail. | Manual admin document approval console in ops portal. | **MANUAL ADMIN VERIFICATION ACTIVE** |
| **GATE-PRV-04** | **Maps / Geocoding** | Approved API billing tier for Google Maps or Mapbox with geocoding, distance matrix, and directions. | PostGIS spatial calculations + internal route engine + mock provider. | **POSTGIS INTERNAL ACTIVE** |
| **GATE-PRV-05** | **EV Charging Aggregator** | Contractual API integration with charging point operators (CPOs). | In-app charger station directory and external booking fallback. | **DIRECTORY FALLBACK ACTIVE** |

