'use client';

import React, { useState, useEffect } from 'react';

interface CorporateAccount {
  id: string;
  companyName: string;
  gstin: string;
  contactEmail: string;
  contactPhone: string;
  billingAddress: string;
  city: string;
  activeEmployeeCount: number;
  monthlySpendPaise: number;
  status: 'ACTIVE' | 'SUSPENDED';
}

interface ShiftManifest {
  id: string;
  manifestCode: string;
  companyName: string;
  shiftName: 'GENERAL_MORNING' | 'EVENING_SHIFT' | 'NIGHT_SHIFT';
  scheduledTime: string;
  assignedVehicleReg: string;
  captainName: string;
  totalEmployees: number;
  boardedEmployees: number;
  status: 'SCHEDULED' | 'IN_TRANSIT' | 'COMPLETED';
}

export default function CorporateTransportPage() {
  const brandEmerald = '#059669';
  const voltageSurface = '#1C2541';
  const accentCyan = '#6fffe9';

  const [accounts, setAccounts] = useState<CorporateAccount[]>([
    {
      id: 'corp-001',
      companyName: 'AP Capital Tech Parks Pvt Ltd',
      gstin: '37AABCA5566K1Z8',
      contactEmail: 'transport@apcapitaltech.in',
      contactPhone: '+91*****8001',
      billingAddress: 'IT Tower 2, Auto Nagar, Vijayawada, AP 520007',
      city: 'vijayawada',
      activeEmployeeCount: 148,
      monthlySpendPaise: 42000000,
      status: 'ACTIVE',
    },
    {
      id: 'corp-002',
      companyName: 'Amaravathi Pharma Research Laboratories',
      gstin: '37BBBCP1122D1Z2',
      contactEmail: 'admin@amaravathipharma.com',
      contactPhone: '+91*****8002',
      billingAddress: 'Pharma SEZ, Mangalagiri, Guntur Dist, AP 522503',
      city: 'mangalagiri',
      activeEmployeeCount: 86,
      monthlySpendPaise: 24500000,
      status: 'ACTIVE',
    },
  ]);

  const [manifests, setManifests] = useState<ShiftManifest[]>([
    {
      id: 'mnf-001',
      manifestCode: 'MNF-APTECH-20261105-M1',
      companyName: 'AP Capital Tech Parks Pvt Ltd',
      shiftName: 'GENERAL_MORNING',
      scheduledTime: '08:30 AM',
      assignedVehicleReg: 'AP-39-EV-1001',
      captainName: 'Suresh Kumar',
      totalEmployees: 4,
      boardedEmployees: 4,
      status: 'COMPLETED',
    },
    {
      id: 'mnf-002',
      manifestCode: 'MNF-PHARMA-20261105-E2',
      companyName: 'Amaravathi Pharma Research Laboratories',
      shiftName: 'EVENING_SHIFT',
      scheduledTime: '06:00 PM',
      assignedVehicleReg: 'AP-39-EV-3003',
      captainName: 'Venkatesh Babu',
      totalEmployees: 4,
      boardedEmployees: 3,
      status: 'IN_TRANSIT',
    },
  ]);

  useEffect(() => {
    fetch('/v1/corporate/accounts')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && Array.isArray(data) && data.length > 0 && setAccounts(data))
      .catch(() => {});
  }, []);

  return (
    <main style={{ padding: '2rem', maxWidth: '1280px', margin: '0 auto', color: '#f8fafc' }}>
      <header
        style={{
          marginBottom: '2rem',
          borderBottom: `1px solid ${voltageSurface}`,
          paddingBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ color: brandEmerald, margin: 0, fontSize: '1.75rem' }}>
            Corporate &amp; Enterprise Transport Portal
          </h1>
          <p style={{ color: '#8892b0', marginTop: '0.25rem' }}>
            Employer Transport Rosters, 100% BEV Shift Manifests &amp; Consolidated B2B GST Invoicing (SAC 996412)
          </p>
        </div>
        <a
          href="/"
          style={{
            padding: '0.5rem 1rem',
            background: voltageSurface,
            color: '#c5d1eb',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '0.85rem',
          }}
        >
          &larr; Back to Ops Dashboard
        </a>
      </header>

      {/* Corporate Accounts Summary */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', color: accentCyan, marginTop: 0, marginBottom: '1rem' }}>
          Registered Enterprise Employer Accounts
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {accounts.map((acc) => (
            <div
              key={acc.id}
              style={{
                background: voltageSurface,
                padding: '1.5rem',
                borderRadius: '8px',
                border: '1px solid #334155',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#6fffe9', fontWeight: 'bold' }}>
                  GSTIN: {acc.gstin}
                </span>
                <span
                  style={{
                    background: '#059669',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                  }}
                >
                  {acc.status}
                </span>
              </div>
              <h3 style={{ fontSize: '1.15rem', color: '#f8fafc', margin: '0.5rem 0' }}>{acc.companyName}</h3>
              <p style={{ fontSize: '0.8rem', color: '#8892b0', margin: '0 0 1rem 0' }}>{acc.billingAddress}</p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.75rem',
                  background: '#0b132b',
                  padding: '0.75rem',
                  borderRadius: '6px',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#8892b0' }}>Active Commuters</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#38bdf8' }}>
                    {acc.activeEmployeeCount} Staff
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#8892b0' }}>Monthly B2B Run Rate</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: brandEmerald }}>
                    ₹{(acc.monthlySpendPaise / 100).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Shift Manifests Table */}
      <section style={{ background: voltageSurface, padding: '1.5rem', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '1.25rem', color: accentCyan, marginTop: 0, marginBottom: '1rem' }}>
          Daily Corporate Employee Shift Manifests
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                <th style={{ padding: '0.75rem' }}>Manifest Code</th>
                <th style={{ padding: '0.75rem' }}>Company</th>
                <th style={{ padding: '0.75rem' }}>Shift</th>
                <th style={{ padding: '0.75rem' }}>Time</th>
                <th style={{ padding: '0.75rem' }}>EV Vehicle</th>
                <th style={{ padding: '0.75rem' }}>Captain</th>
                <th style={{ padding: '0.75rem' }}>Boarding OTP</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {manifests.map((m) => (
                <tr key={m.id} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 'bold', color: '#6fffe9', fontFamily: 'monospace' }}>
                    {m.manifestCode}
                  </td>
                  <td style={{ padding: '0.75rem', fontWeight: '500' }}>{m.companyName}</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#c5d1eb' }}>
                    {m.shiftName.replace('_', ' ')}
                  </td>
                  <td style={{ padding: '0.75rem', color: '#38bdf8' }}>{m.scheduledTime}</td>
                  <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>{m.assignedVehicleReg}</td>
                  <td style={{ padding: '0.75rem' }}>{m.captainName}</td>
                  <td style={{ padding: '0.75rem', color: '#34d399', fontWeight: 'bold' }}>
                    {m.boardedEmployees} / {m.totalEmployees} Boarded
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span
                      style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        background:
                          m.status === 'COMPLETED'
                            ? '#059669'
                            : m.status === 'IN_TRANSIT'
                            ? '#0284c7'
                            : '#d97706',
                      }}
                    >
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

