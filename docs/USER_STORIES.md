# EcoRide User Stories & Journey Maps (EV-004)

This document establishes the user stories, role boundaries, and state-oriented journey flows for EcoRide, an original EV-only mobility platform in Andhra Pradesh.

---

## 1. Role Personas and User Stories

The platform supports 7 core operational roles:

### 1.1 Rider (Commuter)
- **Persona**: Daily office commuters and university students in Visakhapatnam traveling fixed corridors or on-demand city routes.
- **US-RID-01**: *On-Demand EV Ride Discovery & Range-Assured Booking*
  - **Narrative**: As a daily commuter in Visakhapatnam, I want to book an on-demand commercial EV (e-Bike, e-Auto, or e-Cab) with verified battery range, so that I have zero cancellation anxiety, transparent fare, and zero emissions.
  - **Acceptance Criteria**:
    - Destination search enforces pilot zone boundaries (Visakhapatnam).
    - Display estimated fare, trip distance, and remaining captain battery percentage.
    - Reject dispatch if assigned captain battery SoC is under 20% or insufficient for route.
    - Generate secure 4-digit start OTP displayed to rider upon captain arrival.

### 1.2 Captain (EV Driver Partner)
- **Persona**: Commercial EV drivers operating green-plate electric two-wheelers, three-wheelers, or sedans.
- **US-CAP-01**: *Commercial EV Onboarding & Battery Telemetry Broadcasting*
  - **Narrative**: As an EV driver partner, I want to register my commercial green-plate EV, verify my commercial driving badge, and broadcast my real-time battery SoC %, so that I only receive dispatch offers I can fulfill without getting stranded.
  - **Acceptance Criteria**:
    - Upload commercial driving license and RTO EV green-plate registration.
    - Client telemetry service broadcasts GPS location and battery SoC % every 5 seconds.
    - Receive dispatch offers with a 15-second acceptance timer backed by a mutex lock.
    - Verify rider OTP before starting trip meter and see immediate daily payout upon completion.

### 1.3 Dispatcher (Operations Center)
- **Persona**: Regional operations controllers monitoring vehicle clusters and corridor demand in Andhra Pradesh.
- **US-DIS-01**: *Regional Fleet Heatmap & Battery Emergency Override*
  - **Narrative**: As an operations dispatcher, I want a live map of active EV clusters, charging hubs, and pending ride requests, so that I can rebalance vehicles and manually reassign stranded passengers when a vehicle suffers battery breakdown.
  - **Acceptance Criteria**:
    - View real-time PostGIS spatial clusters of available, busy, and charging EVs.
    - Detect automated alerts when an en-route EV battery drops below critical threshold (10%).
    - Manual one-click reassignment of stranded rider to nearest relief EV.

### 1.4 Fleet Owner (Commercial Fleet Operator)
- **Persona**: Operators owning 5–50 commercial EVs deploying them with salaried or commission-based captains.
- **US-FLE-01**: *Multi-Vehicle EV Roster & Aggregate Battery Health Dashboard*
  - **Narrative**: As a commercial fleet owner operating 25 e-Autos, I want to manage my vehicle roster, assign vetted captains, and monitor battery degradation and daily revenue splits, so that my fleet operates at peak efficiency.
  - **Acceptance Criteria**:
    - Add/remove vehicles and pair them with active vetted captains.
    - View battery cycle count, State of Health (SoH %), and charging logs per vehicle.
    - Download daily and weekly commission reconciliation statements.

### 1.5 Finance (Settlements, Refunds & Ledgers)
- **Persona**: Financial controllers auditing double-entry transaction ledgers, escrow accounts, and SLA refunds.
- **US-FIN-01**: *Immutable Ledger Audit & Automated SLA Delay Compensation*
  - **Narrative**: As a finance manager, I want an immutable, idempotent ledger of all ride transactions and automated compensation payouts for SLA breaches, so that rider credits are issued accurately and financial books balance.
  - **Acceptance Criteria**:
    - Maintain double-entry transaction ledgers for rider charges, platform fees, and captain payouts.
    - Automatically trigger delay compensation credit when trip tardiness exceeds 10 minutes.
    - Audit and disburse approved cancellation and failed payment refunds.

### 1.6 Safety (Emergency Response Officer)
- **Persona**: 24/7 emergency response officers stationed at the safety operations console.
- **US-SAF-01**: *24/7 Incident Console & Live Police 112 Emergency Dispatch*
  - **Narrative**: As a safety response officer, I want an instant audio-visual siren and live GPS telemetry when SOS is triggered, so that I can intervene immediately and dispatch AP Emergency Police 112 with trip data.
  - **Acceptance Criteria**:
    - Receive instant high-priority alert within 1 second of rider or captain SOS button press.
    - Access live audio stream, vehicle speed telemetry, and route deviation history.
    - Dispatch automated emergency packet (lat/lon, vehicle plate, passenger contact) to AP Police 112.

### 1.7 Institution (Corporate & University Bulk Pass Admin)
- **Persona**: University or corporate HR/sustainability managers administering employee transit subsidies.
- **US-INS-01**: *Corporate & University Commuter Pass Subsidy Administration*
  - **Narrative**: As a university or corporate transport administrator, I want to manage an institutional subsidy account, allocate monthly EV passes to registered members, and track CO2 emission savings, so that our organization fosters sustainable commuting.
  - **Acceptance Criteria**:
    - Bulk provision monthly pass quotas to registered student/employee mobile numbers.
    - Set time-of-day and corridor restrictions for subsidized rides.
    - Export verifiable monthly ESG sustainability reports showing carbon offset kilograms.

---

## 2. State-Oriented Journey Flows

Every journey step explicitly defines:
1. **Responsible Actor**
2. **Current State & Screen ID**
3. **Success Path (Action, Next State, Next Screen)**
4. **Empty State (Condition, Display Message, Recovery Action)**
5. **Failure Path (Trigger, Error State, Fallback Recovery Screen)**

---

### Flow 1: Private EV On-Demand Ride (`private_ride`)

```mermaid
stateDiagram-v2
    [*] --> LOCATION_SEARCH
    LOCATION_SEARCH --> FARE_ESTIMATION: Coordinates Valid
    LOCATION_SEARCH --> ZONE_RESTRICTED: Outside AP Zone
    ZONE_RESTRICTED --> LOCATION_SEARCH: Recovery

    FARE_ESTIMATION --> DISPATCHING: Book Ride
    FARE_ESTIMATION --> DISPATCH_REJECTED: Low Battery / Payment Err
    DISPATCH_REJECTED --> FARE_ESTIMATION: Recovery

    DISPATCHING --> EN_ROUTE_PICKUP: Captain Accepts (Mutex)
    DISPATCHING --> DISPATCH_TIMEOUT: No Captain (45s)
    DISPATCH_TIMEOUT --> LOCATION_SEARCH: Recovery

    EN_ROUTE_PICKUP --> ARRIVED: Geofence Entered
    EN_ROUTE_PICKUP --> RIDE_CANCELLED: Rider/Captain Cancel
    RIDE_CANCELLED --> LOCATION_SEARCH: Recovery

    ARRIVED --> IN_TRANSIT: OTP Validated
    ARRIVED --> OTP_FAILED: Invalid OTP 3x
    OTP_FAILED --> ARRIVED: Recovery

    IN_TRANSIT --> TRIP_COMPLETED: Reaches Dropoff
    IN_TRANSIT --> EMERGENCY_TRIGGERED: SOS Activated

    TRIP_COMPLETED --> [*]
```

| State | Screen ID | Actor | Success Path | Empty State | Failure Path |
|---|---|---|---|---|---|
| `LOCATION_SEARCH` | `SCR_RIDER_SEARCH` | RIDER | Selects coordinates in Vizag → `SCR_RIDER_VEHICLE_SELECT` | "No recent destinations" → search transit hubs | Outside pilot zone → `SCR_RIDER_ZONE_RESTRICTED` |
| `FARE_ESTIMATION` | `SCR_RIDER_VEHICLE_SELECT` | RIDER | Chooses EV category & confirms → `SCR_RIDER_MATCHING` | "No EVs in 5 km radar" → expand search | Battery check fails → `SCR_RIDER_PAYMENT_ERROR` |
| `DISPATCHING` | `SCR_RIDER_MATCHING` | CAPTAIN | Captain accepts in 15s → `SCR_RIDER_LIVE_TRACK` | "Connecting with green-plate EV captains..." | 45s timeout → `SCR_RIDER_NO_CAPTAINS_TIMEOUT` |
| `EN_ROUTE_PICKUP` | `SCR_RIDER_LIVE_TRACK` | CAPTAIN | Enters 50m geofence → `SCR_RIDER_OTP_DISPLAY` | Live GPS route updating on map | Cancelled >2 mins → `SCR_RIDE_CANCELLED` |
| `ARRIVED` | `SCR_RIDER_OTP_DISPLAY` | CAPTAIN | Captain enters 4-digit OTP → `SCR_RIDER_TRIP_PROGRESS` | "Captain waiting. Share OTP to start" | 3 invalid OTPs → `SCR_CAPTAIN_OTP_ERROR` |
| `IN_TRANSIT` | `SCR_RIDER_TRIP_PROGRESS` | CAPTAIN | Arrives at dropoff → `SCR_RIDER_RATING_RECEIPT` | In-transit zero-emission telemetry streaming | Critical deviation → `SCR_RIDER_SOS_BUTTON` |
| `TRIP_COMPLETED` | `SCR_RIDER_RATING_RECEIPT` | RIDER | Submits rating & fare settles → `SCR_RIDER_SEARCH` | "You saved 1.4 kg CO2 today!" | Payment retry → `SCR_RIDER_PAYMENT_ERROR` |

---

### Flow 2: Scheduled Shared EV Commute (`shared_seat`)

```mermaid
stateDiagram-v2
    [*] --> CORRIDOR_BROWSE
    CORRIDOR_BROWSE --> SEAT_SELECTION: Selects Route & Slot
    CORRIDOR_BROWSE --> CORRIDOR_INACTIVE: Corridor Closed
    CORRIDOR_INACTIVE --> CORRIDOR_BROWSE: Recovery

    SEAT_SELECTION --> BOOKING_CONFIRMATION: Seat Lock Acquired
    SEAT_SELECTION --> SEAT_UNAVAILABLE: Conflict (409)
    SEAT_UNAVAILABLE --> SEAT_SELECTION: Recovery

    BOOKING_CONFIRMATION --> BOARDING_SCAN: QR Pass Issued
    BOOKING_CONFIRMATION --> SHARED_BOOKING_CANCELLED: User Cancel
    SHARED_BOOKING_CANCELLED --> CORRIDOR_BROWSE: Recovery

    BOARDING_SCAN --> CORRIDOR_IN_TRANSIT: QR Scanned at Virtual Stop
    BOARDING_SCAN --> PASSENGER_NO_SHOW: No-Show > 3 mins
    PASSENGER_NO_SHOW --> CORRIDOR_BROWSE: Recovery

    CORRIDOR_IN_TRANSIT --> SHARED_TRIP_COMPLETED: Alights at Destination
    CORRIDOR_IN_TRANSIT --> DISPATCH_RESCUE: Vehicle Breakdown
    DISPATCH_RESCUE --> CORRIDOR_INACTIVE: Relief Shuttle

    SHARED_TRIP_COMPLETED --> [*]
```

| State | Screen ID | Actor | Success Path | Empty State | Failure Path |
|---|---|---|---|---|---|
| `CORRIDOR_BROWSE` | `SCR_COMMUTE_CORRIDORS` | RIDER | Selects corridor & slot → `SCR_COMMUTE_SEAT_MAP` | "No scheduled shuttles at slot" → browse slots | Corridor closed → `SCR_COMMUTE_CORRIDOR_CLOSED` |
| `SEAT_SELECTION` | `SCR_COMMUTE_SEAT_MAP` | RIDER | Selects seat & locks in DB → `SCR_COMMUTE_TICKET_BOARDING_PASS` | Seat layout loaded with gender priority tags | Seat taken simultaneously → `SCR_COMMUTE_SEAT_CONFLICT` |
| `BOOKING_CONFIRMATION` | `SCR_COMMUTE_TICKET_BOARDING_PASS` | RIDER | QR boarding pass active → `SCR_COMMUTE_QR_SCANNER` | "Be at Virtual Stop A 5m before slot" | Cancelled >30m before → `SCR_COMMUTE_CORRIDORS` |
| `BOARDING_SCAN` | `SCR_COMMUTE_QR_SCANNER` | CAPTAIN | Captain scans passenger QR → `SCR_COMMUTE_ROUTE_PROGRESS` | "Scanning boarding passes for route..." | Passenger no-show 3m past slot → `SCR_COMMUTE_CORRIDORS` |
| `CORRIDOR_IN_TRANSIT` | `SCR_COMMUTE_ROUTE_PROGRESS` | CAPTAIN | Reaches passenger destination → `SCR_COMMUTE_RECEIPT` | Route navigation to next virtual stop | Vehicle breakdown → `SCR_COMMUTE_CORRIDOR_CLOSED` |
| `SHARED_TRIP_COMPLETED` | `SCR_COMMUTE_RECEIPT` | RIDER | Reviews savings & returns → `SCR_COMMUTE_CORRIDORS` | "Saved ₹120 and 2.8 kg CO2 today" | Disputed stop → `SCR_RIDER_TRIP_DELAY_ALERT` |

---

### Flow 3: Commuter Pass Redemption (`pass_redemption`)

```mermaid
stateDiagram-v2
    [*] --> PASS_CATALOG
    PASS_CATALOG --> PASS_ACTIVE: Pass Purchased / Corporate Code
    PASS_CATALOG --> PURCHASE_FAILED: Quota / Payment Error
    PURCHASE_FAILED --> PASS_CATALOG: Recovery

    PASS_ACTIVE --> PASS_APPLIED: Apply to Next Ride
    PASS_ACTIVE --> PASS_EXPIRED: Expiration / Limit Reached
    PASS_EXPIRED --> PASS_ACTIVE: Recovery

    PASS_APPLIED --> REDEMPTION_FULFILLED: 1 Token Deducted (Ledger)
    PASS_APPLIED --> DISTANCE_CAP_EXCEEDED: Distance > Tier Limit
    DISTANCE_CAP_EXCEEDED --> PASS_APPLIED: Top-Up

    REDEMPTION_FULFILLED --> [*]
```

| State | Screen ID | Actor | Success Path | Empty State | Failure Path |
|---|---|---|---|---|---|
| `PASS_CATALOG` | `SCR_PASS_CATALOG` | RIDER | Purchases pass / voucher → `SCR_PASS_WALLET_DASHBOARD` | "Save 40% on daily commute with pass" | Voucher exhausted → `SCR_PASS_QUOTA_EXHAUSTED` |
| `PASS_ACTIVE` | `SCR_PASS_WALLET_DASHBOARD` | RIDER | Taps Apply Pass to Ride → `SCR_RIDER_CHECKOUT_WITH_PASS` | "26 of 30 rides remaining. Valid 24d" | Expiration reached → `SCR_PASS_LIMIT_REACHED` |
| `PASS_APPLIED` | `SCR_RIDER_CHECKOUT_WITH_PASS` | RIDER | Fare discounted to ₹0 → `SCR_PASS_CONFIRMATION` | Verifying entitlement for route distance | Trip >15 km → `SCR_PASS_DISTANCE_TOPUP` |
| `REDEMPTION_FULFILLED` | `SCR_PASS_CONFIRMATION` | FINANCE | Token deducted in ledger → `SCR_RIDER_MATCHING` | "Pass applied! 1 token deducted" | Ledger lock failure → `SCR_PASS_WALLET_DASHBOARD` |

---

### Flow 4: Refunds & Delay Compensation (`refund`)

```mermaid
stateDiagram-v2
    [*] --> SLA_AUDIT_TRIGGER
    SLA_AUDIT_TRIGGER --> CLAIM_EVALUATION: Delay > 10m Verified
    SLA_AUDIT_TRIGGER --> REFUND_INELIGIBLE: Rider Route Alteration
    REFUND_INELIGIBLE --> SLA_AUDIT_TRIGGER: Recovery

    CLAIM_EVALUATION --> DISBURSEMENT: Rules Engine Approves
    CLAIM_EVALUATION --> REFUND_REJECTED: Fraud / Duplicate
    REFUND_REJECTED --> CLAIM_EVALUATION: Recovery

    DISBURSEMENT --> REFUND_COMPLETED: Wallet / Bank Credit
    DISBURSEMENT --> PAYOUT_FAILED: Bank Timeout
    PAYOUT_FAILED --> DISBURSEMENT: Retry

    REFUND_COMPLETED --> [*]
```

| State | Screen ID | Actor | Success Path | Empty State | Failure Path |
|---|---|---|---|---|---|
| `SLA_AUDIT_TRIGGER` | `SCR_RIDER_TRIP_DELAY_ALERT` | RIDER | Automated delay audit trigger → `SCR_FINANCE_REFUND_DESK` | Monitoring arrival variance vs ETA | Delay due to rider detour → `SCR_REFUND_INELIGIBLE` |
| `CLAIM_EVALUATION` | `SCR_FINANCE_REFUND_DESK` | FINANCE | Rules engine approves claim → `SCR_FINANCE_LEDGER_PROCESSING` | Claim queued in audit pipeline | Duplicate claim → `SCR_REFUND_FRAUD_REJECTED` |
| `DISBURSEMENT` | `SCR_FINANCE_LEDGER_PROCESSING` | FINANCE | Automated credit credited → `SCR_RIDER_REFUND_SUCCESS` | Disbursing refund voucher to wallet | Gateway timeout → `SCR_REFUND_BANK_RETRY` |
| `REFUND_COMPLETED` | `SCR_RIDER_REFUND_SUCCESS` | RIDER | Rider views credit & returns → `SCR_RIDER_SEARCH` | "₹85 delay credit added to green wallet" | Dispute escalation → `SCR_REFUND_INELIGIBLE` |

---

### Flow 5: Emergency SOS & Police 112 Dispatch (`emergency`)

```mermaid
stateDiagram-v2
    [*] --> SOS_TRIGGERED
    SOS_TRIGGERED --> CRITICAL_ALERT_ACTIVE: 3s Countdown Expires
    SOS_TRIGGERED --> SOS_CANCELLED: Cancelled in 3s
    SOS_CANCELLED --> SOS_TRIGGERED: Recovery

    CRITICAL_ALERT_ACTIVE --> INCIDENT_INTERVENTION: Safety Desk Answers
    CRITICAL_ALERT_ACTIVE --> TELEMETRY_LOST: Lost GPS Connection
    TELEMETRY_LOST --> INCIDENT_INTERVENTION: Offline Police Bridge

    INCIDENT_INTERVENTION --> INCIDENT_RESOLVED: AP Police 112 Intercepts
    INCIDENT_INTERVENTION --> SECONDARY_ESCALATION: City Control Room Call
    SECONDARY_ESCALATION --> INCIDENT_RESOLVED: Resolved

    INCIDENT_RESOLVED --> [*]
```

| State | Screen ID | Actor | Success Path | Empty State | Failure Path |
|---|---|---|---|---|---|
| `SOS_TRIGGERED` | `SCR_RIDER_SOS_BUTTON` | RIDER | 3s countdown expires → `SCR_SAFETY_CONSOLE_INCIDENT` | "Sending alert to 24/7 Safety Desk in 3s..." | Cancelled by user → `SCR_RIDER_TRIP_PROGRESS` |
| `CRITICAL_ALERT_ACTIVE` | `SCR_SAFETY_CONSOLE_INCIDENT` | SAFETY | Safety officer answers siren → `SCR_SAFETY_DISPATCH_ESCALATION` | "CRITICAL SOS: AP 31 TX 4920 (e-Auto)" | Telemetry offline → `SCR_SAFETY_OFFLINE_PROBE_POLICE` |
| `INCIDENT_INTERVENTION` | `SCR_SAFETY_DISPATCH_ESCALATION` | SAFETY | Police 112 intercepts car → `SCR_SAFETY_INCIDENT_REPORT` | "Police 112 Dispatched. Patrol ETA: 4m" | Patrol unreachable → `SCR_SAFETY_OFFLINE_PROBE_POLICE` |
| `INCIDENT_RESOLVED` | `SCR_SAFETY_INCIDENT_REPORT` | SAFETY | Officer files audit report → `SCR_RIDER_SEARCH` | Post-incident report filed | Legal quarantine → `SCR_SAFETY_INCIDENT_REPORT` |

---

## 3. Screen Graph Connectivity Analysis (Zero Orphaned Screens)

The screen registry defines **38 unique screen nodes**. The graph was analyzed using an automated reachability and connectivity crawler in `JourneysService`:
- **Total Registered Screens**: 38
- **Total Directed Transitions**: 42
- **Orphaned Screens**: **0** (All screens have active incoming links from root/transitions and valid recovery/forward links).
- **Dead-End States**: Every terminal state returns either to the primary search hub (`SCR_RIDER_SEARCH`), corridor dashboard (`SCR_COMMUTE_CORRIDORS`), or incident resolution console.

