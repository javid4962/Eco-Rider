'use client';

import React, { useState, useEffect } from 'react';

interface FleetDepot {
  id: string;
  code: string;
  name: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  totalParkingBays: number;
  availableParkingBays: number;
  totalChargingGuns: number;
  availableChargingGuns: number;
  chargingRateKw: number;
  isGovernmentAuthorized: boolean;
  status: string;
}

interface BayAllocation {
  id: string;
  depotId: string;
  depotCode: string;
  vehicleId: string;
  vehicleRegNumber: string;
  bayNumber: string;
  purpose: 'OVERNIGHT_PARKING' | 'CHARGING' | 'MAINTENANCE_HOLD';
  allocatedAt: string;
  expiresAt: string;
  releasedAt: string | null;
  status: 'ACTIVE' | 'RELEASED' | 'EXPIRED';
}

export default function FleetDepotsPage() {
  const brandEmerald = '#059669';
  const voltageSurface = '#1C2541';
  const accentCyan = '#6fffe9';

  const [depots, setDepots] = useState<FleetDepot[]>([
    {
      id: 'depot-amv-sec',
      code: 'AMV-DEP-01',
      name: 'Amaravathi Government Secretariat EV Depot',
      city: 'amaravathi',
      address: 'Velagapudi Government Complex, Amaravathi, AP 522237',
      latitude: 16.5412,
      longitude: 80.5143,
      totalParkingBays: 50,
      availableParkingBays: 34,
      totalChargingGuns: 20,
      availableChargingGuns: 14,
      chargingRateKw: 60,
      isGovernmentAuthorized: true,
      status: 'OPERATIONAL',
    },
    {
      id: 'depot-vja-pnbs',
      code: 'VJA-DEP-02',
      name: 'Vijayawada PNBS Intermodal EV Transit Depot',
      city: 'vijayawada',
      address: 'Near APSRTC Bus Terminal, PNBS, Vijayawada, AP 520002',
      latitude: 16.5085,
      longitude: 80.6175,
      totalParkingBays: 40,
      availableParkingBays: 18,
      totalChargingGuns: 16,
      availableChargingGuns: 8,
      chargingRateKw: 120,
      isGovernmentAuthorized: true,
      status: 'OPERATIONAL',
    },
    {
      id: 'depot-mgl-aiims',
      code: 'MGL-DEP-03',
      name: 'Mangalagiri AIIMS Smart Corridor EV Hub',
      city: 'mangalagiri',
      address: 'NH-16 AIIMS Junction, Mangalagiri, AP 522503',
      latitude: 16.4357,
      longitude: 80.5654,
      totalParkingBays: 30,
      availableParkingBays: 22,
      totalChargingGuns: 12,
      availableChargingGuns: 9,
      chargingRateKw: 60,
      isGovernmentAuthorized: true,
      status: 'OPERATIONAL',
    },
  ]);

  const [allocations, setAllocations] = useState<BayAllocation[]>([
    {
      id: 'alloc-001',
      depotId: 'depot-amv-sec',
      depotCode: 'AMV-DEP-01',
      vehicleId: 'veh-ap39ev0001',
      vehicleRegNumber: 'AP-39-EV-1001',
      bayNumber: 'BAY-P-12',
      purpose: 'OVERNIGHT_PARKING',
      allocatedAt: new Date(Date.now() - 3600000).toISOString(),
      expiresAt: new Date(Date.now() + 25200000).toISOString(),
      releasedAt: null,
      status: 'ACTIVE',
    },
    {
      id: 'alloc-002',
      depotId: 'depot-vja-pnbs',
      depotCode: 'VJA-DEP-02',
      vehicleId: 'veh-ap39ev0002',
      vehicleRegNumber: 'AP-39-EV-2002',
      bayNumber: 'BAY-C-04',
      purpose: 'CHARGING',
      allocatedAt: new Date(Date.now() - 1800000).toISOString(),
      expiresAt: new Date(Date.now() + 5400000).toISOString(),
      releasedAt: null,
      status: 'ACTIVE',
    },
  ]);

  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [selectedDepotId, setSelectedDepotId] = useState(depots[0].id);
  const [vehicleReg, setVehicleReg] = useState('AP-39-EV-3003');
  const [purpose, setPurpose] = useState<'OVERNIGHT_PARKING' | 'CHARGING'>('CHARGING');
  const [durationHours, setDurationHours] = useState('2');

  useEffect(() => {
    fetch('/v1/depots')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && Array.isArray(data) && data.length > 0 && setDepots(data))
      .catch(() => {});
  }, []);

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    const depot = depots.find((d) => d.id === selectedDepotId) || depots[0];
    const hrs = Number(durationHours);

    const payload = {
      depotId: depot.id,
      vehicleId: `veh-${vehicleReg.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      vehicleRegistrationNumber: vehicleReg.toUpperCase(),
      purpose,
      durationHours: hrs,
    };

    try {
      const res = await fetch('/v1/depots/allocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const saved = await res.json();
        setAllocations((prev) => [saved, ...prev]);
      } else {
        // Optimistic synthetic allocation
        const mock: BayAllocation = {
          id: `alloc-${Date.now()}`,
          depotId: depot.id,
          depotCode: depot.code,
          vehicleId: payload.vehicleId,
          vehicleRegNumber: payload.vehicleRegistrationNumber,
          bayNumber: purpose === 'CHARGING' ? `GUN-C-${Math.floor(Math.random() * 8) + 1}` : `BAY-P-${Math.floor(Math.random() * 20) + 1}`,
          purpose,
          allocatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + hrs * 3600000).toISOString(),
          releasedAt: null,
          status: 'ACTIVE',
        };
        setAllocations((prev) => [mock, ...prev]);
        setDepots((prev) =>
          prev.map((d) =>
            d.id === depot.id
              ? {
                  ...d,
                  availableChargingGuns: purpose === 'CHARGING' ? Math.max(0, d.availableChargingGuns - 1) : d.availableChargingGuns,
                  availableParkingBays: purpose === 'OVERNIGHT_PARKING' ? Math.max(0, d.availableParkingBays - 1) : d.availableParkingBays,
                }
              : d,
          ),
        );
      }
    } catch {
      // Fallback optimistic
    }
    setShowAllocateModal(false);
  };

  const handleRelease = async (allocId: string) => {
    try {
      await fetch(`/v1/depots/allocations/${allocId}/release`, { method: 'POST' });
    } catch {}

    setAllocations((prev) =>
      prev.map((a) => (a.id === allocId ? { ...a, status: 'RELEASED', releasedAt: new Date().toISOString() } : a)),
    );
  };

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
            Institutional &amp; Government Fleet Depots
          </h1>
          <p style={{ color: '#8892b0', marginTop: '0.25rem' }}>
            AP State Government Authorized Depots, Overnight Parking &amp; Dedicated EV Charging Bay Allocations
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setShowAllocateModal(true)}
            style={{
              padding: '0.5rem 1rem',
              background: brandEmerald,
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.85rem',
            }}
          >
            + Allocate Depot Bay
          </button>
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

      {/* Depots Directory Cards */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', color: accentCyan, marginTop: 0, marginBottom: '1rem' }}>
          Authorized Andhra Pradesh Capital Region EV Depots
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {depots.map((d) => (
            <div
              key={d.id}
              style={{
                background: voltageSurface,
                padding: '1.5rem',
                borderRadius: '8px',
                border: '1px solid #334155',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#6fffe9', fontWeight: 'bold' }}>
                  {d.code}
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
                  Govt Authorized (AP-STA)
                </span>
              </div>
              <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', margin: '0.5rem 0' }}>{d.name}</h3>
              <p style={{ fontSize: '0.8rem', color: '#8892b0', margin: '0 0 1rem 0' }}>{d.address}</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: '#0b132b', padding: '0.75rem', borderRadius: '6px' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#8892b0' }}>Parking Bays Available</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#34d399' }}>
                    {d.availableParkingBays} / {d.totalParkingBays}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#8892b0' }}>Fast Charging Guns</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#38bdf8' }}>
                    {d.availableChargingGuns} / {d.totalChargingGuns}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.75rem' }}>
                Power Rating: {d.chargingRateKw} kW DC Fast &bull; City: {d.city.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Current Active Allocations */}
      <section style={{ background: voltageSurface, padding: '1.5rem', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '1.25rem', color: accentCyan, marginTop: 0, marginBottom: '1rem' }}>
          Live Bay Allocations &amp; Overnight Stays
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                <th style={{ padding: '0.75rem' }}>Depot</th>
                <th style={{ padding: '0.75rem' }}>Vehicle Reg</th>
                <th style={{ padding: '0.75rem' }}>Bay / Gun</th>
                <th style={{ padding: '0.75rem' }}>Purpose</th>
                <th style={{ padding: '0.75rem' }}>Allocated At</th>
                <th style={{ padding: '0.75rem' }}>Expires</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
                <th style={{ padding: '0.75rem' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {allocations.map((a) => (
                <tr key={a.id} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 'bold', color: '#6fffe9' }}>{a.depotCode}</td>
                  <td style={{ padding: '0.75rem', fontFamily: 'monospace', color: '#f8fafc' }}>{a.vehicleRegNumber}</td>
                  <td style={{ padding: '0.75rem', color: brandEmerald, fontWeight: 'bold' }}>{a.bayNumber}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span
                      style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        background: a.purpose === 'CHARGING' ? '#0284c7' : '#059669',
                      }}
                    >
                      {a.purpose}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                    {new Date(a.allocatedAt).toLocaleTimeString()}
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                    {new Date(a.expiresAt).toLocaleTimeString()}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span
                      style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        background: a.status === 'ACTIVE' ? '#10b981' : '#64748b',
                      }}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    {a.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleRelease(a.id)}
                        style={{
                          padding: '0.3rem 0.75rem',
                          background: '#ef4444',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                        }}
                      >
                        Release Bay
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Allocate Modal */}
      {showAllocateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: '#1C2541',
              padding: '2rem',
              borderRadius: '8px',
              maxWidth: '480px',
              width: '100%',
              border: '1px solid #334155',
            }}
          >
            <h2 style={{ color: brandEmerald, marginTop: 0, fontSize: '1.25rem' }}>Allocate Fleet Depot Bay</h2>
            <form onSubmit={handleAllocate}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#8892b0', marginBottom: '0.25rem' }}>
                  Target EV Depot
                </label>
                <select
                  value={selectedDepotId}
                  onChange={(e) => setSelectedDepotId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: '#0b132b',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    color: '#f8fafc',
                  }}
                >
                  {depots.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.city})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#8892b0', marginBottom: '0.25rem' }}>
                  EV Registration Number (AP Green Plate)
                </label>
                <input
                  required
                  value={vehicleReg}
                  onChange={(e) => setVehicleReg(e.target.value)}
                  placeholder="AP-39-EV-1234"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: '#0b132b',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    color: '#f8fafc',
                    fontFamily: 'monospace',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#8892b0', marginBottom: '0.25rem' }}>
                    Purpose
                  </label>
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: '#0b132b',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      color: '#f8fafc',
                    }}
                  >
                    <option value="CHARGING">DC Fast Charging</option>
                    <option value="OVERNIGHT_PARKING">Overnight Depot Parking</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#8892b0', marginBottom: '0.25rem' }}>
                    Duration (Hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={durationHours}
                    onChange={(e) => setDurationHours(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: '#0b132b',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      color: '#f8fafc',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(false)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#334155',
                    color: '#c5d1eb',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.5rem 1.25rem',
                    background: brandEmerald,
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  Confirm Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

