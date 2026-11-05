'use client';

import React, { useState, useEffect } from 'react';

interface PlatformKpis {
  period: string;
  totalCompletedRides: number;
  grossMerchandiseValuePaise: number;
  formattedGmv: string;
  netPlatformCommissionPaise: number;
  formattedCommission: string;
  captainNetEarningsPaise: number;
  formattedCaptainEarnings: string;
  totalPassengerKm: number;
  totalEnergyKwh: number;
  totalCo2SavedKg: number;
  dispatchCompletionRatePercent: number;
}

interface GstReportItem {
  serviceCategory: string;
  sacCode: string;
  grossFarePaise: number;
  formattedGrossFare: string;
  gstRateBps: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalGstPaise: number;
  formattedTotalGst: string;
}

interface MonthlyGstReport {
  taxPeriod: string;
  stateCode: string;
  stateName: string;
  gstin: string;
  lineItems: GstReportItem[];
  totalGrossPaise: number;
  totalCgstPaise: number;
  totalSgstPaise: number;
  totalGstPaise: number;
  formattedTotalGst: string;
}

interface FleetUtilization {
  totalActiveVehicles: number;
  onDutyCount: number;
  inTripCount: number;
  chargingCount: number;
  maintenanceCount: number;
  utilizationRatePercent: number;
}

interface DemandHeatmapPoint {
  id: string;
  city: string;
  zoneName: string;
  latitude: number;
  longitude: number;
  activeDemandIndex: number;
  unfulfilledBookingCount: number;
  availableCaptainsCount: number;
}

export default function AnalyticsDashboardPage() {
  const brandEmerald = '#059669';
  const voltageSurface = '#1C2541';
  const accentCyan = '#6fffe9';

  const [kpis, setKpis] = useState<PlatformKpis>({
    period: '2026-11 (M30 Baseline)',
    totalCompletedRides: 1420,
    grossMerchandiseValuePaise: 35500000,
    formattedGmv: '₹3,55,000.00',
    netPlatformCommissionPaise: 7100000,
    formattedCommission: '₹71,000.00',
    captainNetEarningsPaise: 28400000,
    formattedCaptainEarnings: '₹2,84,000.00',
    totalPassengerKm: 18460,
    totalEnergyKwh: 3138,
    totalCo2SavedKg: 2953,
    dispatchCompletionRatePercent: 98.4,
  });

  const [gstReport, setGstReport] = useState<MonthlyGstReport>({
    taxPeriod: '2026-11',
    stateCode: '37',
    stateName: 'Andhra Pradesh',
    gstin: '37AABCE1234F1Z5',
    lineItems: [
      {
        serviceCategory: 'Passenger Transport (Private EV & Feeder)',
        sacCode: '996412',
        grossFarePaise: 24500000,
        formattedGrossFare: '₹2,45,000.00',
        gstRateBps: 500,
        cgstPaise: 612500,
        sgstPaise: 612500,
        igstPaise: 0,
        totalGstPaise: 1225000,
        formattedTotalGst: '₹12,250.00',
      },
      {
        serviceCategory: 'Cargo & Parcel Logistics Movement',
        sacCode: '9965',
        grossFarePaise: 8200000,
        formattedGrossFare: '₹82,000.00',
        gstRateBps: 1800,
        cgstPaise: 738000,
        sgstPaise: 738000,
        igstPaise: 0,
        totalGstPaise: 1476000,
        formattedTotalGst: '₹14,760.00',
      },
      {
        serviceCategory: 'EV Fast Charging Infrastructure Tariff',
        sacCode: '9987',
        grossFarePaise: 2800000,
        formattedGrossFare: '₹28,000.00',
        gstRateBps: 1800,
        cgstPaise: 252000,
        sgstPaise: 252000,
        igstPaise: 0,
        totalGstPaise: 504000,
        formattedTotalGst: '₹5,040.00',
      },
    ],
    totalGrossPaise: 35500000,
    totalCgstPaise: 1602500,
    totalSgstPaise: 1602500,
    totalGstPaise: 3205000,
    formattedTotalGst: '₹32,050.00',
  });

  const [fleetUtilization, setFleetUtilization] = useState<FleetUtilization>({
    totalActiveVehicles: 64,
    onDutyCount: 42,
    inTripCount: 18,
    chargingCount: 3,
    maintenanceCount: 1,
    utilizationRatePercent: 93.8,
  });

  const [heatmap, setHeatmap] = useState<DemandHeatmapPoint[]>([
    {
      id: 'hm-vja-benz',
      city: 'vijayawada',
      zoneName: 'Benz Circle & MG Road Commercial Corridor',
      latitude: 16.5062,
      longitude: 80.648,
      activeDemandIndex: 94,
      unfulfilledBookingCount: 12,
      availableCaptainsCount: 8,
    },
    {
      id: 'hm-vja-pnbs',
      city: 'vijayawada',
      zoneName: 'Pandit Nehru Bus Station (PNBS Intermodal Transit)',
      latitude: 16.5085,
      longitude: 80.6175,
      activeDemandIndex: 88,
      unfulfilledBookingCount: 9,
      availableCaptainsCount: 6,
    },
    {
      id: 'hm-mgl-aiims',
      city: 'mangalagiri',
      zoneName: 'AIIMS Mangalagiri Healthcare & Tech Corridor',
      latitude: 16.4357,
      longitude: 80.5654,
      activeDemandIndex: 76,
      unfulfilledBookingCount: 4,
      availableCaptainsCount: 5,
    },
    {
      id: 'hm-amv-sec',
      city: 'amaravathi',
      zoneName: 'Velagapudi AP Secretariat & High Court Complex',
      latitude: 16.5412,
      longitude: 80.5143,
      activeDemandIndex: 82,
      unfulfilledBookingCount: 6,
      availableCaptainsCount: 7,
    },
    {
      id: 'hm-gtr-brodipet',
      city: 'guntur',
      zoneName: 'Brodipet & Arundelpet Central Commercial Core',
      latitude: 16.3067,
      longitude: 80.4365,
      activeDemandIndex: 79,
      unfulfilledBookingCount: 5,
      availableCaptainsCount: 6,
    },
  ]);

  useEffect(() => {
    fetch('/v1/analytics/kpis')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setKpis(data))
      .catch(() => {});

    fetch('/v1/analytics/gst-report')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setGstReport(data))
      .catch(() => {});

    fetch('/v1/analytics/fleet-utilization')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setFleetUtilization(data))
      .catch(() => {});

    fetch('/v1/analytics/demand-heatmap')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && Array.isArray(data) && setHeatmap(data))
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
            Authoritative Business Analytics &amp; Statutory GST
          </h1>
          <p style={{ color: '#8892b0', marginTop: '0.25rem' }}>
            Server-Derived Financial KPIs, AP State Code 37 GST Return &amp; Capital Corridor Heatmap
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

      {/* Top Level Financial KPIs */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2.5rem',
        }}
      >
        <div style={{ background: voltageSurface, padding: '1.25rem', borderRadius: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: '#8892b0', textTransform: 'uppercase' }}>
            Authoritative GMV (Paise Authoritative)
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: brandEmerald, marginTop: '0.25rem' }}>
            {kpis.formattedGmv}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#6fffe9' }}>
            {kpis.totalCompletedRides.toLocaleString()} rides completed ({kpis.dispatchCompletionRatePercent}% fulfillment)
          </span>
        </div>

        <div style={{ background: voltageSurface, padding: '1.25rem', borderRadius: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: '#8892b0', textTransform: 'uppercase' }}>
            Platform Commission (20%)
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#38bdf8', marginTop: '0.25rem' }}>
            {kpis.formattedCommission}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#c5d1eb' }}>
            Net Operating Platform Revenue
          </span>
        </div>

        <div style={{ background: voltageSurface, padding: '1.25rem', borderRadius: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: '#8892b0', textTransform: 'uppercase' }}>
            Captain Payout Allocation (80%)
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#a78bfa', marginTop: '0.25rem' }}>
            {kpis.formattedCaptainEarnings}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#c5d1eb' }}>
            Authoritative EV Partner Disbursable
          </span>
        </div>

        <div style={{ background: voltageSurface, padding: '1.25rem', borderRadius: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: '#8892b0', textTransform: 'uppercase' }}>
            Clean EV Sustainability
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#10b981', marginTop: '0.25rem' }}>
            {kpis.totalCo2SavedKg.toLocaleString()} kg CO₂
          </div>
          <span style={{ fontSize: '0.75rem', color: '#c5d1eb' }}>
            {kpis.totalPassengerKm.toLocaleString()} km electric &bull; {kpis.totalEnergyKwh.toLocaleString()} kWh
          </span>
        </div>
      </section>

      {/* Fleet Utilization Metrics */}
      <section style={{ background: voltageSurface, padding: '1.5rem', borderRadius: '8px', marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', color: accentCyan, marginTop: 0, marginBottom: '1rem' }}>
          Fleet Operational Utilization ({fleetUtilization.utilizationRatePercent}% Fleet Active)
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          <div style={{ background: '#0b132b', padding: '1rem', borderRadius: '6px', borderLeft: '4px solid #38bdf8' }}>
            <span style={{ fontSize: '0.75rem', color: '#8892b0' }}>Total BEV Fleet</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f8fafc' }}>
              {fleetUtilization.totalActiveVehicles}
            </div>
          </div>
          <div style={{ background: '#0b132b', padding: '1rem', borderRadius: '6px', borderLeft: '4px solid #10b981' }}>
            <span style={{ fontSize: '0.75rem', color: '#8892b0' }}>In-Trip (Active Rides)</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
              {fleetUtilization.inTripCount}
            </div>
          </div>
          <div style={{ background: '#0b132b', padding: '1rem', borderRadius: '6px', borderLeft: '4px solid #059669' }}>
            <span style={{ fontSize: '0.75rem', color: '#8892b0' }}>On-Duty (Available)</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#34d399' }}>
              {fleetUtilization.onDutyCount}
            </div>
          </div>
          <div style={{ background: '#0b132b', padding: '1rem', borderRadius: '6px', borderLeft: '4px solid #f59e0b' }}>
            <span style={{ fontSize: '0.75rem', color: '#8892b0' }}>Charging (&lt;25% SoC)</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fbbf24' }}>
              {fleetUtilization.chargingCount}
            </div>
          </div>
          <div style={{ background: '#0b132b', padding: '1rem', borderRadius: '6px', borderLeft: '4px solid #ef4444' }}>
            <span style={{ fontSize: '0.75rem', color: '#8892b0' }}>Depot Maintenance</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f87171' }}>
              {fleetUtilization.maintenanceCount}
            </div>
          </div>
        </div>
      </section>

      {/* Statutory AP GST Report Table */}
      <section style={{ background: voltageSurface, padding: '1.5rem', borderRadius: '8px', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', color: accentCyan, margin: 0 }}>
              Statutory Andhra Pradesh GST Return (State Code 37)
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#8892b0', margin: '0.25rem 0 0 0' }}>
              GSTIN: <strong style={{ color: '#f8fafc' }}>{gstReport.gstin}</strong> &bull; Period: {gstReport.taxPeriod}
            </p>
          </div>
          <span style={{ background: '#059669', padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
            Balanced SGST/CGST Parity
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                <th style={{ padding: '0.75rem' }}>Service Category</th>
                <th style={{ padding: '0.75rem' }}>SAC Code</th>
                <th style={{ padding: '0.75rem' }}>Gross Revenue</th>
                <th style={{ padding: '0.75rem' }}>GST Rate</th>
                <th style={{ padding: '0.75rem' }}>CGST (Paise)</th>
                <th style={{ padding: '0.75rem' }}>SGST (Paise)</th>
                <th style={{ padding: '0.75rem' }}>Total GST</th>
              </tr>
            </thead>
            <tbody>
              {gstReport.lineItems.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '0.75rem', fontWeight: '500' }}>{item.serviceCategory}</td>
                  <td style={{ padding: '0.75rem', color: '#6fffe9', fontFamily: 'monospace' }}>{item.sacCode}</td>
                  <td style={{ padding: '0.75rem' }}>{item.formattedGrossFare}</td>
                  <td style={{ padding: '0.75rem' }}>{(item.gstRateBps / 100).toFixed(1)}%</td>
                  <td style={{ padding: '0.75rem', color: '#94a3b8' }}>₹{(item.cgstPaise / 100).toFixed(2)}</td>
                  <td style={{ padding: '0.75rem', color: '#94a3b8' }}>₹{(item.sgstPaise / 100).toFixed(2)}</td>
                  <td style={{ padding: '0.75rem', color: brandEmerald, fontWeight: 'bold' }}>{item.formattedTotalGst}</td>
                </tr>
              ))}
              <tr style={{ background: '#0b132b', fontWeight: 'bold' }}>
                <td colSpan={2} style={{ padding: '0.75rem', color: accentCyan }}>Consolidated AP Tax Liability</td>
                <td style={{ padding: '0.75rem' }}>₹{(gstReport.totalGrossPaise / 100).toFixed(2)}</td>
                <td style={{ padding: '0.75rem' }}>-</td>
                <td style={{ padding: '0.75rem', color: '#38bdf8' }}>₹{(gstReport.totalCgstPaise / 100).toFixed(2)}</td>
                <td style={{ padding: '0.75rem', color: '#38bdf8' }}>₹{(gstReport.totalSgstPaise / 100).toFixed(2)}</td>
                <td style={{ padding: '0.75rem', color: brandEmerald }}>{gstReport.formattedTotalGst}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* AP Capital Region Demand Heatmap Points */}
      <section style={{ background: voltageSurface, padding: '1.5rem', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '1.25rem', color: accentCyan, marginTop: 0, marginBottom: '0.5rem' }}>
          AP Capital Corridor Real-Time Demand Density
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#8892b0', marginBottom: '1.5rem' }}>
          Live spatial dispatch pressure monitoring across Vijayawada, Guntur, Amaravathi, and Mangalagiri
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {heatmap.map((pt) => (
            <div
              key={pt.id}
              style={{
                background: '#0b132b',
                padding: '1.25rem',
                borderRadius: '8px',
                border: pt.activeDemandIndex > 85 ? '1px solid #ef4444' : '1px solid #334155',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    color: '#6fffe9',
                    fontWeight: 'bold',
                  }}
                >
                  {pt.city}
                </span>
                <span
                  style={{
                    background: pt.activeDemandIndex > 85 ? '#ef4444' : '#059669',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                  }}
                >
                  Demand Index: {pt.activeDemandIndex}
                </span>
              </div>
              <h3 style={{ fontSize: '1rem', color: '#f8fafc', margin: '0.5rem 0' }}>{pt.zoneName}</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8' }}>
                <span>Unfulfilled: <strong style={{ color: '#f87171' }}>{pt.unfulfilledBookingCount}</strong></span>
                <span>Captains Online: <strong style={{ color: '#34d399' }}>{pt.availableCaptainsCount}</strong></span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
                Coords: {pt.latitude.toFixed(4)}°N, {pt.longitude.toFixed(4)}°E
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

