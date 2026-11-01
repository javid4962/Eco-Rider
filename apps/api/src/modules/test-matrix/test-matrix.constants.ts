import {
  TestCategory,
  RequirementPriority,
  RequirementType,
  TestRequirementMapping,
} from '@ecoride/contracts';

/**
 * Authoritative Requirements-to-Tests Traceability Matrix
 * Maps core platform requirements to API, mobile, admin, concurrency, security, and field tests.
 * All Compliance and Financial tests are marked as Release Blockers.
 * Every P0 flow has a measurable assertion and an assigned Human Acceptance Owner.
 */
export const AUTHORITATIVE_TEST_MATRIX: TestRequirementMapping[] = [
  {
    reqId: 'REQ-EV-01',
    title: '100% Battery Electric Vehicle (BEV) Propulsion Enforcement',
    priority: RequirementPriority.P0,
    type: RequirementType.COMPLIANCE,
    isReleaseBlocker: true,
    description:
      'Only 100% Battery Electric Vehicles (BEVs) are permitted on the platform. ICE, hybrid, and CNG vehicles are strictly rejected at registration.',
    measurableCriteria:
      'Server validation rejects non-electric fuel types with HTTP 422. PostGIS spatial entity constraints prohibit non-EV registration. Zero ICE records in database.',
    applicableCategories: [TestCategory.API, TestCategory.MOBILE, TestCategory.ADMIN, TestCategory.SECURITY],
    testImplementationReference: 'apps/api/test/vehicles.spec.ts',
    humanOwner: {
      name: 'S. K. Verma',
      role: 'Head of Regulatory & Transport Compliance',
      department: 'Legal & Regulatory Affairs',
      signOffStage: 'Pre-Pilot Launch Gate Authorization',
    },
  },
  {
    reqId: 'REQ-EV-02',
    title: 'Andhra Pradesh Regional Geofencing & Pilot Zone Boundaries',
    priority: RequirementPriority.P0,
    type: RequirementType.COMPLIANCE,
    isReleaseBlocker: true,
    description:
      'Trips and dispatches are strictly restricted to authorized pilot zones in Andhra Pradesh (Visakhapatnam urban corridor for Release A).',
    measurableCriteria:
      'ST_Contains spatial query returns false for coordinates outside authorized boundary polygon. API returns HTTP 400 ZONE_RESTRICTED with zero dispatch broadcast.',
    applicableCategories: [TestCategory.API, TestCategory.MOBILE, TestCategory.ADMIN, TestCategory.FIELD],
    testImplementationReference: 'apps/api/test/release-boundaries.service.spec.ts',
    humanOwner: {
      name: 'Ananya Rao',
      role: 'AP Operations & City Expansion Director',
      department: 'Operations',
      signOffStage: 'City Operational Launch Sign-Off',
    },
  },
  {
    reqId: 'REQ-EV-03',
    title: 'Concurrency-Safe Dispatch Acceptance & Mutex Lock',
    priority: RequirementPriority.P0,
    type: RequirementType.CORE_DISPATCH,
    isReleaseBlocker: true,
    description:
      'When a ride is broadcast to nearby captains, only the first valid acceptance succeeds; all subsequent attempts receive a conflict without double-booking.',
    measurableCriteria:
      'Redis Redlock / DB row lock ensures that among 5 simultaneous captain accept calls for 1 ride, exactly 1 receives HTTP 200 and 4 receive HTTP 409 Conflict.',
    applicableCategories: [TestCategory.API, TestCategory.CONCURRENCY],
    testImplementationReference: 'apps/api/test/dispatch-concurrency.spec.ts',
    humanOwner: {
      name: 'Vikramaditya P.',
      role: 'Principal Distributed Systems Engineer',
      department: 'Platform Engineering',
      signOffStage: 'Concurrency Stress Testing Sign-Off',
    },
  },
  {
    reqId: 'REQ-EV-04',
    title: 'Concurrency-Safe Shared Shuttle Seat Reservation Lock',
    priority: RequirementPriority.P0,
    type: RequirementType.CORE_DISPATCH,
    isReleaseBlocker: true,
    description:
      'Commuters reserving seats on scheduled EV corridor shuttles must not collide. Database row-level locks prevent over-booking vehicle seat capacity.',
    measurableCriteria:
      'PostgreSQL transactional lock (SELECT FOR UPDATE) prevents double-booking across 10 concurrent requests for the final seat. 1 succeeds, 9 fail with HTTP 409.',
    applicableCategories: [TestCategory.API, TestCategory.CONCURRENCY],
    testImplementationReference: 'apps/api/test/seat-lock-concurrency.spec.ts',
    humanOwner: {
      name: 'Vikramaditya P.',
      role: 'Principal Distributed Systems Engineer',
      department: 'Platform Engineering',
      signOffStage: 'Corridor Transit Capacity Verification',
    },
  },
  {
    reqId: 'REQ-EV-05',
    title: 'Battery Range Safety Buffer Feasibility Guard',
    priority: RequirementPriority.P0,
    type: RequirementType.SAFETY,
    isReleaseBlocker: true,
    description:
      'EV captains cannot receive dispatch offers if their vehicle battery State of Charge (SoC) is under 20% or insufficient for the trip distance + 20% safety margin.',
    measurableCriteria:
      'Dispatch filter evaluates vehicle battery kWh and remaining range. Captains with < 20% SoC or range < (distance * 1.2) are excluded with 100% accuracy.',
    applicableCategories: [TestCategory.API, TestCategory.MOBILE, TestCategory.FIELD],
    testImplementationReference: 'apps/api/test/battery-feasibility.spec.ts',
    humanOwner: {
      name: 'Dr. K. S. Murthy',
      role: 'EV Battery Systems & Fleet Safety Lead',
      department: 'Hardware & Telematics',
      signOffStage: 'Fleet Battery Range Audit',
    },
  },
  {
    reqId: 'REQ-EV-06',
    title: 'Cryptographic 4-Digit Start OTP & Anti-Spoofing',
    priority: RequirementPriority.P0,
    type: RequirementType.SAFETY,
    isReleaseBlocker: true,
    description:
      'Captains cannot start a ride meter without entering the rider’s cryptographically generated 4-digit start OTP. 3 consecutive failed attempts lock the ride.',
    measurableCriteria:
      'Meter start endpoint rejects calls without valid OTP. 3 failed attempts transition ride to OTP_FAILED and trigger dispatch audit alert.',
    applicableCategories: [TestCategory.API, TestCategory.MOBILE, TestCategory.SECURITY],
    testImplementationReference: 'apps/api/test/journeys.service.spec.ts',
    humanOwner: {
      name: 'Rajesh G.',
      role: 'Chief Information Security Officer (CISO)',
      department: 'Security & InfoSec',
      signOffStage: 'Anti-Fraud & Trip Security Sign-Off',
    },
  },
  {
    reqId: 'REQ-EV-07',
    title: 'Double-Entry Immutable Financial Ledger & Idempotency',
    priority: RequirementPriority.P0,
    type: RequirementType.FINANCIAL,
    isReleaseBlocker: true,
    description:
      'All ride fares, platform commissions, pass deductions, and driver payouts must balance in an immutable double-entry ledger with webhook idempotency.',
    measurableCriteria:
      'Sum of debits equals sum of credits for every transaction. Duplicate webhook payloads with identical idempotency key produce zero duplicate ledger records.',
    applicableCategories: [TestCategory.API, TestCategory.CONCURRENCY, TestCategory.SECURITY],
    testImplementationReference: 'apps/api/test/ledger-idempotency.spec.ts',
    humanOwner: {
      name: 'Priya M.',
      role: 'VP Finance & Treasury Operations',
      department: 'Finance',
      signOffStage: 'Financial Audit & Treasury Readiness',
    },
  },
  {
    reqId: 'REQ-EV-08',
    title: 'Automated SLA Delay Compensation & Refund Idempotency',
    priority: RequirementPriority.P0,
    type: RequirementType.FINANCIAL,
    isReleaseBlocker: true,
    description:
      'When an On-Time Guarantee trip is delayed by > 10 minutes due to platform fault, an automated compensation credit is deposited in the rider wallet.',
    measurableCriteria:
      'Telemetry audit automatically detects > 10 minute tardiness and disburses compensation credit within 60 seconds without manual intervention.',
    applicableCategories: [TestCategory.API, TestCategory.ADMIN],
    testImplementationReference: 'apps/api/test/sla-compensation.spec.ts',
    humanOwner: {
      name: 'Priya M.',
      role: 'VP Finance & Treasury Operations',
      department: 'Finance',
      signOffStage: 'SLA Compensation Policy Sign-Off',
    },
  },
  {
    reqId: 'REQ-EV-09',
    title: 'One-Touch Emergency SOS & AP Police 112 Dispatch Bridge',
    priority: RequirementPriority.P0,
    type: RequirementType.SAFETY,
    isReleaseBlocker: true,
    description:
      'One-touch SOS button in Rider and Captain apps triggers a high-priority alert on the Safety Console within 1000ms with live telemetry and police escalation bridge.',
    measurableCriteria:
      'End-to-end alert latency < 1000ms. Dispatch packet includes GPS coordinate, speed, vehicle plate, driver photo, and passenger contact for AP Police 112.',
    applicableCategories: [TestCategory.API, TestCategory.MOBILE, TestCategory.ADMIN, TestCategory.FIELD],
    testImplementationReference: 'apps/api/test/journeys.service.spec.ts',
    humanOwner: {
      name: 'D. Srinivas',
      role: 'Director of 24/7 Safety & Incident Response',
      department: 'Safety & Trust',
      signOffStage: 'Safety Operations & Police Dispatch Sign-Off',
    },
  },
  {
    reqId: 'REQ-EV-10',
    title: 'Passenger & Captain PII Protection and KYC Masking',
    priority: RequirementPriority.P0,
    type: RequirementType.SAFETY,
    isReleaseBlocker: true,
    description:
      'Passenger and driver phone numbers are masked using VoIP virtual numbers. KYC identity documents are accessible only via time-limited signed URLs.',
    measurableCriteria:
      'Zero unmasked phone numbers in API responses or client logs. Direct S3 buckets blocked; access strictly gated by role-based authorization tokens.',
    applicableCategories: [TestCategory.API, TestCategory.SECURITY, TestCategory.ADMIN],
    testImplementationReference: 'apps/api/test/health.controller.spec.ts',
    humanOwner: {
      name: 'Rajesh G.',
      role: 'Chief Information Security Officer (CISO)',
      department: 'Security & InfoSec',
      signOffStage: 'Data Privacy & PII Compliance Sign-Off',
    },
  },
  {
    reqId: 'REQ-EV-11',
    title: 'Bilingual Telugu/English UI Parity & WCAG 2.1 Accessibility',
    priority: RequirementPriority.P1,
    type: RequirementType.EXPERIENCE,
    isReleaseBlocker: false,
    description:
      'All UI text across Rider, Captain, and Ticket interfaces must have 100% bilingual parity between Telugu and English, and meet WCAG 2.1 AA/AAA standards.',
    measurableCriteria:
      'Automated test verifies 100% dictionary coverage in Telugu (te). Relative luminance contrast ratios exceed 4.5:1. All interactive touch targets >= 48dp.',
    applicableCategories: [TestCategory.MOBILE, TestCategory.ADMIN],
    testImplementationReference: 'apps/api/test/design-system.service.spec.ts',
    humanOwner: {
      name: 'Meenakshi K.',
      role: 'Head of Product Design & Accessibility',
      department: 'Product & UX',
      signOffStage: 'Design System & Localization Quality Sign-Off',
    },
  },
  {
    reqId: 'REQ-EV-12',
    title: 'High-Frequency Telemetry Ingestion & Dead-Zone Recovery',
    priority: RequirementPriority.P1,
    type: RequirementType.CORE_DISPATCH,
    isReleaseBlocker: false,
    description:
      'Captain telemetry (GPS + SoC %) is ingested every 5 seconds into Redis geospatial cache. Stale driver locations automatically expire after 30 seconds.',
    measurableCriteria:
      'Redis GEOADD latency < 5ms under 5000 updates/sec. Stale drivers (> 30s without heartbeat) automatically purged from geospatial radius search.',
    applicableCategories: [TestCategory.API, TestCategory.FIELD],
    testImplementationReference: 'apps/api/test/telemetry-redis.spec.ts',
    humanOwner: {
      name: 'Suresh Babu',
      role: 'Cloud Infrastructure & SRE Lead',
      department: 'Infrastructure',
      signOffStage: 'Telemetry Scalability & Reliability Sign-Off',
    },
  },
];
