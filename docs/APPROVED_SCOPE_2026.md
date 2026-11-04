# EcoRide Approved Product Scope & Launch Boundaries (2026)

This document formalizes the locked, owner-approved product decisions, statutory launch targets, service category permissions, and milestone governance for **EcoRide**, an original EV-only mobility platform in Andhra Pradesh, India.

---

## 1. Locked Business & Market Decisions

1. **Operating Geography (Active Launch Target)**:
   - **Primary Launch Hubs**: **Guntur, Vijayawada, and Amaravathi** (the Capital Urban Region of Andhra Pradesh).
   - **De-prioritized / Retired Pilot**: Visakhapatnam is superseded as the active pilot default. All APIs, geofences, seed data, and portal defaults are centered on the Guntur–Vijayawada–Amaravathi capital corridor.
   - **Future Expansion Cities**: Visakhapatnam, Tirupati, Kurnool, and other AP districts remain behind formal statutory launch gates.
2. **Business Model**:
   - Hybrid company-owned fleet plus third-party driver, vehicle, and fleet owner marketplace.
   - Scalable usage scenarios: Model as parameterized low/base/high volume tiers; no fabricated forecasts or unapproved financial commitments.
3. **100% Electric Propulsion (BEV)**:
   - Propulsion must strictly be `BATTERY_ELECTRIC`. Non-electric vehicles (ICE, Hybrid, CNG, Retrofitted non-certified) are rejected server-side with `PROPULSION_NON_ELECTRIC` (HTTP 422).
4. **Platform Interfaces**:
   - **Rider Flutter App**: Android + iOS for commuters.
   - **Captain Flutter App**: Android + iOS for EV driver partners.
   - **Operations & Management Web Portal (Next.js 14)**: Responsive web portal with strict role and tenant isolation supporting:
     1. Super Admin / City Operations Desk
     2. Fleet Management Portal (multi-vehicle owners)
     3. Third-Party EV Vehicle Owner Portal
     4. Corporate HR & Transport Admin Portal
   - **No Public Customer Booking Website**: Passenger bookings originate exclusively from mobile applications or authorized enterprise/corporate bulk bookings.

---

## 2. Service Categories & Vehicle Matrix

### 2.1 Approved Passenger & Cargo Services
1. **Passenger Rides**:
   - `CITY_COMMUTE_2W`: Electric two-wheeler taxi (permission-gated). Seating: `D+1`.
   - `AUTO_COMMUTE_3W`: Electric 3-wheeler auto rickshaw. Seating: `D+3`.
   - `CAB_PRIVATE_4W`: Electric hatchback, sedan, or compact SUV. Seating: `D+4`.
   - `PREMIUM_SUV_4W`: Premium passenger electric SUV. Seating: `D+4` to `D+6`.
   - `VAN_COMMUTE_4W`: Electric passenger van / shuttle. Seating: `D+7`.
   - Service Types: Instant on-demand, scheduled rides, hourly/daily rentals, outstation/intercity (e.g. Guntur–Vijayawada corridor), and corridor pooling.
2. **Corporate & Employee Transport**:
   - Corporate tenant accounts, employee rosters, shift pickup/drop manifests, multi-employee route planning, attendance tracking, and monthly consolidated GST postpaid invoicing.
3. **Cargo & Logistics Movement**:
   - Distinct cargo order lifecycle, weight/volume validation, vehicle matching (e-Cargo 3W, e-Cargo Van/Truck), helper bookings, multi-stop pickup/drop, photo/signature Proof of Delivery (POD), reverse logistics, and goods-value Cash-on-Delivery (COD) reconciliation.
4. **Commuter Passes & Subscriptions**:
   - Monthly recurring ride bundles, mandate-backed repeat trips, and route-specific discount passes.

### 2.2 Operational Settings by City & Region

| Operational City | Passenger Private EV | Corporate Transport | Cargo Logistics | Scheduled Sharing / Pooling | Commuter Passes | Status |
|---|---|---|---|---|---|---|
| **Vijayawada** (`vijayawada`) | **ENABLED (Launch)** | **ENABLED (Launch)** | **ENABLED (Launch)** | Staged (Gate B) | Staged (Gate C) | **ACTIVE LAUNCH** |
| **Guntur** (`guntur`) | **ENABLED (Launch)** | **ENABLED (Launch)** | **ENABLED (Launch)** | Staged (Gate B) | Staged (Gate C) | **ACTIVE LAUNCH** |
| **Amaravathi** (`amaravathi`) | **ENABLED (Launch)** | **ENABLED (Launch)** | **ENABLED (Launch)** | Staged (Gate B) | Staged (Gate C) | **ACTIVE LAUNCH** |
| **Visakhapatnam** (`visakhapatnam`) | DISABLED (Pending) | DISABLED (Pending) | DISABLED (Pending) | DISABLED (Gate B) | DISABLED (Gate C) | Secondary Phase |
| **Tirupati** (`tirupati`) | DISABLED (Pending) | DISABLED (Pending) | DISABLED (Pending) | DISABLED (Gate B) | DISABLED (Gate C) | Secondary Phase |

---

## 3. Technology Architecture & Providers

1. **Maps & Geolocation**:
   - Provider strategy: Mapbox vs Google Maps comparison based on Indian routing fidelity, Flutter SDK reliability, and usage tier costs. Geocoding, reverse geocoding, ETA calculation, and driver GPS freshness tracking.
2. **Payments & Billing**:
   - **Primary Gateway**: Razorpay (Test mode for development; UPI, net banking, debit/credit cards).
   - **Currency**: Non-negative integer paise (1 INR = 100 paise) across all transactions.
   - **Cash Settlement**: Supported for passenger fares with captain liability reconciliation. Distinct from cargo goods-value COD.
3. **Communications & Messaging**:
   - SMS/DLT & WhatsApp Business via Indian compliance adapters (MSG91 / WhatsApp Business API).
   - In-app text chat and push notifications.
   - Direct emergency support dialing (No internet VoIP, no automated IVR).
4. **EV Battery & Range Management**:
   - **Driver-Entered Battery SOC**: Captains input battery State of Charge (SoC %) along with timestamp and estimated remaining range. Confidence rating calculated server-side; automated OEM/IoT telemetry is not presumed for live operations.
   - Dispatch eligibility excludes drivers with low battery (< 20% + trip buffer).
5. **Security & Data Privacy**:
   - Indian data sovereignty, AES-256 / TLS 1.3 encryption, role-based access control (RBAC), multi-factor authentication (MFA) for administrative roles, and strict cross-tenant isolation.
   - Privacy masking: Passwords, OTPs, auth keys, and PII are redacted to `[REDACTED_OTP]` / `[REDACTED_PII]` in audit logs.
