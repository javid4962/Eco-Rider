# TRAI DLT Sender Compliance & Production OTP Architecture

## 1. Regulatory Context (TRAI TCCCPR 2018)
In India, commercial and transactional mobile communications are governed by the **Telecom Regulatory Authority of India (TRAI)** under the **Telecom Commercial Communications Customer Preference Regulations (TCCCPR, 2018)**. 

To eliminate spam, SMS fraud, and unauthorized sender spoofing, all Application-to-Person (A2P) SMS traffic in India must be routed through a **Distributed Ledger Technology (DLT)** blockchain platform managed by major Indian telecom service providers (Airtel, Jio, Vodafone-Idea, BSNL).

For EcoRide's electric mobility operations in Andhra Pradesh:
- All authentication OTPs, ride-start verification codes, and emergency alerts are classified as **Service Implicit** (Transactional).
- Service Implicit messages are strictly operational, time-critical, and exempt from commercial National Customer Preference Register (NCPR / DND) filtering, provided they match registered DLT templates.

---

## 2. Principal Entity (PE) Registration
EcoRide Mobility must be registered as an authorized Principal Entity on Indian telecom DLT portals (e.g., Vilpower, PingConnect, Jio DLT):

| Field | Configuration Parameter | Value / Guidance |
|---|---|---|
| **Legal Entity Name** | - | EcoRide Mobility Private Limited |
| **Operating Jurisdiction** | - | Andhra Pradesh, India (HQ: Visakhapatnam) |
| **Corporate ID (CIN)** | - | Formally verified via MCA |
| **Principal Entity ID (PE ID)** | `MSG91_DLT_PE_ID` | `1101550000000012345` (17-digit entity ID) |
| **DLT Telecommunication Category** | - | Transportation & Urban Mobility Services |

---

## 3. Header / Sender ID Compliance
Transactional and Service Implicit messages require a registered 6-alpha character Header:

| Header | Type | Purpose | Restrictions |
|---|---|---|---|
| `ECORID` | Service Implicit | One-time passwords (Login, Ride Start, Emergency), driver dispatch notices | • Exactly 6 alpha characters<br>• Must directly reflect registered brand name<br>• Case-insensitive in carrier logs<br>• Promotional marketing strictly prohibited |

---

## 4. Content Template Registration & Localization
Every message sent to an Indian mobile handset must strictly match a pre-registered DLT Content Template. In accordance with Andhra Pradesh linguistic demographics, templates are localized in **Telugu (`te`)**, **English (`en`)**, and **Hindi (`hi`)**.

### 4.1 Character Encoding & SMS Concatenation Constraints
- **English GSM 7-bit Encoding**:
  - Single message limit: 160 characters.
  - Multi-part concatenated SMS: 153 characters per part (7 bytes reserved for UDH header).
- **Telugu & Hindi Unicode (UCS-2) Encoding**:
  - Single message limit: 70 characters.
  - Multi-part concatenated SMS: 67 characters per part.
  - *Engineering Note*: Telugu scripts require UCS-2 Unicode. Concatenation increases carrier per-segment billing; templates are optimized for conciseness while retaining legal disclosures.

### 4.2 Registered DLT Content Templates

#### A. Commuter & Captain Login OTP (`LOGIN`)
- **Validity**: 5 minutes (`OTP_EXPIRY_SECONDS = 300`)
- **Code Length**: 6 digits (`\d{6}`)
- **DLT Templates**:
  - **Telugu (`te`)** — DLT Template ID: `1107160000000010001`
    ```text
    మీ EcoRide లాగిన్ OTP: {#var#}. ఇది 5 నిమిషాల పాటు మాత్రమే చెల్లుతుంది. ఎవరితోనూ పంచుకోవద్దు. - EcoRide (AP)
    ```
  - **English (`en`)** — DLT Template ID: `1107160000000010002`
    ```text
    Your EcoRide login OTP is {#var#}. Valid for 5 minutes. Do not share this code with anyone. - EcoRide (AP)
    ```
  - **Hindi (`hi`)** — DLT Template ID: `1107160000000010003`
    ```text
    आपका EcoRide लॉगिन OTP {#var#} है। 5 मिनट के लिए वैध। इसे किसी के साथ साझा न करें। - EcoRide (AP)
    ```

#### B. Ride Boarding Verification OTP (`RIDE_START`)
- **Validity**: 5 minutes
- **Code Length**: 4 digits (`\d{4}`)
- **DLT Templates**:
  - **Telugu (`te`)** — DLT Template ID: `1107160000000010004`
    ```text
    మీ EcoRide రైడ్ ప్రారంభ OTP: {#var#}. క్యాప్టెన్ వాహనం వద్దకు వచ్చాక మాత్రమే చెప్పండి. - EcoRide
    ```
  - **English (`en`)** — DLT Template ID: `1107160000000010005`
    ```text
    Your EcoRide ride start OTP is {#var#}. Share only with your EV Captain upon boarding. - EcoRide
    ```
  - **Hindi (`hi`)** — DLT Template ID: `1107160000000010006`
    ```text
    आपका EcoRide राइड स्टार्ट OTP {#var#} है। बोर्डिंग के समय केवल अपने EV कैप्टन को बताएं। - EcoRide
    ```

#### C. Emergency Security Alert Verification (`EMERGENCY`)
- **Validity**: 5 minutes
- **Code Length**: 6 digits (`\d{6}`)
- **DLT Templates**:
  - **Telugu (`te`)** — DLT Template ID: `1107160000000010007`
    ```text
    EcoRide ఎమర్జెన్సీ ధృవీకరణ కోడ్: {#var#}. భద్రతా పర్యవేక్షణ కోసం. - EcoRide
    ```
  - **English (`en`)** — DLT Template ID: `1107160000000010008`
    ```text
    EcoRide emergency alert verification OTP: {#var#}. Active security check. - EcoRide
    ```
  - **Hindi (`hi`)** — DLT Template ID: `1107160000000010009`
    ```text
    EcoRide आपातकालीन सत्यापन OTP: {#var#}। सक्रिय सुरक्षा जांच। - EcoRide
    ```

---

## 5. Delivery Status Categories & Operator Error Taxonomy
The platform normalizes disparate telco carrier receipts into 8 authoritative delivery categories:

| Unified Category | Telco / SMSC State | Meaning | Operational Action |
|---|---|---|---|
| `DELIVERED` | Receipt: `DELIVRD` (1) | Handset delivery confirmed by mobile network operator | Successful transaction closed |
| `SUBMITTED` | Receipt: `AWAITING_DELIVERY` (2) | Handed off to telco SMS center; awaiting tower paging | Standard flight state; await webhook receipt |
| `PENDING` | State: `QUEUED` (16) | Message enqueued within provider or operator queue | In flight |
| `RETRYING` | State: `RETRYING` (8) | Transient carrier bottleneck or route congestion | Automatic exponential retry in progress |
| `FAILED_DND` | State: `DND_REJECTED` (17) | Scrubber flagged number as NCPR/DND blocked | Critical audit: Transactional OTPs should be Service Implicit |
| `FAILED_OPERATOR`| State: `UNDELIV` (32) | Out of coverage, SIM inactive, handset memory full | User guidance to check network connectivity |
| `FAILED_EXPIRED` | State: `EXPIRED` (64) | Carrier queue expired before subscriber came online | Prompt user to request new OTP |
| `REJECTED_CREDENTIALS` | State: `AUTH_FAILURE` (128) | Mismatched Template ID, unapproved header, bad AuthKey | Alert engineering immediately; carrier reject |

---

## 6. Key Segregation & Deployment Gates

1. **Synthetic Isolation in Non-Production**:
   - `NODE_ENV=test` and `NODE_ENV=development` default to `MockOtpProvider`.
   - Mock adapters generate dynamic in-memory codes without remote cloud calls or carrier tariffs.
2. **Hard-Coded Inactivity Gate**:
   - `MSG91_ENABLED=false` is enforced by default.
   - Any attempt to invoke live dispatch while `MSG91_ENABLED=false` immediately throws `ServiceUnavailableException`.
3. **Zero Plaintext Credentials in Repositories or Logs**:
   - Real keys are injected strictly via runtime secrets management (e.g. AWS Secrets Manager or Kubernetes Secrets).
   - Repository secret scanning (`scripts/scan-secrets.ts`) actively blocks commits containing live keys or master bypasses.
   - Application logging interceptors (`LogSanitizer`) automatically mask phone numbers (`+91*****0001`) and redact any occurrences of `authkey`, `apikey`, or raw OTP digits.

