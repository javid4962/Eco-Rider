# Product Requirements Document (PRD) - EcoRide

## 1. Executive Summary
EcoRide is an original, EV-only mobility platform operating in Andhra Pradesh, India.
The platform provides sustainable, zero-emission urban transportation across two-wheelers (e-Bikes), three-wheelers (e-Autos), and four-wheelers (e-Cabs).

## 2. Hard Governance Rules
1. **Propulsion Constraint**: Only 100% Battery Electric Vehicles (BEVs) are permitted. ICE/Hybrid vehicles are rejected server-side.
2. **Geographic Scope**: Initial authorized zones are designated urban districts in Andhra Pradesh (e.g., Visakhapatnam, Vijayawada, Guntur, Tirupati). Outside authorized boundaries, booking requests are rejected.
3. **Regulatory Compliance**: AP State Transport Department permit requirements and fare ceilings are enforced server-side.
4. **Data Integrity & Concurrency**: The PostgreSQL database is the single source of truth for trip states, bookings, seat entitlements, and financial transactions. Dispatch acceptance uses database locks (`SELECT FOR UPDATE`) and Redis distributed locks (Redlock) to prevent race conditions.
5. **Security & Privacy**: Zero hardcoded credentials or OTP bypasses. PII and KYC data are strictly protected and masked.

## 3. Platform Architecture
- **API Backend**: NestJS modular service with TypeScript strict mode.
- **Database**: PostgreSQL 16 with PostGIS extension for spatial geofencing and vehicle distance lookups.
- **Cache & Telemetry**: Redis 7 for high-frequency driver heartbeat ingestion, geospatial radius queries, and distributed mutexes.
- **Captain App**: Flutter driver partner client.
- **Rider App**: Flutter commuter client.
- **Ops Portal**: Next.js 15 administrative dashboard for zone management, KYC review, and fleet telemetry.

## 4. Service Categories & Release Boundaries (EV-003)

### 4.1 The Five Service Categories
1. **Private EV On-Demand (`private_ev`)**: Commercial point-to-point electric taxi, auto, and bike rides on demand.
2. **Scheduled EV Sharing (`scheduled_sharing`)**: Corridor-based scheduled pooled commuter transit with fixed virtual EV pickup stops and seat reservations.
3. **Commuter Passes (`commuter_pass`)**: Prepaid daily, weekly, and monthly subscription packages with discounted recurring EV rides.
4. **On-Time Arrival Guarantees (`on_time_guarantee`)**: SLA-backed arrival commitments with automated financial delay credits if tardiness exceeds 10 minutes.
5. **Fleet & Charging Optimization (`fleet_optimization`)**: Dynamic battery-swap routing, charging depot scheduling, and grid time-of-day (ToD) tariff optimization.

### 4.2 Scope Matrix: Pilot vs. Future Phases

| Release Phase | Phase Type | Service Category | Geographic Scope | Launch Gates Required | Initial State |
|---|---|---|---|---|---|
| **Release A: Private EV** | **PILOT** | `private_ev` | Visakhapatnam Urban District | • AP RTO EV Pilot permit approval<br>• Captain KYC & Green-Plate registration<br>• Battery SoC buffer feasibility (>20%) | **ENABLED** in Visakhapatnam; **DISABLED** in all other cities |
| **Release B: Scheduled Sharing** | **FUTURE** | `scheduled_sharing` | Visakhapatnam-Anakapalle & Vijayawada-Guntur Corridors | • Min 50 commercial EVs in corridor<br>• DB concurrency seat lock test passed<br>• Municipal virtual stop approvals | **DISABLED** in all cities |
| **Release C: Passes & Guarantees** | **FUTURE** | `commuter_pass`, `on_time_guarantee` | Visakhapatnam, Vijayawada, Tirupati | • PPI-compliant advance escrow trust<br>• 60-day historical punctuality telemetry >= 95%<br>• Idempotent refund/credit ledger | **DISABLED** in all cities |
| **Release D: Optional Optimization** | **FUTURE** | `fleet_optimization` | Statewide AP Fleet Depots | • CPO live OCPP 2.0.1 integration<br>• Battery swap station telemetry feed<br>• ToD dynamic charging price engine | **DISABLED** in all cities |

### 4.3 Launch Gate Definitions
- **GATE-A-01 (AP Transport Permit)**: Formal state permit issued for commercial green-plate EV pilot. *(Status: Satisfied for Visakhapatnam)*
- **GATE-A-02 (Captain KYC & Green Plate)**: Driver badge and 100% BEV verified. *(Status: Satisfied for Visakhapatnam)*
- **GATE-A-03 (Battery Safety Buffer)**: Rejection of dispatch if battery range is insufficient. *(Status: Satisfied)*
- **GATE-B-01 (Corridor Fleet Density)**: Verification of fleet availability before opening scheduled pools. *(Status: Pending)*
- **GATE-B-02 (Seat Concurrency Lock)**: Zero double-booking under race conditions with database row-level locking. *(Status: Pending)*
- **GATE-B-03 (Virtual Stop Approvals)**: City planning agency sign-off on pickup bays. *(Status: Pending)*
- **GATE-C-01 (Escrow Trust Account)**: Protection of prepaid rider pass balances. *(Status: Pending)*
- **GATE-C-02 (Route Reliability Telemetry)**: 60-day >= 95% on-time baseline. *(Status: Pending)*
- **GATE-C-03 (SLA Refund Ledger)**: Automatic compensation calculation and ledger postings. *(Status: Pending)*
- **GATE-D-01 (CPO Protocol Integration)**: Open Charge Point Protocol connectivity with local charging providers. *(Status: Pending)*
- **GATE-D-02 (Battery Swapping Telemetry)**: Live inventory tracking for fast battery exchange. *(Status: Pending)*
- **GATE-D-03 (ToD Tariff Engine)**: Off-peak charging schedule optimization. *(Status: Pending)*

### 4.4 Initial Settings Matrix by City & Service
| City | Private EV (Rel A) | Scheduled Sharing (Rel B) | Commuter Pass (Rel C) | On-Time Guarantee (Rel C) | Fleet Optimization (Rel D) |
|---|---|---|---|---|---|
| **Visakhapatnam** | **ENABLED (Pilot)** | DISABLED (Gate B) | DISABLED (Gate C) | DISABLED (Gate C) | DISABLED (Gate D) |
| **Vijayawada** | DISABLED (Gate A) | DISABLED (Gate B) | DISABLED (Gate C) | DISABLED (Gate C) | DISABLED (Gate D) |
| **Guntur** | DISABLED (Gate A) | DISABLED (Gate B) | DISABLED (Gate C) | DISABLED (Gate C) | DISABLED (Gate D) |
| **Tirupati** | DISABLED (Gate A) | DISABLED (Gate B) | DISABLED (Gate C) | DISABLED (Gate C) | DISABLED (Gate D) |
