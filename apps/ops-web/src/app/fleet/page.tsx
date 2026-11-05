'use client';

import React, { useState, useEffect } from 'react';

interface FleetVehicle {
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
  category: string;
  batteryCapacityKwh: number;
  currentSocPercent: number;
  estimatedRangeKm: number;
  greenPlateVerified: boolean;
  assignedCaptainName: string | null;
  assignedCaptainPhone: string | null;
  shiftStatus: 'ON_DUTY' | 'OFF_DUTY' | 'CHARGING' | 'MAINTENANCE';
  city: string;
  isActive: boolean;
}

export default function FleetManagementPage() {
  const brandEmerald = '#059669';
  const voltageSurface = '#1C2541';
  const accentCyan = '#6fffe9';

  const [vehicles, setVehicles] = useState<FleetVehicle[]>([
    {
      id: 'veh-001',
      registrationNumber: 'AP-39-EV-1001',
      make: 'Tata',
      model: 'Nexon EV Prime',
      category: 'CAB_PRIVATE_4W',
      batteryCapacityKwh: 30.2,
      currentSocPercent: 78,
      estimatedRangeKm: 210,
      greenPlateVerified: true,
      assignedCaptainName: 'Suresh Kumar',
      assignedCaptainPhone: '+91*****1001',
      shiftStatus: 'ON_DUTY',
      city: 'vijayawada',
      isActive: true,
    },
    {
      id: 'veh-002',
      registrationNumber: 'AP-39-EV-2002',
      make: 'Mahindra',
      model: 'Treo Zor e-Auto',
      category: 'AUTO_COMMUTE_3W',
      batteryCapacityKwh: 7.37,
      currentSocPercent: 45,
      estimatedRangeKm: 58,
      greenPlateVerified: true,
      assignedCaptainName: 'Koteswara Rao',
      assignedCaptainPhone: '+91*****2002',
      shiftStatus: 'ON_DUTY',
      city: 'guntur',
      isActive: true,
    },
    {
      id: 'veh-003',
      registrationNumber: 'AP-39-EV-3003',
      make: 'MG',
      model: 'ZS EV Long Range',
      category: 'PREMIUM_SUV_4W',
      batteryCapacityKwh: 50.3,
      currentSocPercent: 18,
      estimatedRangeKm: 65,
      greenPlateVerified: true,
      assignedCaptainName: 'Venkatesh Babu',
      assignedCaptainPhone: '+91*****3003',
      shiftStatus: 'CHARGING',
      city: 'amaravathi',
      isActive: true,
    },
    {
      id: 'veh-004',
      registrationNumber: 'AP-39-EV-4004',
      make: 'Euler',
      model: 'HiLoad e-Cargo 3W',
      category: 'E_CARGO_3W',
      batteryCapacityKwh: 12.4,
      currentSocPercent: 88,
      estimatedRangeKm: 120,
      greenPlateVerified: true,
      assignedCaptainName: 'Appa Rao',
      assignedCaptainPhone: '+91*****4004',
      shiftStatus: 'ON_DUTY',
      city: 'vijayawada',
      isActive: true,
    },
    {
      id: 'veh-005',
      registrationNumber: 'AP-39-EV-5005',
      make: 'Tata',
      model: 'Ace EV Delivery Van',
      category: 'E_CARGO_4W_VAN',
      batteryCapacityKwh: 21.3,
      currentSocPercent: 12,
      estimatedRangeKm: 18,
      greenPlateVerified: true,
      assignedCaptainName: null,
      assignedCaptainPhone: null,
      shiftStatus: 'MAINTENANCE',
      city: 'mangalagiri',
      isActive: true,
    },
  ]);

  const [filterCity, setFilterCity] = useState<string>('ALL');

  useEffect(() => {
    fetch('/v1/fleet/vehicles')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && Array.isArray(data) && data.length > 0 && setVehicles(data))
      .catch(() => {});
  }, []);

  const filteredVehicles =
    filterCity === 'ALL' ? vehicles : vehicles.filter((v) => v.city.toLowerCase() === filterCity.toLowerCase());

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
            Multi-Vehicle Fleet &amp; Battery Telemetry Portal
          </h1>
          <p style={{ color: '#8892b0', marginTop: '0.25rem' }}>
            Commercial EV Organizations, Driver Shifts, State-of-Charge Health &amp; AP Green Plate Compliance
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            style={{
              padding: '0.5rem',
              background: voltageSurface,
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#f8fafc',
              fontSize: '0.85rem',
            }}
          >
            <option value="ALL">All AP Hubs</option>
            <option value="vijayawada">Vijayawada</option>
            <option value="guntur">Guntur</option>
            <option value="amaravathi">Amaravathi</option>
            <option value="mangalagiri">Mangalagiri</option>
          </select>
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
        </div>
      </header>

      {/* Fleet Stats Overview */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2.5rem',
        }}
      >
        <div style={{ background: voltageSurface, padding: '1.25rem', borderRadius: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: '#8892b0', textTransform: 'uppercase' }}>
            Total 100% BEV Fleet
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: brandEmerald, marginTop: '0.25rem' }}>
            {vehicles.length}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#6fffe9' }}>Zero ICE vehicles</span>
        </div>

        <div style={{ background: voltageSurface, padding: '1.25rem', borderRadius: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: '#8892b0', textTransform: 'uppercase' }}>
            On-Duty Captains
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#38bdf8', marginTop: '0.25rem' }}>
            {vehicles.filter((v) => v.shiftStatus === 'ON_DUTY').length}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#c5d1eb' }}>Active in corridor</span>
        </div>

        <div style={{ background: voltageSurface, padding: '1.25rem', borderRadius: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: '#8892b0', textTransform: 'uppercase' }}>
            Fast Charging Depot
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#f59e0b', marginTop: '0.25rem' }}>
            {vehicles.filter((v) => v.shiftStatus === 'CHARGING').length}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#c5d1eb' }}>SoC recovery mode</span>
        </div>

        <div style={{ background: voltageSurface, padding: '1.25rem', borderRadius: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: '#8892b0', textTransform: 'uppercase' }}>
            AP Green Plate Verified
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#10b981', marginTop: '0.25rem' }}>
            100%
          </div>
          <span style={{ fontSize: '0.75rem', color: '#10b981' }}>AP RTA Commercial EV Valid</span>
        </div>
      </section>

      {/* Fleet Vehicles Table */}
      <section style={{ background: voltageSurface, padding: '1.5rem', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '1.25rem', color: accentCyan, marginTop: 0, marginBottom: '1rem' }}>
          Active Commercial EV Fleet Roster
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                <th style={{ padding: '0.75rem' }}>Registration</th>
                <th style={{ padding: '0.75rem' }}>Make / Model</th>
                <th style={{ padding: '0.75rem' }}>Category</th>
                <th style={{ padding: '0.75rem' }}>Battery SoC %</th>
                <th style={{ padding: '0.75rem' }}>Est Range</th>
                <th style={{ padding: '0.75rem' }}>Assigned Captain</th>
                <th style={{ padding: '0.75rem' }}>Shift Status</th>
                <th style={{ padding: '0.75rem' }}>City</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map((v) => {
                let socColor = '#10b981';
                if (v.currentSocPercent < 20) socColor = '#ef4444';
                else if (v.currentSocPercent < 40) socColor = '#f59e0b';

                return (
                  <tr key={v.id} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 'bold', color: '#6fffe9', fontFamily: 'monospace' }}>
                      {v.registrationNumber}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ fontWeight: '500' }}>{v.make} {v.model}</div>
                      <div style={{ fontSize: '0.75rem', color: '#8892b0' }}>{v.batteryCapacityKwh} kWh Pack</div>
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#cbd5e1' }}>
                      {v.category}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div
                          style={{
                            width: '48px',
                            height: '8px',
                            background: '#334155',
                            borderRadius: '4px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${v.currentSocPercent}%`,
                              height: '100%',
                              background: socColor,
                            }}
                          />
                        </div>
                        <span style={{ fontWeight: 'bold', color: socColor }}>{v.currentSocPercent}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem', color: '#38bdf8', fontWeight: 'bold' }}>
                      ~{v.estimatedRangeKm} km
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {v.assignedCaptainName ? (
                        <div>
                          <div>{v.assignedCaptainName}</div>
                          <div style={{ fontSize: '0.75rem', color: '#8892b0' }}>{v.assignedCaptainPhone}</div>
                        </div>
                      ) : (
                        <span style={{ color: '#64748b' }}>Unassigned</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span
                        style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          background:
                            v.shiftStatus === 'ON_DUTY'
                              ? '#059669'
                              : v.shiftStatus === 'CHARGING'
                              ? '#d97706'
                              : v.shiftStatus === 'MAINTENANCE'
                              ? '#dc2626'
                              : '#475569',
                        }}
                      >
                        {v.shiftStatus}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', textTransform: 'uppercase', fontSize: '0.8rem' }}>
                      {v.city}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

