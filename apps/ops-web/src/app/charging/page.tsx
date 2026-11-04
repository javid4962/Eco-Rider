'use client';

import React, { useState, useEffect } from 'react';

interface ChargingStation {
  id: string;
  name: string;
  code: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  operator: string;
  totalGuns: number;
  availableGuns: number;
  supportedConnectors: string[];
  maxPowerKw: number;
  formattedTariff: string;
  status: string;
  amenities: string[];
}

export default function ChargingStationsPage() {
  const brandEmerald = '#059669';
  const voltageSurface = '#1C2541';

  const [stations, setStations] = useState<ChargingStation[]>([
    {
      id: 'chg-vja-benz-circle',
      name: 'NREDCAP Benz Circle Mega EV Station',
      code: 'VJA-BENZ-01',
      city: 'vijayawada',
      address: 'Near Benz Circle, MG Road, Vijayawada, AP 520010',
      latitude: 16.5062,
      longitude: 80.648,
      operator: 'NREDCAP AP EV Infrastructure',
      totalGuns: 8,
      availableGuns: 6,
      supportedConnectors: ['CCS2', 'BHARAT_DC_001', 'TYPE_2_AC'],
      maxPowerKw: 120,
      formattedTariff: '₹18.00/kWh',
      status: 'OPERATIONAL',
      amenities: ['RESTROOMS', 'CAFE', 'EV_SERVICE_BAY', 'WIFI'],
    },
    {
      id: 'chg-mgl-aiims',
      name: 'Mangalagiri AIIMS Corridor Smart Fast Charger',
      code: 'MGL-AIIMS-03',
      city: 'mangalagiri',
      address: 'NH-16 AIIMS Junction, Mangalagiri, Guntur Dist, AP 522503',
      latitude: 16.4357,
      longitude: 80.5654,
      operator: 'EcoRide SuperCharge AP',
      totalGuns: 6,
      availableGuns: 5,
      supportedConnectors: ['CCS2', 'TYPE_2_AC'],
      maxPowerKw: 120,
      formattedTariff: '₹18.00/kWh',
      status: 'OPERATIONAL',
      amenities: ['RESTROOMS', 'CAFE', 'SECURITY_24X7'],
    },
    {
      id: 'chg-amv-secretariat',
      name: 'Amaravathi Secretariat Government Complex EV Depot',
      code: 'AMV-SEC-04',
      city: 'amaravathi',
      address: 'Block 1, AP Government Secretariat, Velagapudi, AP 522237',
      latitude: 16.5412,
      longitude: 80.5143,
      operator: 'APCRDA Smart City EV Infrastructure',
      totalGuns: 10,
      availableGuns: 8,
      supportedConnectors: ['CCS2', 'BHARAT_DC_001', 'TYPE_2_AC'],
      maxPowerKw: 150,
      formattedTariff: '₹16.50/kWh',
      status: 'OPERATIONAL',
      amenities: ['RESTROOMS', 'SOLAR_CANOPY', 'SECURITY_24X7'],
    },
    {
      id: 'chg-gtr-arundelpet',
      name: 'Guntur Arundelpet Central EV Charging Station',
      code: 'GTR-ARU-05',
      city: 'guntur',
      address: 'Near Old Bus Stand, Arundelpet, Guntur, AP 522002',
      latitude: 16.3067,
      longitude: 80.4365,
      operator: 'NREDCAP AP EV Infrastructure',
      totalGuns: 8,
      availableGuns: 7,
      supportedConnectors: ['CCS2', 'BHARAT_DC_001', 'TYPE_2_AC'],
      maxPowerKw: 60,
      formattedTariff: '₹18.00/kWh',
      status: 'OPERATIONAL',
      amenities: ['RESTROOMS', 'MARKET_ACCESS'],
    },
  ]);

  useEffect(() => {
    fetch('/v1/charging/stations')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setStations(data);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <main style={{ padding: '2rem', maxWidth: '1300px', margin: '0 auto', color: '#f8fafc' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          borderBottom: `1px solid ${voltageSurface}`,
          paddingBottom: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 style={{ color: '#f8fafc', margin: 0, fontSize: '1.75rem' }}>
              AP Capital Corridor EV Charging Aggregator
            </h1>
            <span
              style={{
                background: brandEmerald,
                color: '#fff',
                padding: '0.2rem 0.6rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
              }}
            >
              100% BEV FAST DC &amp; AC
            </span>
          </div>
          <p style={{ color: '#94a3b8', margin: '0.5rem 0 0 0' }}>
            Live charger directory, slot reservation monitoring, and battery telemetry across Vijayawada, Guntur, Amaravathi, and Mangalagiri
          </p>
        </div>
        <a
          href="/"
          style={{
            color: '#38bdf8',
            textDecoration: 'none',
            fontSize: '0.9rem',
            fontWeight: 'bold',
          }}
        >
          &larr; Back to Dashboard
        </a>
      </header>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {stations.map((s) => (
          <div
            key={s.id}
            style={{
              background: voltageSurface,
              borderRadius: '8px',
              padding: '1.25rem',
              border: '1px solid #334155',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: '#38bdf8',
                    fontWeight: 'bold',
                    letterSpacing: '0.05em',
                  }}
                >
                  {s.code} • {s.city.toUpperCase()}
                </span>
                <span
                  style={{
                    background: s.availableGuns > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: s.availableGuns > 0 ? '#10b981' : '#ef4444',
                    border: `1px solid ${s.availableGuns > 0 ? '#10b981' : '#ef4444'}`,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                  }}
                >
                  {s.availableGuns} / {s.totalGuns} Available
                </span>
              </div>

              <h2 style={{ fontSize: '1.15rem', color: '#f8fafc', margin: '0.5rem 0 0.25rem 0' }}>
                {s.name}
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 1rem 0' }}>
                {s.address}
              </p>

              <div
                style={{
                  background: '#0f172a',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  marginBottom: '1rem',
                  fontSize: '0.8rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ color: '#94a3b8' }}>Max Power:</span>
                  <span style={{ color: '#6fffe9', fontWeight: 'bold' }}>{s.maxPowerKw} kW DC</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ color: '#94a3b8' }}>Statutory Tariff:</span>
                  <span style={{ color: '#a7f3d0', fontWeight: 'bold' }}>{s.formattedTariff}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Operator:</span>
                  <span style={{ color: '#cbd5e1' }}>{s.operator}</span>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>
                  CONNECTORS:
                </span>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {s.supportedConnectors.map((c) => (
                    <span
                      key={c}
                      style={{
                        background: '#334155',
                        color: '#f8fafc',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                      }}
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #334155', paddingTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => alert(`En-route reservation dispatched for station: ${s.name} (${s.code})`)}
                style={{
                  flex: 1,
                  background: brandEmerald,
                  color: '#fff',
                  border: 'none',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                Hold Slot (15 min)
              </button>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}

