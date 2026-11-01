import React from 'react';

export default function OpsDashboardPage() {
  const brandEmerald = '#059669';
  const voltageSurface = '#1C2541';

  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header
        style={{
          marginBottom: '2rem',
          borderBottom: `1px solid ${voltageSurface}`,
          paddingBottom: '1rem',
        }}
      >
        <h1 style={{ color: brandEmerald, margin: 0 }}>EcoRide Operations &amp; Dispatch Portal</h1>
        <p style={{ color: '#8892b0', marginTop: '0.5rem' }}>
          Andhra Pradesh EV-Only Fleet Monitoring &amp; Gated Governance
        </p>
      </header>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
        }}
      >
        <div style={{ background: voltageSurface, padding: '1.5rem', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#6fffe9', marginTop: 0 }}>Pilot Zone Bounds</h2>
          <p style={{ fontSize: '0.9rem', color: '#c5d1eb' }}>
            Visakhapatnam Corridor (Active Pilot)
          </p>
          <span
            style={{
              display: 'inline-block',
              padding: '0.25rem 0.75rem',
              background: brandEmerald,
              borderRadius: '4px',
              fontSize: '0.8rem',
            }}
          >
            Release A Active
          </span>
        </div>

        <div style={{ background: voltageSurface, padding: '1.5rem', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#6fffe9', marginTop: 0 }}>
            Fleet Telemetry Status
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#c5d1eb' }}>
            100% Battery Electric Propulsion Enforced
          </p>
          <span
            style={{
              display: 'inline-block',
              padding: '0.25rem 0.75rem',
              background: '#3a506b',
              borderRadius: '4px',
              fontSize: '0.8rem',
            }}
          >
            Zero ICE Vehicles Allowed
          </span>
        </div>

        <div style={{ background: voltageSurface, padding: '1.5rem', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#6fffe9', marginTop: 0 }}>
            Safety &amp; Police 112 Bridge
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#c5d1eb' }}>
            24/7 Incident Dispatch Ready (Standby)
          </p>
          <span
            style={{
              display: 'inline-block',
              padding: '0.25rem 0.75rem',
              background: '#10b981',
              borderRadius: '4px',
              fontSize: '0.8rem',
            }}
          >
            SLA Response &lt; 1000ms
          </span>
        </div>

        <div style={{ background: voltageSurface, padding: '1.5rem', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#6fffe9', marginTop: 0 }}>
            Captain Applications &amp; Onboarding
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
