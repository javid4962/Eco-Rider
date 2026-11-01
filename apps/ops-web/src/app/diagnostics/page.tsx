import React from 'react';

export default function DiagnosticsDashboardPage() {
  const brandEmerald = '#059669';
  const voltageSurface = '#1C2541';
  const cardBg = '#0b132b';
  const borderCyan = '#6fffe9';

  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', color: '#ffffff' }}>
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
              EcoRide Platform Observability &amp; Diagnostics
            </h1>
            <p style={{ color: '#8892b0', marginTop: '0.5rem' }}>
              Real-time Liveness, Readiness, Structured Telemetry &amp; Privacy Redaction (EV-014)
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

      {/* Probes Status Section */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ color: borderCyan, fontSize: '1.25rem', marginBottom: '1rem' }}>
          Container Orchestration Probes (Kubernetes &amp; Cloud Gateways)
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {/* Liveness Probe Card */}
          <div
            style={{
              background: voltageSurface,
              padding: '1.5rem',
              borderRadius: '8px',
              borderLeft: `4px solid ${brandEmerald}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#ffffff' }}>
                Liveness Probe (/health/live)
              </h3>
              <span
                style={{
                  background: brandEmerald,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                }}
              >
                ALIVE (HTTP 200)
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#c5d1eb', marginTop: '0.75rem' }}>
              Signals Node.js process vitality. Stays responsive during transient dependency
              reconnects.
            </p>
            <div
              style={{
                background: cardBg,
                padding: '0.75rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontFamily: 'monospace',
                color: '#6fffe9',
              }}
            >
              <div>Status: ok (Process alive)</div>
              <div>Memory: Monitored (Heap &amp; RSS)</div>
              <div>Probe Policy: Safe from premature restarts</div>
            </div>
          </div>

          {/* Readiness Probe Card */}
          <div
            style={{
              background: voltageSurface,
              padding: '1.5rem',
              borderRadius: '8px',
              borderLeft: '4px solid #38bdf8',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#ffffff' }}>
                Readiness Probe (/health/ready)
              </h3>
              <span
                style={{
                  background: '#38bdf8',
                  color: '#0b132b',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                }}
              >
                READY (HTTP 200)
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#c5d1eb', marginTop: '0.75rem' }}>
              Strictly verifies operational connectivity of PostgreSQL (PostGIS) and Redis.
            </p>
            <div
              style={{
                background: cardBg,
                padding: '0.75rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontFamily: 'monospace',
                color: '#6fffe9',
              }}
            >
              <div>PostgreSQL (PostGIS 16): UP (Health probe: OK)</div>
              <div>Redis Cache (BullMQ 7): UP (PING: OK)</div>
              <div>Fail Mode: HTTP 503 Service Unavailable</div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics & Observability Section */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ color: borderCyan, fontSize: '1.25rem', marginBottom: '1rem' }}>
          Runtime Telemetry &amp; Prometheus Metrics
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.25rem',
          }}
        >
          <div style={{ background: voltageSurface, padding: '1.25rem', borderRadius: '8px' }}>
            <div style={{ color: '#8892b0', fontSize: '0.85rem' }}>Fleet Propulsion Mode</div>
            <div
              style={{
                color: brandEmerald,
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginTop: '0.5rem',
              }}
            >
              100% BEV
            </div>
            <div style={{ color: '#c5d1eb', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              Zero ICE / Hybrid tolerance enforced
            </div>
          </div>

          <div style={{ background: voltageSurface, padding: '1.25rem', borderRadius: '8px' }}>
            <div style={{ color: '#8892b0', fontSize: '0.85rem' }}>Authorized Pilot City</div>
            <div
              style={{
                color: borderCyan,
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginTop: '0.5rem',
              }}
            >
              Visakhapatnam
            </div>
            <div style={{ color: '#c5d1eb', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              All other AP zones gated (Release A)
            </div>
          </div>

          <div style={{ background: voltageSurface, padding: '1.25rem', borderRadius: '8px' }}>
            <div style={{ color: '#8892b0', fontSize: '0.85rem' }}>Correlation Tracing</div>
            <div
              style={{
                color: '#ffffff',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginTop: '0.5rem',
              }}
            >
              x-correlation-id
            </div>
            <div style={{ color: '#c5d1eb', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              Propagated across HTTP &amp; BullMQ logs
            </div>
          </div>

          <div style={{ background: voltageSurface, padding: '1.25rem', borderRadius: '8px' }}>
            <div style={{ color: '#8892b0', fontSize: '0.85rem' }}>Prometheus Scrape</div>
            <div
              style={{
                color: '#38bdf8',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginTop: '0.5rem',
              }}
            >
              GET /metrics
            </div>
            <div style={{ color: '#c5d1eb', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              Standard OpenMetrics text exposition
            </div>
          </div>
        </div>
      </section>

      {/* Privacy & Log Redaction Guarantees */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ color: borderCyan, fontSize: '1.25rem', marginBottom: '1rem' }}>
          Security &amp; Privacy Log Redaction Verification
        </h2>
        <div style={{ background: voltageSurface, padding: '1.5rem', borderRadius: '8px' }}>
          <p style={{ color: '#c5d1eb', fontSize: '0.9rem', marginTop: 0 }}>
            In accordance with platform security engineering rules, the following privacy guards are
            authoritatively applied by <code>LoggingInterceptor</code> and <code>LogSanitizer</code>
            :
          </p>
          <ul style={{ color: '#c5d1eb', fontSize: '0.85rem', lineHeight: '1.6' }}>
            <li>
              <strong>OTPs &amp; Start Codes:</strong> All <code>start_otp</code>, <code>otp</code>,
              and <code>code</code> payloads are redacted to <code>[REDACTED_OTP]</code>.
            </li>
            <li>
              <strong>Personal Locations:</strong> Precise pickup/dropoff coordinates
              (latitude/longitude) are masked to <code>[REDACTED_COORDINATES]</code> to protect
              rider privacy.
            </li>
            <li>
              <strong>Credentials &amp; Tokens:</strong> Database connection strings, passwords, and
              Authorization headers are redacted to <code>[REDACTED_SECRET]</code>.
            </li>
            <li>
              <strong>Telephone Numbers:</strong> Mobile numbers are pseudonymized to{' '}
              <code>+91*****0001</code>.
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}
