import React from 'react';

export default function OpsDashboardPage() {
  const brandEmerald = '#059669';
  const voltageSurface = '#1C2541';

  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', color: '#f8fafc' }}>
      <header
        style={{
          marginBottom: '2rem',
          borderBottom: `1px solid ${voltageSurface}`,
          paddingBottom: '1rem',
        }}
      >
        <h1 style={{ color: brandEmerald, margin: 0 }}>EcoRide Operations &amp; Dispatch Portal</h1>
        <p style={{ color: '#8892b0', marginTop: '0.5rem' }}>
          Andhra Pradesh Capital Corridor EV-Only Fleet Monitoring &amp; Gated Governance
        </p>
      </header>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* Pilot Zone Bounds */}
        <div style={{ background: voltageSurface, padding: '1.5rem', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#6fffe9', marginTop: 0 }}>Pilot Zone Bounds</h2>
          <p style={{ fontSize: '0.9rem', color: '#c5d1eb' }}>
            Vijayawada &bull; Guntur &bull; Amaravathi &bull; Mangalagiri
          </p>
          <span
            style={{
              display: 'inline-block',
              padding: '0.25rem 0.75rem',
              background: brandEmerald,
              borderRadius: '4px',
              fontSize: '0.8rem',
              fontWeight: 'bold',
            }}
          >
            AP Capital Region Active
          </span>
        </div>

        {/* 100% BEV Fleet Telemetry */}
        <div style={{ background: voltageSurface, padding: '1.5rem', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#6fffe9', marginTop: 0 }}>
            Fleet Telemetry Status
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#c5d1eb' }}>
            100% Battery Electric Propulsion Enforced (BEV Only)
          </p>
          <span
            style={{
              display: 'inline-block',
              padding: '0.25rem 0.75rem',
              background: '#3a506b',
              borderRadius: '4px',
              fontSize: '0.8rem',
              fontWeight: 'bold',
            }}
          >
            Zero ICE Vehicles Allowed
          </span>
        </div>

        {/* 24/7 Safety & Police 112 Console */}
        <div style={{ background: voltageSurface, padding: '1.5rem', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#6fffe9', marginTop: 0 }}>
            24/7 Safety &amp; Police 112 Console
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#c5d1eb' }}>
            Emergency SOS Incidents, Tokenized Live Tracking &amp; AP 112 Dispatch
          </p>
          <a
            href="/safety"
            style={{
              display: 'inline-block',
              padding: '0.25rem 0.75rem',
              background: '#ef4444',
              color: '#ffffff',
              fontWeight: 'bold',
              textDecoration: 'none',
              borderRadius: '4px',
              fontSize: '0.8rem',
            }}
          >
            Open Safety Console &rarr;
          </a>
        </div>

        {/* AP Capital EV Charging Aggregator */}
        <div style={{ background: voltageSurface, padding: '1.5rem', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#6fffe9', marginTop: 0 }}>
            EV Charging Aggregator
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#c5d1eb' }}>
            Fast DC/CCS2 Charging Hubs, Gun Availability &amp; Battery Telemetry (EV-121)
          </p>
          <a
            href="/charging"
            style={{
              display: 'inline-block',
              padding: '0.25rem 0.75rem',
              background: '#0284c7',
              color: '#ffffff',
              fontWeight: 'bold',
              textDecoration: 'none',
              borderRadius: '4px',
              fontSize: '0.8rem',
            }}
          >
            Manage Charging Depots &rarr;
          </a>
        </div>

        {/* Captain Applications & Onboarding */}
        <div style={{ background: voltageSurface, padding: '1.5rem', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#6fffe9', marginTop: 0 }}>
            Captain Onboarding &amp; KYC
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#c5d1eb' }}>
            EV Driver KYC, Green Plate Verification &amp; Review History (EV-024)
          </p>
          <a
            href="/captain-applications"
            style={{
              display: 'inline-block',
              padding: '0.25rem 0.75rem',
              background: brandEmerald,
              color: '#ffffff',
              fontWeight: 'bold',
              textDecoration: 'none',
              borderRadius: '4px',
              fontSize: '0.8rem',
            }}
          >
            Review Applications &rarr;
          </a>
        </div>

        {/* Platform Diagnostics */}
        <div style={{ background: voltageSurface, padding: '1.5rem', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#6fffe9', marginTop: 0 }}>
            Platform Diagnostics
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#c5d1eb' }}>
            Live Probes, Readiness, Metrics &amp; Trace Logs
          </p>
          <a
            href="/diagnostics"
            style={{
              display: 'inline-block',
              padding: '0.25rem 0.75rem',
              background: '#38bdf8',
              color: '#0b132b',
              fontWeight: 'bold',
              textDecoration: 'none',
              borderRadius: '4px',
              fontSize: '0.8rem',
            }}
          >
            Open Diagnostics &rarr;
          </a>
        </div>
      </section>
    </main>
  );
}
