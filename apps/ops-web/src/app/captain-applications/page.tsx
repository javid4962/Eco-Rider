'use client';

import React, { useState } from 'react';
import {
  CaptainApplicationStatus,
  RequirementStatus,
  VehicleCategory,
  VehicleOwnershipType,
  PropulsionType,
} from '@ecoride/contracts';

interface MockApplicationItem {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  city: string;
  status: CaptainApplicationStatus;
  submissionCount: number;
  drivingLicenseNumber: string;
  vehicleRegistrationNumber: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleCategory: VehicleCategory;
  ownershipType: VehicleOwnershipType;
  propulsionType: PropulsionType;
  driverRequirementsStatus: RequirementStatus;
  vehicleRequirementsStatus: RequirementStatus;
  driverRejectionReason?: string;
  vehicleRejectionReason?: string;
  submittedAt: string;
  reviewHistory: Array<{
    id: string;
    previousStatus: CaptainApplicationStatus;
    newStatus: CaptainApplicationStatus;
    driverRequirementsStatus?: RequirementStatus;
    vehicleRequirementsStatus?: RequirementStatus;
    notes?: string;
    createdAt: string;
  }>;
}

const SAMPLE_APPLICATIONS: MockApplicationItem[] = [
  {
    id: 'app-vis-001',
    userId: 'usr-cap-001',
    fullName: 'Venkata Ramana',
    phone: '+919876240001',
    city: 'visakhapatnam',
    status: CaptainApplicationStatus.SUBMITTED,
    submissionCount: 2,
    drivingLicenseNumber: 'AP31 20240008899',
    vehicleRegistrationNumber: 'AP31EV2424',
    vehicleMake: 'Ather Energy',
    vehicleModel: '450X Gen 3',
    vehicleCategory: VehicleCategory.CITY_COMMUTE_2W,
    ownershipType: VehicleOwnershipType.OWNED,
    propulsionType: PropulsionType.BATTERY_ELECTRIC,
    driverRequirementsStatus: RequirementStatus.APPROVED,
    vehicleRequirementsStatus: RequirementStatus.PENDING,
    submittedAt: '2026-11-01T15:30:00Z',
    reviewHistory: [
      {
        id: 'rev-001',
        previousStatus: CaptainApplicationStatus.DRAFT,
        newStatus: CaptainApplicationStatus.SUBMITTED,
        notes: 'Initial submission by applicant',
        createdAt: '2026-10-31T10:00:00Z',
      },
      {
        id: 'rev-002',
        previousStatus: CaptainApplicationStatus.SUBMITTED,
        newStatus: CaptainApplicationStatus.REJECTED,
        driverRequirementsStatus: RequirementStatus.APPROVED,
        vehicleRequirementsStatus: RequirementStatus.REJECTED,
        notes: 'Driver KYC passed; RC image was blurry. Requested resubmission.',
        createdAt: '2026-10-31T12:00:00Z',
      },
      {
        id: 'rev-003',
        previousStatus: CaptainApplicationStatus.REJECTED,
        newStatus: CaptainApplicationStatus.SUBMITTED,
        notes: 'Re-uploaded clearer RC scan and Green Plate permit (Submission #2)',
        createdAt: '2026-11-01T15:30:00Z',
      },
    ],
  },
  {
    id: 'app-vij-002',
    userId: 'usr-cap-002',
    fullName: 'Srinivas Rao',
    phone: '+919876240002',
    city: 'vijayawada',
    status: CaptainApplicationStatus.APPROVED,
    submissionCount: 1,
    drivingLicenseNumber: 'AP16 20230005511',
    vehicleRegistrationNumber: 'AP16EV1122',
    vehicleMake: 'Mahindra Electric',
    vehicleModel: 'Treo Yaari EV',
    vehicleCategory: VehicleCategory.AUTO_COMMUTE_3W,
    ownershipType: VehicleOwnershipType.OWNED,
    propulsionType: PropulsionType.BATTERY_ELECTRIC,
    driverRequirementsStatus: RequirementStatus.APPROVED,
    vehicleRequirementsStatus: RequirementStatus.APPROVED,
    submittedAt: '2026-10-30T09:15:00Z',
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
        previousStatus: CaptainApplicationStatus.SUBMITTED,
        newStatus: CaptainApplicationStatus.APPROVED,
        driverRequirementsStatus: RequirementStatus.APPROVED,
        vehicleRequirementsStatus: RequirementStatus.APPROVED,
        notes: 'All documents verified; Captain profile and vehicle activated',
        createdAt: '2026-10-30T14:30:00Z',
      },
    ],
  },
  {
    id: 'app-gun-003',
    userId: 'usr-cap-003',
    fullName: 'M. Koteswara Rao',
    phone: '+919876240003',
    city: 'guntur',
    status: CaptainApplicationStatus.REJECTED,
    submissionCount: 1,
    drivingLicenseNumber: 'AP07 20220003322',
    vehicleRegistrationNumber: 'AP07EV9900',
    vehicleMake: 'Ola Electric',
    vehicleModel: 'S1 Pro',
    vehicleCategory: VehicleCategory.CITY_COMMUTE_2W,
    ownershipType: VehicleOwnershipType.OWNED,
    propulsionType: PropulsionType.BATTERY_ELECTRIC,
    driverRequirementsStatus: RequirementStatus.REJECTED,
    vehicleRequirementsStatus: RequirementStatus.PENDING,
    driverRejectionReason: 'Driving license expired in August 2026. Please upload renewed license.',
    submittedAt: '2026-11-01T08:00:00Z',
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
        previousStatus: CaptainApplicationStatus.SUBMITTED,
        newStatus: CaptainApplicationStatus.REJECTED,
        driverRequirementsStatus: RequirementStatus.REJECTED,
        notes: 'Expired license rejected. Application unlocked for draft editing.',
        createdAt: '2026-11-01T11:00:00Z',
      },
    ],
  },
];

export default function CaptainApplicationsPage() {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterCity, setFilterCity] = useState<string>('ALL');
  const [selectedApp, setSelectedApp] = useState<MockApplicationItem | null>(null);

  const brandEmerald = '#059669';
  const voltageSurface = '#1C2541';
  const cardBg = '#0b132b';
  const borderCyan = '#6fffe9';

  const filtered = SAMPLE_APPLICATIONS.filter((app) => {
    if (filterStatus !== 'ALL' && app.status !== filterStatus) return false;
    if (filterCity !== 'ALL' && app.city !== filterCity) return false;
    return true;
  });

  const getStatusBadge = (status: CaptainApplicationStatus) => {
    switch (status) {
      case CaptainApplicationStatus.APPROVED:
        return { bg: '#059669', color: '#ffffff', label: 'APPROVED' };
      case CaptainApplicationStatus.REJECTED:
        return { bg: '#dc2626', color: '#ffffff', label: 'REJECTED' };
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
        return { bg: '#059669', color: '#ffffff', text: 'VERIFIED' };
      case RequirementStatus.REJECTED:
        return { bg: '#dc2626', color: '#ffffff', text: 'REJECTED' };
      case RequirementStatus.PENDING:
      default:
        return { bg: '#d97706', color: '#ffffff', text: 'PENDING' };
    }
  };

  return (
    <main style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', color: '#ffffff' }}>
      <header
        style={{
          marginBottom: '2rem',
          borderBottom: `1px solid ${voltageSurface}`,
          paddingBottom: '1rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ color: brandEmerald, margin: 0 }}>
              Captain Onboarding &amp; Document Verification (EV-024)
            </h1>
            <p style={{ color: '#8892b0', marginTop: '0.5rem' }}>
              Andhra Pradesh 100% Electric Mobility Pilot — Independent Driver &amp; Vehicle
              Verification
            </p>
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
            }}
          >
            &larr; Back to Ops Portal
          </a>
        </div>
      </header>

      {/* Filter Toolbar */}
      <section
        style={{
          background: voltageSurface,
          padding: '1rem 1.5rem',
          borderRadius: '8px',
          marginBottom: '2rem',
          display: 'flex',
          gap: '1.5rem',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <label style={{ fontSize: '0.85rem', color: '#8892b0', marginRight: '0.5rem' }}>
            Application Status:
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              background: cardBg,
              color: '#ffffff',
              border: '1px solid #3a506b',
              padding: '0.4rem 0.8rem',
              borderRadius: '4px',
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value={CaptainApplicationStatus.SUBMITTED}>Submitted</option>
            <option value={CaptainApplicationStatus.UNDER_REVIEW}>Under Review</option>
            <option value={CaptainApplicationStatus.APPROVED}>Approved</option>
            <option value={CaptainApplicationStatus.REJECTED}>Rejected</option>
            <option value={CaptainApplicationStatus.DRAFT}>Draft</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: '0.85rem', color: '#8892b0', marginRight: '0.5rem' }}>
            City / Corridor:
          </label>
          <select
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            style={{
              background: cardBg,
              color: '#ffffff',
              border: '1px solid #3a506b',
              padding: '0.4rem 0.8rem',
              borderRadius: '4px',
            }}
          >
            <option value="ALL">All Cities</option>
            <option value="visakhapatnam">Visakhapatnam (Active Pilot)</option>
            <option value="vijayawada">Vijayawada</option>
            <option value="guntur">Guntur</option>
          </select>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: '0.9rem', color: '#c5d1eb' }}>
          Total Applications Shown: <strong>{filtered.length}</strong>
        </div>
      </section>

      {/* Applications Table */}
      <section
        style={{
          background: voltageSurface,
          borderRadius: '8px',
          overflow: 'hidden',
          marginBottom: '2rem',
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
              <th style={{ padding: '1rem', color: borderCyan }}>Status &amp; Submission</th>
              <th style={{ padding: '1rem', color: borderCyan }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((app) => {
              const statusBadge = getStatusBadge(app.status);
              const driverBadge = getRequirementBadge(app.driverRequirementsStatus);
              const vehicleBadge = getRequirementBadge(app.vehicleRequirementsStatus);

              return (
                <tr
                  key={app.id}
                  style={{
                    borderBottom: '1px solid #2a3a5e',
                    transition: 'background 0.2s',
                  }}
                >
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 'bold', color: '#ffffff' }}>{app.fullName}</div>
                    <div style={{ fontSize: '0.8rem', color: '#8892b0' }}>{app.phone}</div>
                    <div style={{ fontSize: '0.75rem', color: '#a0aec0' }}>
                      DL: {app.drivingLicenseNumber}
                    </div>
                  </td>
                  <td style={{ padding: '1rem', textTransform: 'capitalize' }}>{app.city}</td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 500 }}>
                      {app.vehicleMake} {app.vehicleModel}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#10b981' }}>
                      {app.vehicleRegistrationNumber} (AP Green Plate)
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6fffe9' }}>
                      {app.propulsionType} &bull; {app.vehicleCategory}
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
                      <div style={{ fontSize: '0.7rem', color: '#fca5a5', marginTop: '0.25rem' }}>
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
                      <div style={{ fontSize: '0.7rem', color: '#fca5a5', marginTop: '0.25rem' }}>
                        {app.vehicleRejectionReason}
                      </div>
                    )}
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
                      onClick={() => setSelectedApp(app)}
                      style={{
                        background: '#38bdf8',
                        color: '#0b132b',
                        border: 'none',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                      }}
                    >
                      Review History &rarr;
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Audit & Review History Drawer / Modal */}
      {selectedApp && (
        <section
          style={{
            background: cardBg,
            border: `2px solid ${borderCyan}`,
            borderRadius: '8px',
            padding: '1.5rem',
            marginTop: '2rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, color: borderCyan }}>
              Audit History &bull; {selectedApp.fullName} ({selectedApp.vehicleRegistrationNumber})
            </h2>
            <button
              onClick={() => setSelectedApp(null)}
              style={{
                background: '#4b5563',
                color: '#ffffff',
                border: 'none',
                padding: '0.3rem 0.7rem',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>

          <p style={{ color: '#8892b0', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Demonstrating acceptance criteria: Rejected applications remain editable under the same
            ID with strict audit logging; duplicate records are prevented.
          </p>

          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {selectedApp.reviewHistory.map((rev, idx) => (
                <div
                  key={rev.id}
                  style={{
                    background: voltageSurface,
                    padding: '1rem',
                    borderRadius: '6px',
                    borderLeft: `4px solid ${rev.newStatus === CaptainApplicationStatus.APPROVED ? '#059669' : rev.newStatus === CaptainApplicationStatus.REJECTED ? '#dc2626' : '#2563eb'}`,
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
                      Step {idx + 1}: {rev.previousStatus} &rarr; {rev.newStatus}
                    </span>
                    <span style={{ color: '#8892b0' }}>
                      {new Date(rev.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {rev.notes && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#e2e8f0' }}>
                      <strong>Review Note:</strong> {rev.notes}
                    </div>
                  )}
                  {rev.driverRequirementsStatus && (
                    <div style={{ marginTop: '0.25rem', fontSize: '0.8rem', color: '#a0aec0' }}>
                      Driver KYC Status: <strong>{rev.driverRequirementsStatus}</strong> &bull;
                      Vehicle KYC Status: <strong>{rev.vehicleRequirementsStatus}</strong>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
