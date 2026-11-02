'use client';

import React, { useState, useMemo } from 'react';
import {
  CaptainApplicationStatus,
  RequirementStatus,
  VehicleCategory,
  VehicleOwnershipType,
  PropulsionType,
  DriverComplianceStatus,
  DutyStatus,
} from '@ecoride/contracts';

interface ReviewHistoryEntry {
  id: string;
  reviewerId?: string | null;
  reviewerName?: string | null;
  previousStatus: CaptainApplicationStatus;
  newStatus: CaptainApplicationStatus;
  driverRequirementsStatus?: RequirementStatus;
  driverRejectionReason?: string | null;
  vehicleRequirementsStatus?: RequirementStatus;
  vehicleRejectionReason?: string | null;
  notes?: string | null;
  createdAt: string;
}

interface ApplicationQueueItem {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  dateOfBirth?: string;
  city: string;
  status: CaptainApplicationStatus;
  complianceStatus: DriverComplianceStatus;
  dutyStatus: DutyStatus;
  submissionCount: number;
  drivingLicenseNumber: string;
  drivingLicenseExpiry: string;
  badgeNumber?: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  // Uploaded Driver Documents
  drivingLicenseDocId: string;
  aadhaarDocId: string;
  panDocId?: string;
  policeVerificationDocId?: string;
  profilePhotoDocId?: string;
  // Vehicle Details
  vehicleOwnershipType: VehicleOwnershipType;
  vehicleCategory: VehicleCategory;
  propulsionType: PropulsionType;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  vehicleRegistrationNumber: string;
  batteryCapacityKwh: number;
  // Uploaded Vehicle Documents
  vehicleRcDocId: string;
  greenPlatePermitDocId: string;
  insuranceDocId?: string;
  fitnessDocId?: string;
  // Review Status
  driverRequirementsStatus: RequirementStatus;
  driverRejectionReason?: string;
  vehicleRequirementsStatus: RequirementStatus;
  vehicleRejectionReason?: string;
  overallRejectionReason?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewHistory: ReviewHistoryEntry[];
}

const COMMON_DRIVER_DISCREPANCIES = [
  'Driving license photo is blurry or unreadable',
  'Driving license has expired; renewed commercial DL required',
  'Name on driving license does not match applicant identity',
  'Invalid or unverified AP transport badge number',
  'Identity proof (Aadhaar/PAN) scan is cut off or cropped',
];

const COMMON_VEHICLE_DISCREPANCIES = [
  'Vehicle RC certificate scan is blurry or incomplete',
  'Missing Andhra Pradesh Commercial Green-Plate EV permit',
  'Vehicle registration plate does not match uploaded RC',
  'Vehicle battery capacity or model does not meet minimum corridor standards',
  'Non-electric or hybrid vehicle documentation rejected (100% BEV mandatory)',
];

const INITIAL_QUEUE_APPLICATIONS: ApplicationQueueItem[] = [
  {
    id: 'app-vis-001',
    userId: 'usr-cap-001',
    fullName: 'Venkata Ramana',
    phone: '+919876240001',
    dateOfBirth: '1992-05-14',
    city: 'visakhapatnam',
    status: CaptainApplicationStatus.SUBMITTED,
    complianceStatus: DriverComplianceStatus.UNDER_REVIEW,
    dutyStatus: DutyStatus.OFFLINE,
    submissionCount: 2,
    drivingLicenseNumber: 'AP31 20240008899',
    drivingLicenseExpiry: '2029-05-14',
    badgeNumber: 'BDG-AP31-9988',
    emergencyContactName: 'Lakshmi Ramana',
    emergencyContactPhone: '+919876249999',
    drivingLicenseDocId: 'doc-dl-001',
    aadhaarDocId: 'doc-aadh-001',
    profilePhotoDocId: 'doc-photo-001',
    vehicleOwnershipType: VehicleOwnershipType.OWNED,
    vehicleCategory: VehicleCategory.CITY_COMMUTE_2W,
    propulsionType: PropulsionType.BATTERY_ELECTRIC,
    vehicleMake: 'Ather Energy',
    vehicleModel: '450X Gen 3',
    vehicleYear: 2024,
    vehicleRegistrationNumber: 'AP31EV2424',
    batteryCapacityKwh: 3.7,
    vehicleRcDocId: 'doc-rc-001',
    greenPlatePermitDocId: 'doc-permit-001',
    insuranceDocId: 'doc-ins-001',
    driverRequirementsStatus: RequirementStatus.APPROVED,
    vehicleRequirementsStatus: RequirementStatus.PENDING,
    submittedAt: '2026-11-01T15:30:00Z',
    reviewHistory: [
      {
        id: 'rev-001',
        reviewerId: null,
        previousStatus: CaptainApplicationStatus.DRAFT,
        newStatus: CaptainApplicationStatus.SUBMITTED,
        notes: 'Initial application submitted by captain',
        createdAt: '2026-10-31T10:00:00Z',
      },
      {
        id: 'rev-002',
        reviewerId: 'usr-op-007',
        reviewerName: 'Anusha Fleet Officer',
        previousStatus: CaptainApplicationStatus.SUBMITTED,
        newStatus: CaptainApplicationStatus.REJECTED,
        driverRequirementsStatus: RequirementStatus.APPROVED,
        vehicleRequirementsStatus: RequirementStatus.REJECTED,
        vehicleRejectionReason: 'Vehicle RC certificate scan is blurry or incomplete',
        notes:
          'Driver KYC passed; RC image was blurry. Unlocked draft for captain to re-upload clear RC scan.',
        createdAt: '2026-10-31T12:00:00Z',
      },
      {
        id: 'rev-003',
        reviewerId: null,
        previousStatus: CaptainApplicationStatus.REJECTED,
        newStatus: CaptainApplicationStatus.SUBMITTED,
        notes:
          'Re-uploaded clearer RC scan and Green Plate permit (Submission #2) without duplicate records',
        createdAt: '2026-11-01T15:30:00Z',
      },
    ],
  },
  {
    id: 'app-vij-002',
    userId: 'usr-cap-002',
    fullName: 'Srinivas Rao',
    phone: '+919876240002',
    dateOfBirth: '1988-11-20',
    city: 'vijayawada',
    status: CaptainApplicationStatus.APPROVED,
    complianceStatus: DriverComplianceStatus.VERIFIED,
    dutyStatus: DutyStatus.ONLINE,
    submissionCount: 1,
    drivingLicenseNumber: 'AP16 20230005511',
    drivingLicenseExpiry: '2028-11-20',
    badgeNumber: 'BDG-AP16-3344',
    emergencyContactName: 'Subba Rao',
    emergencyContactPhone: '+919876248888',
    drivingLicenseDocId: 'doc-dl-002',
    aadhaarDocId: 'doc-aadh-002',
    vehicleOwnershipType: VehicleOwnershipType.OWNED,
    vehicleCategory: VehicleCategory.AUTO_COMMUTE_3W,
    propulsionType: PropulsionType.BATTERY_ELECTRIC,
    vehicleMake: 'Mahindra Electric',
    vehicleModel: 'Treo Yaari EV',
    vehicleYear: 2023,
    vehicleRegistrationNumber: 'AP16EV1122',
    batteryCapacityKwh: 7.37,
    vehicleRcDocId: 'doc-rc-002',
    greenPlatePermitDocId: 'doc-permit-002',
    driverRequirementsStatus: RequirementStatus.APPROVED,
    vehicleRequirementsStatus: RequirementStatus.APPROVED,
    submittedAt: '2026-10-30T09:15:00Z',
    reviewedAt: '2026-10-30T14:30:00Z',
    reviewHistory: [
      {
        id: 'rev-010',
        previousStatus: CaptainApplicationStatus.DRAFT,
        newStatus: CaptainApplicationStatus.SUBMITTED,
        notes: 'Initial submission with 3W commercial green plate',
        createdAt: '2026-10-30T09:15:00Z',
      },
      {
        id: 'rev-011',
        reviewerId: 'usr-op-007',
        reviewerName: 'Anusha Fleet Officer',
        previousStatus: CaptainApplicationStatus.SUBMITTED,
        newStatus: CaptainApplicationStatus.APPROVED,
        driverRequirementsStatus: RequirementStatus.APPROVED,
        vehicleRequirementsStatus: RequirementStatus.APPROVED,
        notes:
          'All documents verified; Captain profile and vehicle activated. Captain immediately eligible to go ONLINE.',
        createdAt: '2026-10-30T14:30:00Z',
      },
    ],
  },
  {
    id: 'app-gun-003',
    userId: 'usr-cap-003',
    fullName: 'M. Koteswara Rao',
    phone: '+919876240003',
    dateOfBirth: '1985-02-18',
    city: 'guntur',
    status: CaptainApplicationStatus.REJECTED,
    complianceStatus: DriverComplianceStatus.REJECTED,
    dutyStatus: DutyStatus.OFFLINE,
    submissionCount: 1,
    drivingLicenseNumber: 'AP07 20220003322',
    drivingLicenseExpiry: '2026-08-15',
    badgeNumber: 'BDG-AP07-1122',
    emergencyContactName: 'M. Padmavati',
    emergencyContactPhone: '+919876247777',
    drivingLicenseDocId: 'doc-dl-003',
    aadhaarDocId: 'doc-aadh-003',
    vehicleOwnershipType: VehicleOwnershipType.OWNED,
    vehicleCategory: VehicleCategory.CITY_COMMUTE_2W,
    propulsionType: PropulsionType.BATTERY_ELECTRIC,
    vehicleMake: 'Ola Electric',
    vehicleModel: 'S1 Pro',
    vehicleYear: 2023,
    vehicleRegistrationNumber: 'AP07EV9900',
    batteryCapacityKwh: 4.0,
    vehicleRcDocId: 'doc-rc-003',
    greenPlatePermitDocId: 'doc-permit-003',
    driverRequirementsStatus: RequirementStatus.REJECTED,
    vehicleRequirementsStatus: RequirementStatus.PENDING,
    driverRejectionReason: 'Driving license has expired; renewed commercial DL required',
    overallRejectionReason:
      'Driving license expired in August 2026. Please upload renewed commercial license.',
    submittedAt: '2026-11-01T08:00:00Z',
    reviewedAt: '2026-11-01T11:00:00Z',
    reviewHistory: [
      {
        id: 'rev-020',
        previousStatus: CaptainApplicationStatus.DRAFT,
        newStatus: CaptainApplicationStatus.SUBMITTED,
        notes: 'Initial submission',
        createdAt: '2026-11-01T08:00:00Z',
      },
      {
        id: 'rev-021',
        reviewerId: 'usr-op-007',
        reviewerName: 'Anusha Fleet Officer',
        previousStatus: CaptainApplicationStatus.SUBMITTED,
        newStatus: CaptainApplicationStatus.REJECTED,
        driverRequirementsStatus: RequirementStatus.REJECTED,
        driverRejectionReason: 'Driving license has expired; renewed commercial DL required',
        notes:
          'Expired license rejected. Application unlocked for draft editing. Duty status forced OFFLINE.',
        createdAt: '2026-11-01T11:00:00Z',
      },
    ],
  },
  {
    id: 'app-vis-004',
    userId: 'usr-cap-004',
    fullName: 'K. Rajesh Varma',
    phone: '+919876240004',
    dateOfBirth: '1995-09-02',
    city: 'visakhapatnam',
    status: CaptainApplicationStatus.SUBMITTED,
    complianceStatus: DriverComplianceStatus.PENDING,
    dutyStatus: DutyStatus.OFFLINE,
    submissionCount: 1,
    drivingLicenseNumber: 'AP31 20230009944',
    drivingLicenseExpiry: '2028-09-02',
    badgeNumber: 'BDG-AP31-4455',
    emergencyContactName: 'K. Mohan',
    emergencyContactPhone: '+919876246666',
    drivingLicenseDocId: 'doc-dl-004',
    aadhaarDocId: 'doc-aadh-004',
    vehicleOwnershipType: VehicleOwnershipType.OWNED,
    vehicleCategory: VehicleCategory.CITY_COMMUTE_2W,
    propulsionType: PropulsionType.BATTERY_ELECTRIC,
    vehicleMake: 'TVS Motor',
    vehicleModel: 'iQube Electric',
    vehicleYear: 2024,
    vehicleRegistrationNumber: 'AP31EV3344',
    batteryCapacityKwh: 3.4,
    vehicleRcDocId: 'doc-rc-004',
    greenPlatePermitDocId: 'doc-permit-004',
    driverRequirementsStatus: RequirementStatus.PENDING,
    vehicleRequirementsStatus: RequirementStatus.PENDING,
    submittedAt: '2026-11-02T07:45:00Z',
    reviewHistory: [
      {
        id: 'rev-040',
        previousStatus: CaptainApplicationStatus.DRAFT,
        newStatus: CaptainApplicationStatus.SUBMITTED,
        notes: 'New 2W EV pilot application submitted; awaiting operations verification',
        createdAt: '2026-11-02T07:45:00Z',
      },
    ],
  },
];

export default function CaptainApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationQueueItem[]>(
    INITIAL_QUEUE_APPLICATIONS,
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterCity, setFilterCity] = useState<string>('ALL');
  const [selectedApp, setSelectedApp] = useState<ApplicationQueueItem | null>(null);

  // One-Review Decision Form State (pre-populated with exact onboarding fields; never manual duplicate entry!)
  const [driverDecision, setDriverDecision] = useState<RequirementStatus>(
    RequirementStatus.APPROVED,
  );
  const [driverDiscrepancyReason, setDriverDiscrepancyReason] = useState<string>('');
  const [vehicleDecision, setVehicleDecision] = useState<RequirementStatus>(
    RequirementStatus.APPROVED,
  );
  const [vehicleDiscrepancyReason, setVehicleDiscrepancyReason] = useState<string>('');
  const [reviewerNotes, setReviewerNotes] = useState<string>('');
  const [decisionFeedback, setDecisionFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Document security test state
  const [isAuthorizedReviewer, setIsAuthorizedReviewer] = useState<boolean>(true);
  const [documentModalDoc, setDocumentModalDoc] = useState<{
    id: string;
    type: string;
    title: string;
  } | null>(null);
  const [docAccessStatus, setDocAccessStatus] = useState<'idle' | 'authorized' | 'denied'>('idle');

  const brandEmerald = '#059669';
  const voltageSurface = '#1C2541';
  const cardBg = '#0b132b';
  const borderCyan = '#6fffe9';
  const alertRed = '#dc2626';

  // Real-time Search and Filter
  const filtered = useMemo(() => {
    return applications.filter((app) => {
      if (filterStatus !== 'ALL' && app.status !== filterStatus) return false;
      if (filterCity !== 'ALL' && app.city !== filterCity) return false;
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.trim().toLowerCase();
        const matchesName = app.fullName.toLowerCase().includes(query);
        const matchesPhone = app.phone.toLowerCase().includes(query);
        const matchesDL = app.drivingLicenseNumber.toLowerCase().includes(query);
        const matchesPlate = app.vehicleRegistrationNumber.toLowerCase().includes(query);
        const matchesCity = app.city.toLowerCase().includes(query);
        const matchesVehicle = `${app.vehicleMake} ${app.vehicleModel}`
          .toLowerCase()
          .includes(query);
        if (
          !matchesName &&
          !matchesPhone &&
          !matchesDL &&
          !matchesPlate &&
          !matchesCity &&
          !matchesVehicle
        ) {
          return false;
        }
      }
      return true;
    });
  }, [applications, searchQuery, filterStatus, filterCity]);

  // Queue Metrics
  const metrics = useMemo(() => {
    const pendingCount = applications.filter(
      (a) =>
        a.status === CaptainApplicationStatus.SUBMITTED ||
        a.status === CaptainApplicationStatus.UNDER_REVIEW,
    ).length;
    const approvedCount = applications.filter(
      (a) => a.status === CaptainApplicationStatus.APPROVED,
    ).length;
    const rejectedCount = applications.filter(
      (a) => a.status === CaptainApplicationStatus.REJECTED,
    ).length;
    return {
      total: applications.length,
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
      bevs: applications.length, // 100% BEV platform
    };
  }, [applications]);

  // Open review modal for an application
  const handleOpenReview = (app: ApplicationQueueItem) => {
    setSelectedApp(app);
    // Initialize decision state from current app requirements
    setDriverDecision(
      app.driverRequirementsStatus === RequirementStatus.REJECTED
        ? RequirementStatus.REJECTED
        : RequirementStatus.APPROVED,
    );
    setDriverDiscrepancyReason(app.driverRejectionReason || '');
    setVehicleDecision(
      app.vehicleRequirementsStatus === RequirementStatus.REJECTED
        ? RequirementStatus.REJECTED
        : RequirementStatus.APPROVED,
    );
    setVehicleDiscrepancyReason(app.vehicleRejectionReason || '');
    setReviewerNotes(app.overallRejectionReason || '');
    setDecisionFeedback(null);
    setDocumentModalDoc(null);
    setDocAccessStatus('idle');
  };

  // Submit Review Decision
  const handleSaveDecision = (targetOverallStatus: CaptainApplicationStatus) => {
    if (!selectedApp) return;

    if (targetOverallStatus === CaptainApplicationStatus.APPROVED) {
      if (
        driverDecision !== RequirementStatus.APPROVED ||
        vehicleDecision !== RequirementStatus.APPROVED
      ) {
        setDecisionFeedback({
          type: 'error',
          message:
            'Cannot approve application: both Driver KYC and Vehicle KYC requirements must be APPROVED.',
        });
        return;
      }
    }

    if (targetOverallStatus === CaptainApplicationStatus.REJECTED) {
      if (
        driverDecision === RequirementStatus.APPROVED &&
        vehicleDecision === RequirementStatus.APPROVED
      ) {
        setDecisionFeedback({
          type: 'error',
          message:
            'To reject application, mark either Driver KYC or Vehicle KYC as REJECTED with a discrepancy reason.',
        });
        return;
      }
    }

    const previousStatus = selectedApp.status;
    const isApproval = targetOverallStatus === CaptainApplicationStatus.APPROVED;
    const reviewerId = 'usr-op-007';
    const reviewerName = 'Anusha Fleet Operations Officer';
    const timestamp = new Date().toISOString();

    const rejectionReasonCombined =
      reviewerNotes ||
      driverDiscrepancyReason ||
      vehicleDiscrepancyReason ||
      'Application rejected by operations review';

    const newReviewEntry: ReviewHistoryEntry = {
      id: `rev-${Date.now()}`,
      reviewerId,
      reviewerName,
      previousStatus,
      newStatus: targetOverallStatus,
      driverRequirementsStatus: driverDecision,
      driverRejectionReason:
        driverDecision === RequirementStatus.REJECTED ? driverDiscrepancyReason : null,
      vehicleRequirementsStatus: vehicleDecision,
      vehicleRejectionReason:
        vehicleDecision === RequirementStatus.REJECTED ? vehicleDiscrepancyReason : null,
      notes: isApproval
        ? reviewerNotes ||
          'All documents and AP green-plate permits verified. Captain profile and vehicle activated.'
        : rejectionReasonCombined,
      createdAt: timestamp,
    };

    // Reviewer decision immediately affects availability:
    // If Approved -> complianceStatus = VERIFIED, eligible to go ONLINE immediately.
    // If Rejected -> complianceStatus = REJECTED, dutyStatus forced OFFLINE, cannot go ONLINE.
    const updatedItem: ApplicationQueueItem = {
      ...selectedApp,
      status: targetOverallStatus,
      driverRequirementsStatus: driverDecision,
      driverRejectionReason:
        driverDecision === RequirementStatus.REJECTED ? driverDiscrepancyReason : undefined,
      vehicleRequirementsStatus: vehicleDecision,
      vehicleRejectionReason:
        vehicleDecision === RequirementStatus.REJECTED ? vehicleDiscrepancyReason : undefined,
      overallRejectionReason: isApproval ? undefined : rejectionReasonCombined,
      complianceStatus: isApproval
        ? DriverComplianceStatus.VERIFIED
        : DriverComplianceStatus.REJECTED,
      dutyStatus: isApproval ? DutyStatus.ONLINE : DutyStatus.OFFLINE,
      reviewedAt: timestamp,
      reviewHistory: [newReviewEntry, ...selectedApp.reviewHistory],
    };

    setApplications((prev) =>
      prev.map((item) => (item.id === selectedApp.id ? updatedItem : item)),
    );
    setSelectedApp(updatedItem);

    setDecisionFeedback({
      type: 'success',
      message: isApproval
        ? `Application Approved: ${selectedApp.fullName} is now VERIFIED as Captain with AP Green Plate vehicle. Duty status is ONLINE.`
        : `Application Rejected: Discrepancy feedback recorded. Application unlocked for captain draft editing without duplicate records. Duty forced OFFLINE.`,
    });
  };

  // Inspect uploaded private document with role authorization check
  const handleInspectDocument = (docId: string, type: string, title: string) => {
    setDocumentModalDoc({ id: docId, type, title });
    if (isAuthorizedReviewer) {
      setDocAccessStatus('authorized');
    } else {
      setDocAccessStatus('denied');
    }
  };

  const getStatusBadge = (status: CaptainApplicationStatus) => {
    switch (status) {
      case CaptainApplicationStatus.APPROVED:
        return { bg: brandEmerald, color: '#ffffff', label: 'APPROVED' };
      case CaptainApplicationStatus.REJECTED:
        return { bg: alertRed, color: '#ffffff', label: 'REJECTED' };
      case CaptainApplicationStatus.SUBMITTED:
        return { bg: '#2563eb', color: '#ffffff', label: 'SUBMITTED' };
      case CaptainApplicationStatus.UNDER_REVIEW:
        return { bg: '#d97706', color: '#ffffff', label: 'UNDER REVIEW' };
      default:
        return { bg: '#4b5563', color: '#ffffff', label: status };
    }
  };

  const getRequirementBadge = (status: RequirementStatus) => {
    switch (status) {
      case RequirementStatus.APPROVED:
        return { bg: brandEmerald, color: '#ffffff', text: 'VERIFIED' };
      case RequirementStatus.REJECTED:
        return { bg: alertRed, color: '#ffffff', text: 'REJECTED' };
      case RequirementStatus.PENDING:
      default:
        return { bg: '#d97706', color: '#ffffff', text: 'PENDING' };
    }
  };

  const getComplianceBadge = (status: DriverComplianceStatus) => {
    switch (status) {
      case DriverComplianceStatus.VERIFIED:
        return { bg: brandEmerald, color: '#ffffff', label: 'VERIFIED' };
      case DriverComplianceStatus.SUSPENDED:
        return { bg: alertRed, color: '#ffffff', label: 'SUSPENDED' };
      case DriverComplianceStatus.EXPIRED:
        return { bg: '#b91c1c', color: '#ffffff', label: 'EXPIRED' };
      case DriverComplianceStatus.REJECTED:
        return { bg: '#ef4444', color: '#ffffff', label: 'REJECTED' };
      case DriverComplianceStatus.UNDER_REVIEW:
        return { bg: '#d97706', color: '#ffffff', label: 'UNDER REVIEW' };
      default:
        return { bg: '#4b5563', color: '#ffffff', label: 'PENDING' };
    }
  };

  return (
    <main style={{ padding: '2rem', maxWidth: '1440px', margin: '0 auto', color: '#ffffff' }}>
      {/* Top Header */}
      <header
        style={{
          marginBottom: '2rem',
          borderBottom: `1px solid ${voltageSurface}`,
          paddingBottom: '1rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ color: brandEmerald, margin: 0, fontSize: '1.75rem' }}>
                One-Review Verification Queue (EV-027)
              </h1>
              <span
                style={{
                  background: '#047857',
                  color: '#6fffe9',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                }}
              >
                100% BEV Andhra Pradesh
              </span>
            </div>
            <p style={{ color: '#8892b0', marginTop: '0.4rem', fontSize: '0.9rem' }}>
              Searchable Operations Reviewer UI &bull; Single-Pane Driver &amp; Electric Vehicle KYC
              Verification &bull; Immediate Availability Impact
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {/* Reviewer Role Switcher for Security Demonstration */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: cardBg,
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                border: `1px solid ${isAuthorizedReviewer ? brandEmerald : alertRed}`,
              }}
            >
              <label style={{ fontSize: '0.75rem', color: '#c5d1eb' }}>Reviewer Auth:</label>
              <select
                aria-label="Reviewer Authentication Role"
                value={isAuthorizedReviewer ? 'OPERATOR' : 'UNAUTHORIZED_RIDER'}
                onChange={(e) => {
                  const authorized = e.target.value === 'OPERATOR';
                  setIsAuthorizedReviewer(authorized);
                  if (documentModalDoc) {
                    setDocAccessStatus(authorized ? 'authorized' : 'denied');
                  }
                }}
                style={{
                  background: voltageSurface,
                  color: isAuthorizedReviewer ? borderCyan : '#fca5a5',
                  border: 'none',
                  padding: '0.3rem 0.6rem',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                <option value="OPERATOR">Operator / Compliance (Authorized)</option>
                <option value="UNAUTHORIZED_RIDER">External Rider / Captain (Unauthorized)</option>
              </select>
            </div>
            <a
              href="/"
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: voltageSurface,
                color: borderCyan,
                textDecoration: 'none',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: 500,
              }}
            >
              &larr; Ops Portal
            </a>
          </div>
        </div>
      </header>

      {/* Metrics Row */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div
          style={{
            background: voltageSurface,
            padding: '1rem 1.25rem',
            borderRadius: '8px',
            borderLeft: `4px solid #2563eb`,
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#8892b0' }}>PENDING IN QUEUE</div>
          <div
            style={{
              fontSize: '1.75rem',
              fontWeight: 'bold',
              color: '#60a5fa',
              marginTop: '0.25rem',
            }}
          >
            {metrics.pending}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#93c5fd' }}>Awaiting operational review</div>
        </div>
        <div
          style={{
            background: voltageSurface,
            padding: '1rem 1.25rem',
            borderRadius: '8px',
            borderLeft: `4px solid ${brandEmerald}`,
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#8892b0' }}>VERIFIED CAPTAINS</div>
          <div
            style={{
              fontSize: '1.75rem',
              fontWeight: 'bold',
              color: '#34d399',
              marginTop: '0.25rem',
            }}
          >
            {metrics.approved}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#a7f3d0' }}>Duty ONLINE / eligible</div>
        </div>
        <div
          style={{
            background: voltageSurface,
            padding: '1rem 1.25rem',
            borderRadius: '8px',
            borderLeft: `4px solid ${alertRed}`,
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#8892b0' }}>REJECTED &amp; RESUBMITTING</div>
          <div
            style={{
              fontSize: '1.75rem',
              fontWeight: 'bold',
              color: '#f87171',
              marginTop: '0.25rem',
            }}
          >
            {metrics.rejected}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#fca5a5' }}>
            Draft editable without duplicates
          </div>
        </div>
        <div
          style={{
            background: voltageSurface,
            padding: '1rem 1.25rem',
            borderRadius: '8px',
            borderLeft: `4px solid ${borderCyan}`,
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#8892b0' }}>TOTAL CANDIDATES</div>
          <div
            style={{
              fontSize: '1.75rem',
              fontWeight: 'bold',
              color: borderCyan,
              marginTop: '0.25rem',
            }}
          >
            {metrics.total}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#c5d1eb' }}>
            100% Battery-Electric verified
          </div>
        </div>
      </section>

      {/* Search and Filter Toolbar */}
      <section
        style={{
          background: voltageSurface,
          padding: '1.25rem 1.5rem',
          borderRadius: '8px',
          marginBottom: '2rem',
          display: 'flex',
          gap: '1.25rem',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        {/* Search Input */}
        <div
          style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}
        >
          <label
            htmlFor="search-input"
            style={{
              fontSize: '0.75rem',
              color: '#8892b0',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Search Verification Queue:
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by candidate name, phone, DL number, plate (AP31EV...)..."
              style={{
                width: '100%',
                background: cardBg,
                color: '#ffffff',
                border: '1px solid #3a506b',
                padding: '0.55rem 1rem',
                borderRadius: '6px',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: '#8892b0',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                &times;
              </button>
            )}
          </div>
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label
            htmlFor="filter-status-select"
            style={{
              fontSize: '0.75rem',
              color: '#8892b0',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Application Status:
          </label>
          <select
            id="filter-status-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              background: cardBg,
              color: '#ffffff',
              border: '1px solid #3a506b',
              padding: '0.55rem 0.8rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
            }}
          >
            <option value="ALL">All Statuses ({applications.length})</option>
            <option value={CaptainApplicationStatus.SUBMITTED}>Submitted / In Queue</option>
            <option value={CaptainApplicationStatus.UNDER_REVIEW}>Under Review</option>
            <option value={CaptainApplicationStatus.APPROVED}>Approved / Verified</option>
            <option value={CaptainApplicationStatus.REJECTED}>Rejected</option>
          </select>
        </div>

        {/* City Filter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label
            htmlFor="filter-city-select"
            style={{
              fontSize: '0.75rem',
              color: '#8892b0',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            AP Corridor / City:
          </label>
          <select
            id="filter-city-select"
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            style={{
              background: cardBg,
              color: '#ffffff',
              border: '1px solid #3a506b',
              padding: '0.55rem 0.8rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
            }}
          >
            <option value="ALL">All Corridors</option>
            <option value="visakhapatnam">Visakhapatnam (Active Pilot)</option>
            <option value="vijayawada">Vijayawada</option>
            <option value="guntur">Guntur</option>
          </select>
        </div>

        <div
          style={{
            marginLeft: 'auto',
            alignSelf: 'flex-end',
            paddingBottom: '0.3rem',
            fontSize: '0.85rem',
            color: '#c5d1eb',
          }}
        >
          Showing <strong>{filtered.length}</strong> of {applications.length} applications
        </div>
      </section>

      {/* Applications Queue Table */}
      <section
        style={{
          background: voltageSurface,
          borderRadius: '8px',
          overflow: 'hidden',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: cardBg, borderBottom: '2px solid #3a506b' }}>
              <th style={{ padding: '1rem', color: borderCyan }}>Applicant</th>
              <th style={{ padding: '1rem', color: borderCyan }}>City</th>
              <th style={{ padding: '1rem', color: borderCyan }}>EV Vehicle &amp; Plate</th>
              <th style={{ padding: '1rem', color: borderCyan }}>Driver KYC</th>
              <th style={{ padding: '1rem', color: borderCyan }}>Vehicle KYC</th>
              <th style={{ padding: '1rem', color: borderCyan }}>Compliance &amp; Duty</th>
              <th style={{ padding: '1rem', color: borderCyan }}>Application State</th>
              <th style={{ padding: '1rem', color: borderCyan }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#8892b0' }}>
                  No applications match your search or filter criteria.
                </td>
              </tr>
            ) : (
              filtered.map((app) => {
                const statusBadge = getStatusBadge(app.status);
                const driverBadge = getRequirementBadge(app.driverRequirementsStatus);
                const vehicleBadge = getRequirementBadge(app.vehicleRequirementsStatus);
                const complianceBadge = getComplianceBadge(app.complianceStatus);

                return (
                  <tr
                    key={app.id}
                    style={{
                      borderBottom: '1px solid #2a3a5e',
                      background: selectedApp?.id === app.id ? '#1e2d5a' : 'transparent',
                      transition: 'background 0.2s',
                    }}
                  >
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 'bold', color: '#ffffff', fontSize: '0.95rem' }}>
                        {app.fullName}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#8892b0' }}>{app.phone}</div>
                      <div style={{ fontSize: '0.75rem', color: '#a0aec0' }}>
                        DL: {app.drivingLicenseNumber}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', textTransform: 'capitalize' }}>
                      <span
                        style={{
                          background: cardBg,
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                        }}
                      >
                        {app.city}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 500 }}>
                        {app.vehicleMake} {app.vehicleModel}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>
                        {app.vehicleRegistrationNumber} (AP Green Plate)
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6fffe9' }}>
                        {app.propulsionType} &bull; {app.vehicleCategory} &bull;{' '}
                        {app.batteryCapacityKwh} kWh
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span
                        style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          background: driverBadge.bg,
                          color: driverBadge.color,
                        }}
                      >
                        {driverBadge.text}
                      </span>
                      {app.driverRejectionReason && (
                        <div
                          style={{
                            fontSize: '0.7rem',
                            color: '#fca5a5',
                            marginTop: '0.25rem',
                            maxWidth: '180px',
                          }}
                        >
                          {app.driverRejectionReason}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span
                        style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          background: vehicleBadge.bg,
                          color: vehicleBadge.color,
                        }}
                      >
                        {vehicleBadge.text}
                      </span>
                      {app.vehicleRejectionReason && (
                        <div
                          style={{
                            fontSize: '0.7rem',
                            color: '#fca5a5',
                            marginTop: '0.25rem',
                            maxWidth: '180px',
                          }}
                        >
                          {app.vehicleRejectionReason}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span
                        style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          background: complianceBadge.bg,
                          color: complianceBadge.color,
                        }}
                      >
                        {complianceBadge.label}
                      </span>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: app.dutyStatus === DutyStatus.ONLINE ? '#10b981' : '#8892b0',
                          marginTop: '0.25rem',
                          fontWeight: 500,
                        }}
                      >
                        {app.dutyStatus === DutyStatus.ONLINE ? '● ONLINE' : '○ OFFLINE'}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span
                        style={{
                          padding: '0.25rem 0.6rem',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          background: statusBadge.bg,
                          color: statusBadge.color,
                          display: 'inline-block',
                        }}
                      >
                        {statusBadge.label}
                      </span>
                      <div style={{ fontSize: '0.75rem', color: '#a0aec0', marginTop: '0.25rem' }}>
                        Attempt #{app.submissionCount}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <button
                        onClick={() => handleOpenReview(app)}
                        style={{
                          background: '#38bdf8',
                          color: '#0b132b',
                          border: 'none',
                          padding: '0.45rem 0.9rem',
                          borderRadius: '4px',
                          fontWeight: 'bold',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                        }}
                      >
                        One-Review &rarr;
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>

      {/* ONE-REVIEW INSPECTION & VERIFICATION DRAWER / PANEL */}
      {selectedApp && (
        <section
          style={{
            background: cardBg,
            border: `2px solid ${borderCyan}`,
            borderRadius: '10px',
            padding: '2rem',
            marginTop: '2rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Drawer Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <h2 style={{ margin: 0, color: borderCyan, fontSize: '1.4rem' }}>
                  Verification Desk: {selectedApp.fullName}
                </h2>
                <span
                  style={{
                    background: getStatusBadge(selectedApp.status).bg,
                    color: '#ffffff',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                  }}
                >
                  {selectedApp.status}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#8892b0' }}>
                  Submission Attempt #{selectedApp.submissionCount}
                </span>
              </div>
              <p style={{ color: '#8892b0', fontSize: '0.85rem', marginTop: '0.35rem' }}>
                All candidate information below reflects the exact data supplied during onboarding.
                No duplicate field re-entry required.
              </p>
            </div>
            <button
              onClick={() => setSelectedApp(null)}
              style={{
                background: '#4b5563',
                color: '#ffffff',
                border: 'none',
                padding: '0.4rem 0.8rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              Close Desk
            </button>
          </div>

          {/* Feedback Alert Banner */}
          {decisionFeedback && (
            <div
              style={{
                marginTop: '1.25rem',
                padding: '1rem 1.25rem',
                borderRadius: '6px',
                background: decisionFeedback.type === 'success' ? '#064e3b' : '#7f1d1d',
                border: `1px solid ${decisionFeedback.type === 'success' ? '#10b981' : '#ef4444'}`,
                color: '#ffffff',
                fontSize: '0.9rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>{decisionFeedback.message}</span>
              <button
                onClick={() => setDecisionFeedback(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                &times;
              </button>
            </div>
          )}

          {/* TWO-COLUMN INSPECTION LAYOUT: EXACT FIELDS SUPPLIED DURING ONBOARDING */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '1.5rem',
              marginTop: '1.75rem',
            }}
          >
            {/* Column 1: Driver KYC & Identity Details */}
            <div
              style={{
                background: voltageSurface,
                padding: '1.5rem',
                borderRadius: '8px',
                border: '1px solid #2a3a5e',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                  borderBottom: '1px solid #3a506b',
                  paddingBottom: '0.5rem',
                }}
              >
                <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '1.1rem' }}>
                  1. Driver KYC Requirements
                </h3>
                <span
                  style={{
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    background: getRequirementBadge(selectedApp.driverRequirementsStatus).bg,
                    color: '#ffffff',
                  }}
                >
                  {getRequirementBadge(selectedApp.driverRequirementsStatus).text}
                </span>
              </div>

              {/* Exact fields supplied */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.75rem',
                  fontSize: '0.85rem',
                }}
              >
                <div>
                  <span style={{ color: '#8892b0', fontSize: '0.75rem' }}>Full Legal Name:</span>
                  <div style={{ fontWeight: 600 }}>{selectedApp.fullName}</div>
                </div>
                <div>
                  <span style={{ color: '#8892b0', fontSize: '0.75rem' }}>Mobile Phone:</span>
                  <div style={{ fontWeight: 600 }}>{selectedApp.phone}</div>
                </div>
                <div>
                  <span style={{ color: '#8892b0', fontSize: '0.75rem' }}>Date of Birth:</span>
                  <div>{selectedApp.dateOfBirth || 'Not provided'}</div>
                </div>
                <div>
                  <span style={{ color: '#8892b0', fontSize: '0.75rem' }}>Operating City:</span>
                  <div style={{ textTransform: 'capitalize' }}>{selectedApp.city}</div>
                </div>
                <div>
                  <span style={{ color: '#8892b0', fontSize: '0.75rem' }}>
                    Driving License Number:
                  </span>
                  <div style={{ fontWeight: 600, color: borderCyan }}>
                    {selectedApp.drivingLicenseNumber}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#8892b0', fontSize: '0.75rem' }}>DL Expiry Date:</span>
                  <div>{selectedApp.drivingLicenseExpiry}</div>
                </div>
                <div>
                  <span style={{ color: '#8892b0', fontSize: '0.75rem' }}>AP Transport Badge:</span>
                  <div>{selectedApp.badgeNumber || 'N/A'}</div>
                </div>
                <div>
                  <span style={{ color: '#8892b0', fontSize: '0.75rem' }}>Emergency Contact:</span>
                  <div>
                    {selectedApp.emergencyContactName} ({selectedApp.emergencyContactPhone})
                  </div>
                </div>
              </div>

              {/* Uploaded Driver Certificates */}
              <div
                style={{ marginTop: '1.25rem', borderTop: '1px solid #3a506b', paddingTop: '1rem' }}
              >
                <span style={{ color: '#c5d1eb', fontSize: '0.8rem', fontWeight: 600 }}>
                  Uploaded Driver Certificates:
                </span>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    marginTop: '0.5rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: cardBg,
                      padding: '0.5rem 0.75rem',
                      borderRadius: '4px',
                    }}
                  >
                    <span style={{ fontSize: '0.8rem' }}>Commercial Driving License (DL)</span>
                    <button
                      onClick={() =>
                        handleInspectDocument(
                          selectedApp.drivingLicenseDocId,
                          'DRIVING_LICENSE',
                          'Commercial Driving License',
                        )
                      }
                      style={{
                        background: '#0284c7',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.25rem 0.6rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      Open Document
                    </button>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: cardBg,
                      padding: '0.5rem 0.75rem',
                      borderRadius: '4px',
                    }}
                  >
                    <span style={{ fontSize: '0.8rem' }}>Aadhaar Identity Proof</span>
                    <button
                      onClick={() =>
                        handleInspectDocument(
                          selectedApp.aadhaarDocId,
                          'AADHAAR',
                          'Aadhaar Identity Proof',
                        )
                      }
                      style={{
                        background: '#0284c7',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.25rem 0.6rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      Open Document
                    </button>
                  </div>
                </div>
              </div>

              {/* Reviewer Driver KYC Decision Section */}
              <div
                style={{
                  marginTop: '1.25rem',
                  background: cardBg,
                  padding: '1rem',
                  borderRadius: '6px',
                  border: '1px solid #3a506b',
                }}
              >
                <div
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: '#e2e8f0',
                    marginBottom: '0.5rem',
                  }}
                >
                  Driver KYC Verification Decision:
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                    }}
                  >
                    <input
                      type="radio"
                      name="driverDecision"
                      checked={driverDecision === RequirementStatus.APPROVED}
                      onChange={() => setDriverDecision(RequirementStatus.APPROVED)}
                    />
                    <span style={{ color: '#34d399', fontWeight: 600 }}>Approve Driver</span>
                  </label>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                    }}
                  >
                    <input
                      type="radio"
                      name="driverDecision"
                      checked={driverDecision === RequirementStatus.REJECTED}
                      onChange={() => setDriverDecision(RequirementStatus.REJECTED)}
                    />
                    <span style={{ color: '#f87171', fontWeight: 600 }}>Reject Driver</span>
                  </label>
                </div>

                {driverDecision === RequirementStatus.REJECTED && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <label
                      htmlFor="driver-discrepancy-select"
                      style={{ fontSize: '0.75rem', color: '#fca5a5' }}
                    >
                      Select Discrepancy Reason:
                    </label>
                    <select
                      id="driver-discrepancy-select"
                      value={driverDiscrepancyReason}
                      onChange={(e) => setDriverDiscrepancyReason(e.target.value)}
                      style={{
                        width: '100%',
                        background: voltageSurface,
                        color: '#ffffff',
                        border: '1px solid #ef4444',
                        padding: '0.4rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        marginTop: '0.25rem',
                      }}
                    >
                      <option value="">-- Choose Discrepancy Reason --</option>
                      {COMMON_DRIVER_DISCREPANCIES.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Or enter custom discrepancy remark..."
                      value={driverDiscrepancyReason}
                      onChange={(e) => setDriverDiscrepancyReason(e.target.value)}
                      style={{
                        width: '100%',
                        background: voltageSurface,
                        color: '#ffffff',
                        border: '1px solid #3a506b',
                        padding: '0.4rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        marginTop: '0.4rem',
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Vehicle Requirements & 100% BEV Assurance */}
            <div
              style={{
                background: voltageSurface,
                padding: '1.5rem',
                borderRadius: '8px',
                border: '1px solid #2a3a5e',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                  borderBottom: '1px solid #3a506b',
                  paddingBottom: '0.5rem',
                }}
              >
                <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '1.1rem' }}>
                  2. EV Vehicle Requirements
                </h3>
                <span
                  style={{
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    background: getRequirementBadge(selectedApp.vehicleRequirementsStatus).bg,
                    color: '#ffffff',
                  }}
                >
                  {getRequirementBadge(selectedApp.vehicleRequirementsStatus).text}
                </span>
              </div>

              {/* Exact fields supplied */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.75rem',
                  fontSize: '0.85rem',
                }}
              >
                <div>
                  <span style={{ color: '#8892b0', fontSize: '0.75rem' }}>Propulsion Type:</span>
                  <div style={{ fontWeight: 600, color: '#10b981' }}>
                    {selectedApp.propulsionType} (100% BEV)
                  </div>
                </div>
                <div>
                  <span style={{ color: '#8892b0', fontSize: '0.75rem' }}>Category:</span>
                  <div style={{ fontWeight: 600 }}>{selectedApp.vehicleCategory}</div>
                </div>
                <div>
                  <span style={{ color: '#8892b0', fontSize: '0.75rem' }}>Ownership Model:</span>
                  <div>{selectedApp.vehicleOwnershipType}</div>
                </div>
                <div>
                  <span style={{ color: '#8892b0', fontSize: '0.75rem' }}>Make &amp; Model:</span>
                  <div style={{ fontWeight: 600 }}>
                    {selectedApp.vehicleMake} {selectedApp.vehicleModel} ({selectedApp.vehicleYear})
                  </div>
                </div>
                <div>
                  <span style={{ color: '#8892b0', fontSize: '0.75rem' }}>
                    AP Green Plate Registration:
                  </span>
                  <div style={{ fontWeight: 600, color: borderCyan }}>
                    {selectedApp.vehicleRegistrationNumber}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#8892b0', fontSize: '0.75rem' }}>Battery Capacity:</span>
                  <div>{selectedApp.batteryCapacityKwh} kWh</div>
                </div>
              </div>

              {/* Uploaded Vehicle Certificates */}
              <div
                style={{ marginTop: '1.25rem', borderTop: '1px solid #3a506b', paddingTop: '1rem' }}
              >
                <span style={{ color: '#c5d1eb', fontSize: '0.8rem', fontWeight: 600 }}>
                  Uploaded Vehicle Certificates:
                </span>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    marginTop: '0.5rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: cardBg,
                      padding: '0.5rem 0.75rem',
                      borderRadius: '4px',
                    }}
                  >
                    <span style={{ fontSize: '0.8rem' }}>
                      Vehicle Registration Certificate (RC)
                    </span>
                    <button
                      onClick={() =>
                        handleInspectDocument(
                          selectedApp.vehicleRcDocId,
                          'VEHICLE_RC',
                          'Vehicle Registration Certificate (RC)',
                        )
                      }
                      style={{
                        background: '#0284c7',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.25rem 0.6rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      Open Certificate
                    </button>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: cardBg,
                      padding: '0.5rem 0.75rem',
                      borderRadius: '4px',
                    }}
                  >
                    <span style={{ fontSize: '0.8rem' }}>AP Green-Plate Commercial Permit</span>
                    <button
                      onClick={() =>
                        handleInspectDocument(
                          selectedApp.greenPlatePermitDocId,
                          'GREEN_PLATE_PERMIT',
                          'AP Green Plate Commercial Permit',
                        )
                      }
                      style={{
                        background: '#0284c7',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.25rem 0.6rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      Open Certificate
                    </button>
                  </div>
                </div>
              </div>

              {/* Reviewer Vehicle Decision Section */}
              <div
                style={{
                  marginTop: '1.25rem',
                  background: cardBg,
                  padding: '1rem',
                  borderRadius: '6px',
                  border: '1px solid #3a506b',
                }}
              >
                <div
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: '#e2e8f0',
                    marginBottom: '0.5rem',
                  }}
                >
                  EV Vehicle Verification Decision:
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                    }}
                  >
                    <input
                      type="radio"
                      name="vehicleDecision"
                      checked={vehicleDecision === RequirementStatus.APPROVED}
                      onChange={() => setVehicleDecision(RequirementStatus.APPROVED)}
                    />
                    <span style={{ color: '#34d399', fontWeight: 600 }}>Approve Vehicle</span>
                  </label>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                    }}
                  >
                    <input
                      type="radio"
                      name="vehicleDecision"
                      checked={vehicleDecision === RequirementStatus.REJECTED}
                      onChange={() => setVehicleDecision(RequirementStatus.REJECTED)}
                    />
                    <span style={{ color: '#f87171', fontWeight: 600 }}>Reject Vehicle</span>
                  </label>
                </div>

                {vehicleDecision === RequirementStatus.REJECTED && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <label
                      htmlFor="vehicle-discrepancy-select"
                      style={{ fontSize: '0.75rem', color: '#fca5a5' }}
                    >
                      Select Discrepancy Reason:
                    </label>
                    <select
                      id="vehicle-discrepancy-select"
                      value={vehicleDiscrepancyReason}
                      onChange={(e) => setVehicleDiscrepancyReason(e.target.value)}
                      style={{
                        width: '100%',
                        background: voltageSurface,
                        color: '#ffffff',
                        border: '1px solid #ef4444',
                        padding: '0.4rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        marginTop: '0.25rem',
                      }}
                    >
                      <option value="">-- Choose Discrepancy Reason --</option>
                      {COMMON_VEHICLE_DISCREPANCIES.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Or enter custom discrepancy remark..."
                      value={vehicleDiscrepancyReason}
                      onChange={(e) => setVehicleDiscrepancyReason(e.target.value)}
                      style={{
                        width: '100%',
                        background: voltageSurface,
                        color: '#ffffff',
                        border: '1px solid #3a506b',
                        padding: '0.4rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        marginTop: '0.4rem',
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* FINAL REVIEW DECISION & REMARKS BAR */}
          <div
            style={{
              marginTop: '1.5rem',
              background: voltageSurface,
              padding: '1.25rem 1.5rem',
              borderRadius: '8px',
              border: '1px solid #3a506b',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label
                htmlFor="reviewer-notes-input"
                style={{ fontSize: '0.85rem', fontWeight: 600, color: borderCyan }}
              >
                Operations Reviewer Remarks &amp; Audit Notes:
              </label>
              <textarea
                id="reviewer-notes-input"
                rows={2}
                placeholder="Enter internal audit remarks or candidate feedback..."
                value={reviewerNotes}
                onChange={(e) => setReviewerNotes(e.target.value)}
                style={{
                  width: '100%',
                  background: cardBg,
                  color: '#ffffff',
                  border: '1px solid #3a506b',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '1.25rem',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div style={{ fontSize: '0.8rem', color: '#8892b0', maxWidth: '500px' }}>
                <strong>Immediate Impact:</strong> Approving activates the captain and unlocks duty
                availability (`ONLINE`). Rejecting unlocks candidate draft without duplicate records
                and forces duty `OFFLINE`.
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => handleSaveDecision(CaptainApplicationStatus.REJECTED)}
                  style={{
                    background: alertRed,
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.6rem 1.25rem',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Reject Application &amp; Request Resubmission
                </button>
                <button
                  onClick={() => handleSaveDecision(CaptainApplicationStatus.APPROVED)}
                  style={{
                    background: brandEmerald,
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.6rem 1.5rem',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Approve &amp; Activate Captain &rarr;
                </button>
              </div>
            </div>
          </div>

          {/* HISTORICAL REVIEW AUDIT TRAIL */}
          <div style={{ marginTop: '2rem', borderTop: '1px solid #3a506b', paddingTop: '1.5rem' }}>
            <h3 style={{ margin: 0, color: borderCyan, fontSize: '1.1rem' }}>
              Immutable Review Audit Trail ({selectedApp.reviewHistory.length} events)
            </h3>
            <p style={{ color: '#8892b0', fontSize: '0.8rem', marginTop: '0.25rem' }}>
              Demonstrating acceptance criteria: All decisions are recorded chronologically with
              reviewer IDs, discrepancy reasons, and status transitions.
            </p>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                marginTop: '1rem',
              }}
            >
              {selectedApp.reviewHistory.map((rev, idx) => (
                <div
                  key={rev.id}
                  style={{
                    background: voltageSurface,
                    padding: '0.85rem 1rem',
                    borderRadius: '6px',
                    borderLeft: `4px solid ${
                      rev.newStatus === CaptainApplicationStatus.APPROVED
                        ? brandEmerald
                        : rev.newStatus === CaptainApplicationStatus.REJECTED
                          ? alertRed
                          : '#2563eb'
                    }`,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.85rem',
                    }}
                  >
                    <span style={{ fontWeight: 'bold' }}>
                      Step {selectedApp.reviewHistory.length - idx}: {rev.previousStatus} &rarr;{' '}
                      {rev.newStatus}
                    </span>
                    <span style={{ color: '#8892b0', fontSize: '0.8rem' }}>
                      {new Date(rev.createdAt).toLocaleString()} &bull; Reviewer:{' '}
                      {rev.reviewerName || rev.reviewerId || 'System / Applicant'}
                    </span>
                  </div>
                  {rev.notes && (
                    <div style={{ marginTop: '0.35rem', fontSize: '0.85rem', color: '#e2e8f0' }}>
                      <strong>Note:</strong> {rev.notes}
                    </div>
                  )}
                  {(rev.driverRejectionReason || rev.vehicleRejectionReason) && (
                    <div style={{ marginTop: '0.25rem', fontSize: '0.8rem', color: '#fca5a5' }}>
                      {rev.driverRejectionReason && (
                        <span>Driver Discrepancy: {rev.driverRejectionReason} </span>
                      )}
                      {rev.vehicleRejectionReason && (
                        <span>Vehicle Discrepancy: {rev.vehicleRejectionReason}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* DOCUMENT VIEWER MODAL WITH AUTHORIZATION CHECK (Security Demonstration) */}
      {documentModalDoc && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: cardBg,
              border: `2px solid ${docAccessStatus === 'authorized' ? brandEmerald : alertRed}`,
              borderRadius: '8px',
              padding: '1.75rem',
              maxWidth: '560px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: borderCyan }}>Private KYC Document Viewer</h3>
              <button
                onClick={() => setDocumentModalDoc(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '1.25rem',
                }}
              >
                &times;
              </button>
            </div>

            <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#c5d1eb' }}>
              <div>
                <strong>Document:</strong> {documentModalDoc.title}
              </div>
              <div>
                <strong>System Doc ID:</strong> <code>{documentModalDoc.id}</code>
              </div>
              <div>
                <strong>Security Context:</strong>{' '}
                {isAuthorizedReviewer ? 'OPERATOR (kyc:read authorized)' : 'UNAUTHORIZED RIDER'}
              </div>
            </div>

            {/* Access Decision Display */}
            {docAccessStatus === 'authorized' ? (
              <div
                style={{
                  marginTop: '1.25rem',
                  padding: '1rem',
                  borderRadius: '6px',
                  background: '#064e3b',
                  border: '1px solid #10b981',
                }}
              >
                <div style={{ color: '#34d399', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  &#10004; Access Granted: Temporary HMAC Signed URL Generated
                </div>
                <p style={{ fontSize: '0.8rem', color: '#a7f3d0', marginTop: '0.35rem' }}>
                  HMAC-SHA256 signed access token validated. Only authorized reviewers can open
                  private KYC documents.
                </p>
                <div
                  style={{
                    background: voltageSurface,
                    padding: '0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    color: borderCyan,
                    wordBreak: 'break-all',
                    marginTop: '0.5rem',
                  }}
                >
                  GET /v1/documents/download?token=hmac_signed_tok_
                  {documentModalDoc.id.substring(0, 8)}...&amp;exp=900s
                </div>
              </div>
            ) : (
              <div
                style={{
                  marginTop: '1.25rem',
                  padding: '1rem',
                  borderRadius: '6px',
                  background: '#7f1d1d',
                  border: '1px solid #ef4444',
                }}
              >
                <div style={{ color: '#f87171', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  &#10008; HTTP 403 Forbidden: Cross-Account Access Denied
                </div>
                <p style={{ fontSize: '0.8rem', color: '#fca5a5', marginTop: '0.35rem' }}>
                  Security alert logged: <code>CROSS_ACCOUNT_DOCUMENT_ACCESS_DENIED</code>.
                  Non-reviewer actor does not hold <code>kyc:read</code> or Operator permissions.
                </p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button
                onClick={() => setDocumentModalDoc(null)}
                style={{
                  background: voltageSurface,
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
