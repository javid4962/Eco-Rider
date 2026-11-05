# EcoRide Mobile Release Readiness & Store Deployment Audit (M25)

## 1. App Store Submission Matrix

| App | Package ID | Target SDK | Primary Features |
|---|---|---|---|
| **EcoRide Rider App** | `in.ecoride.rider` | Android 14 (API 34) / iOS 17 | EV ride hailing, AP corridor bus feeder, live tracking, SOS 112 |
| **EcoRide Captain App** | `in.ecoride.captain` | Android 14 (API 34) / iOS 17 | EV dispatch offers, OTP start, battery range locks, depot reservations |

---

## 2. Operating Permissions Audit & Privacy Safeguards

### Rider App (`in.ecoride.rider`)
- `ACCESS_FINE_LOCATION` & `ACCESS_COARSE_LOCATION`: Required for accurate pickup dispatch in Vijayawada, Guntur, Amaravathi, Mangalagiri.
- `POST_NOTIFICATIONS`: Ride assignment, captain arrival, and AP DLT compliance alerts.
- **Strictly Prohibited & Audited**:
  - NO `READ_CONTACTS` or `READ_SMS` (SMS DLT OTP handled directly via backend or Google SMS Retriever API without SMS reading permission).
  - NO microphone access during ordinary trips.

### Captain App (`in.ecoride.captain`)
- `ACCESS_FINE_LOCATION` & `ACCESS_BACKGROUND_LOCATION`: Required strictly when captain toggles `ON_DUTY` for real-time dispatch matching.
- `FOREGROUND_SERVICE_LOCATION`: Sticky notification displaying "EcoRide Captain is active on duty in Andhra Pradesh".
- `CAMERA`: Required solely during captain onboarding for commercial permit and vehicle green plate verification.

---

## 3. Andhra Pradesh Police 112 Emergency Disclosure
- **Play Store Safety Section**: Declares emergency location sharing upon rider/captain SOS button activation.
- Tracking URLs are tokenized (`https://track.ecoride.in/live/:token`), expiring within 2 hours of trip completion.
- Zero PII (rider home address, phone numbers) is leaked in public tracking links.

---

## 4. Release Build Commands

### Android AAB Bundle
```bash
# Rider App
cd apps/rider_app
flutter build appbundle --release --obfuscate --split-debug-info=build/symbols

# Captain App
cd apps/captain_app
flutter build appbundle --release --obfuscate --split-debug-info=build/symbols
```

### Static Analysis Verification
```bash
# Dart code analysis
flutter analyze
```

