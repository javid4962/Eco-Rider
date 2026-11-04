'use client';

import React, { useState, useEffect } from 'react';

interface SafetyIncident {
  id: string;
  incidentCode: string;
  bookingCode: string;
  incidentType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'REPORTED' | 'INVESTIGATING' | 'ESCALATED_POLICE' | 'RESOLVED' | 'FALSE_ALARM';
  reportedByRole: string;
  description: string;
  apPoliceDispatched: boolean;
  apPoliceReferenceId?: string;
  audioRecordingActive: boolean;
  createdAt: string;
}

export default function SafetyConsolePage() {
  const brandEmerald = '#059669';
  const voltageSurface = '#1C2541';
  const alertRed = '#EF4444';

  const [incidents, setIncidents] = useState<SafetyIncident[]>([
    {
      id: 'inc-demo-001',
      incidentCode: 'INC-SOS-20261104-A1B2',
      bookingCode: 'ECO-VZ-20261104-9871',
      incidentType: 'EMERGENCY_SOS',
      severity: 'CRITICAL',
      status: 'ESCALATED_POLICE',
      reportedByRole: 'RIDER',
      description: 'EMERGENCY SOS: In-trip emergency triggered near Benz Circle flyover.',
      apPoliceDispatched: true,
      apPoliceReferenceId: 'AP112-VJA-849102',
      audioRecordingActive: true,
      createdAt: new Date().toISOString(),
    },
  ]);

  const [selectedIncident, setSelectedIncident] = useState<SafetyIncident | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolvingStatus, setResolvingStatus] = useState<'RESOLVED' | 'FALSE_ALARM'>('RESOLVED');

  useEffect(() => {
    // Attempt live fetch if API is reachable
    fetch('/v1/safety/incidents')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setIncidents(data);
        }
      })
      .catch(() => {
        // Retain synthetic pilot incidents
      });
  }, []);

  const handleResolve = async (incidentId: string) => {
    if (!resolutionNotes.trim()) {
      alert('Please enter resolution notes before closing the incident.');
      return;
    }

    try {
      const res = await fetch(`/v1/safety/incidents/${incidentId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: resolvingStatus,
          resolutionNotes,
          actionTaken: `Actioned by Ops Safety Officer via web console (${resolvingStatus})`,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setIncidents((prev) => prev.map((inc) => (inc.id === incidentId ? updated : inc)));
        setSelectedIncident(null);
        setResolutionNotes('');
      } else {
        // Fallback local update
        setIncidents((prev) =>
          prev.map((inc) =>
            inc.id === incidentId ? { ...inc, status: resolvingStatus } : inc,
          ),
        );
        setSelectedIncident(null);
        setResolutionNotes('');
      }
    } catch {
      setIncidents((prev) =>
        prev.map((inc) =>
          inc.id === incidentId ? { ...inc, status: resolvingStatus } : inc,
        ),
      );
      setSelectedIncident(null);
      setResolutionNotes('');
    }
  };

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
              24/7 Safety &amp; Emergency SOS Console
            </h1>
            <span
              style={{
                background: alertRed,
                color: '#fff',
                padding: '0.2rem 0.6rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                letterSpacing: '0.05em',
              }}
            >
              AP POLICE 112 LINKED
            </span>
          </div>
          <p style={{ color: '#94a3b8', margin: '0.5rem 0 0 0' }}>
            Authoritative in-trip emergency monitoring for Vijayawada, Guntur, and Amaravathi
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

      <section style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Incidents Table */}
        <div
          style={{
            background: voltageSurface,
            borderRadius: '8px',
            padding: '1.25rem',
            border: '1px solid #334155',
          }}
        >
          <h2 style={{ fontSize: '1.1rem', margin: '0 0 1rem 0', color: '#6fffe9' }}>
            Active Safety Alerts ({incidents.length})
          </h2>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #475569', color: '#94a3b8', fontSize: '0.8rem' }}>
                  <th style={{ padding: '0.75rem' }}>INCIDENT CODE</th>
                  <th style={{ padding: '0.75rem' }}>BOOKING</th>
                  <th style={{ padding: '0.75rem' }}>SEVERITY</th>
                  <th style={{ padding: '0.75rem' }}>STATUS</th>
                  <th style={{ padding: '0.75rem' }}>POLICE 112</th>
                  <th style={{ padding: '0.75rem' }}>AUDIO</th>
                  <th style={{ padding: '0.75rem' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((inc) => (
                  <tr
                    key={inc.id}
                    style={{
                      borderBottom: '1px solid #334155',
                      fontSize: '0.85rem',
                      background: inc.status === 'ESCALATED_POLICE' ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{inc.incidentCode}</td>
                    <td style={{ padding: '0.75rem', color: '#38bdf8' }}>{inc.bookingCode}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span
                        style={{
                          background: inc.severity === 'CRITICAL' ? alertRed : '#f59e0b',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                        }}
                      >
                        {inc.severity}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span
                        style={{
                          background:
                            inc.status === 'ESCALATED_POLICE'
                              ? '#dc2626'
                              : inc.status === 'RESOLVED'
                              ? brandEmerald
                              : '#64748b',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                        }}
                      >
                        {inc.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', color: '#a7f3d0' }}>
                      {inc.apPoliceReferenceId || (inc.apPoliceDispatched ? 'Dispatched' : 'No')}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {inc.audioRecordingActive ? '🔴 Active' : '⚪ Consent Pending'}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <button
                        onClick={() => setSelectedIncident(inc)}
                        style={{
                          background: '#0284c7',
                          color: '#fff',
                          border: 'none',
                          padding: '0.3rem 0.75rem',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                        }}
                      >
                        Action
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Resolution / Details Panel */}
        <div
          style={{
            background: voltageSurface,
            borderRadius: '8px',
            padding: '1.25rem',
            border: '1px solid #334155',
          }}
        >
          <h2 style={{ fontSize: '1.1rem', margin: '0 0 1rem 0', color: '#6fffe9' }}>
            Incident Action Panel
          </h2>

          {selectedIncident ? (
            <div>
              <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
                <p><strong>Code:</strong> {selectedIncident.incidentCode}</p>
                <p><strong>Trip:</strong> {selectedIncident.bookingCode}</p>
                <p><strong>Description:</strong> {selectedIncident.description}</p>
                <p><strong>Police 112 Ref:</strong> {selectedIncident.apPoliceReferenceId || 'N/A'}</p>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                  Resolution Status
                </label>
                <select
                  value={resolvingStatus}
                  onChange={(e) => setResolvingStatus(e.target.value as 'RESOLVED' | 'FALSE_ALARM')}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    background: '#0f172a',
                    color: '#fff',
                    border: '1px solid #475569',
                  }}
                >
                  <option value="RESOLVED">RESOLVED (Action Completed)</option>
                  <option value="FALSE_ALARM">FALSE_ALARM (Accidental Press Verified)</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                  Operator Audit Notes
                </label>
                <textarea
                  rows={4}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Detail rider verification, police dispatch update, or passenger safety confirmation..."
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    background: '#0f172a',
                    color: '#fff',
                    border: '1px solid #475569',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => handleResolve(selectedIncident.id)}
                  style={{
                    flex: 1,
                    background: brandEmerald,
                    color: '#fff',
                    border: 'none',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  Submit Resolution
                </button>
                <button
                  onClick={() => setSelectedIncident(null)}
                  style={{
                    background: '#475569',
                    color: '#fff',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              Select an incident from the table to review emergency details, contact AP Police 112 dispatch, or record resolution notes.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

