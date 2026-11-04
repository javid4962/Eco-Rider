# EcoRide Provider Integration & Architecture Matrix

This matrix provides the comparative evaluation, sandbox/live configuration, cost structure, and fallback strategy for all external vendor providers across the EcoRide platform.

---

## 1. Provider Comparison & Selection

### 1.1 Maps, Geocoding & Navigation: Google Maps vs. Mapbox

| Dimension | Google Maps Platform | Mapbox | Recommendation & Decision |
|---|---|---|---|
| **India Local Data & Address Precision** | Highest accuracy in AP cities (Vijayawada, Guntur, Amaravathi) including local landmarks, streets, and colonies. | Moderate accuracy in Tier-2/Tier-3 Andhra Pradesh; excellent vector map styling. | **Primary for Routing/Geocoding**: Google Maps Places & Distance Matrix API.<br>**Alternative/Vector Layer**: Mapbox for high-throughput mobile vector tiles. |
| **Flutter SDK Support** | `google_maps_flutter` (official, high maturity, platform views). | `mapbox_maps_flutter` (community & official v10, rich offline tile support). | Flutter apps support unified `MapProvider` abstraction capable of swapping tiles without UI refactoring. |
| **Pricing / Tier Costs** | $5.00 per 1,000 Directions; $17.00 per 1,000 Geocoding ($200 monthly free tier). Higher at scale. | $0.50 per 1,000 Directions; $0.75 per 1,000 Geocoding (first 100k requests free). ~70% lower cost. | **Cost Optimization**: Cache geocoding results in Redis (7-day TTL); compute straight-line distance via PostGIS before requesting external routing API. |
| **Offline Capability** | Limited caching. | Strong offline tile pack support. | Mapbox caching evaluated for low-connectivity rural corridor routes. |

### 1.2 Payments & Settlements: Razorpay vs. Cashfree / PayU

| Provider | India UPI / Mandates | Payouts / Split Disbursals | Test Mode & Reliability | Decision |
|---|---|---|---|---|
| **Razorpay** | Industry standard for UPI Intent, QR, cards, net banking, and e-Mandates (`Razorpay Subscriptions`). | `RazorpayX` API for instant NEFT/IMPS/UPI captain earnings payouts and bank verification. | Comprehensive mock webhook simulator, robust webhook HMAC-SHA256 signature verification. | **SELECTED PRIMARY**: Complete support for both consumer collection (test mode) and driver settlement ledger. |
| **Cashfree** | Strong payout capabilities (`Cashfree Payouts`). | Low transaction fees on UPI collections. | Good API documentation. | **Secondary Fallback**: Suitable for secondary payout gateway if multi-gateway routing is enabled. |

### 1.3 Messaging, SMS & WhatsApp: MSG91 vs. Twilio vs. Amazon SES

| Channel | Provider | Indian DLT Compliance | WhatsApp Business API | Recommendation |
|---|---|---|---|---|
| **SMS / OTP** | **MSG91** | Native TRAI DLT registration integration with approved AP Entity & Template IDs. Lowest cost per SMS in India (~₹0.12 - ₹0.18 / SMS). | Supported via MSG91 Hello / Campaign API. | **SELECTED PRIMARY SMS**: In compliance with Indian telecom regulations. |
| **Transactional Email** | **Amazon SES** | High deliverability, lowest cost ($0.10 / 10,000 emails), compliant with Indian data localization. | N/A | **SELECTED PRIMARY EMAIL**: Used for receipts, monthly corporate invoices, and tax statements. |
| **WhatsApp Business** | **Meta Cloud API / MSG91** | Requires approved WhatsApp Business Account (WABA) and pre-approved HSM utility templates. | Direct or via BSP. | **Utility Notifications**: Pre-approved trip start, booking confirmation, and safety alerts. |

### 1.4 Digital KYC & Identity Verification: Surepass vs. Signzy vs. Digio

| Capability | Surepass | Digio | Signzy | Decision |
|---|---|---|---|---|
| **Aadhaar OKYC / DigiLocker** | Fast API response, reasonable per-hit pricing (₹2–₹3 / check). | Official DigiLocker G2C gateway, trusted enterprise trust. | Comprehensive video KYC and AI face match. | **Hybrid**: Support DigiLocker consented flow via adapter; retain manual admin review in `apps/ops-web` as authoritative gate. |
| **Driving License & RC Search** | Real-time Parivahan Sarathi/Vahan API integration. | Good DL verification. | Multi-tier vehicle verification. | Automated verification adapter behind feature flag; mandatory green-plate validation. |

---

## 2. Integration Matrix Status Table

| Capability | Vendor / Adapter | Mode | Credentials Status | Fallback Strategy |
|---|---|---|---|---|
| **Payments (Checkout)** | Razorpay | Sandbox / Test | Configured (`rzp_test_*`) | Cash mode with driver liability tracking |
| **Payouts (Driver/Owner)** | RazorpayX | Staged / Mock | Disabled until KYC approved | Manual batch NEFT/IMPS export from Ops Web |
| **SMS / OTP** | MSG91 | Synthetic Local / Mock | DLT templates registered | Log to console in development; mock SMS provider |
| **Email** | Amazon SES / Mock | Sandbox | Mock active | Local email preview / audit log persistence |
| **Maps & Routing** | Google Maps / PostGIS | Hybrid | PostGIS spatial engine active | Native PostGIS spatial queries (no API cost) |
| **Charger Discovery** | Aggregator Directory | Internal Directory | Static verified database | External booking deep links |
| **KYC Verification** | DigiLocker / Surepass | Manual Ops Review | Fallback manual enabled | Ops portal document review queue |

