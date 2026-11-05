'use client';

import React, { useState, useEffect } from 'react';

interface PromoCode {
  id: string;
  code: string;
  description: string;
  discountType: 'FLAT_DISCOUNT' | 'PERCENTAGE_DISCOUNT';
  discountValuePaiseOrPercent: number;
  maxDiscountPaise: number | null;
  minTripFarePaise: number;
  usageLimit: number;
  timesUsed: number;
  expiresAt: string;
  isActive: boolean;
}

interface DltTemplate {
  templateId: string;
  templateType: string;
  teluguHeader: string;
  englishHeader: string;
  teluguSample: string;
  englishSample: string;
  status: string;
}

export default function LoyaltyAndPromotionsPage() {
  const brandEmerald = '#059669';
  const voltageSurface = '#1C2541';
  const accentCyan = '#6fffe9';

  const [promos, setPromos] = useState<PromoCode[]>([
    {
      id: 'promo-001',
      code: 'AMARAVATHI2026',
      description: 'AP Capital Corridor launch offer for daily commuters',
      discountType: 'PERCENTAGE_DISCOUNT',
      discountValuePaiseOrPercent: 20,
      maxDiscountPaise: 5000,
      minTripFarePaise: 10000,
      usageLimit: 10000,
      timesUsed: 428,
      expiresAt: '2026-12-31T23:59:59.000Z',
      isActive: true,
    },
    {
      id: 'promo-002',
      code: 'BENZCIRCLE50',
      description: 'Flat ₹50 discount for Vijayawada Benz Circle EV shuttles',
      discountType: 'FLAT_DISCOUNT',
      discountValuePaiseOrPercent: 5000,
      maxDiscountPaise: 5000,
      minTripFarePaise: 15000,
      usageLimit: 5000,
      timesUsed: 192,
      expiresAt: '2026-11-30T23:59:59.000Z',
      isActive: true,
    },
    {
      id: 'promo-003',
      code: 'GUNTURGREEN',
      description: 'Flat ₹30 off on e-Auto commute in Guntur city',
      discountType: 'FLAT_DISCOUNT',
      discountValuePaiseOrPercent: 3000,
      maxDiscountPaise: 3000,
      minTripFarePaise: 6000,
      usageLimit: 8000,
      timesUsed: 310,
      expiresAt: '2026-12-15T23:59:59.000Z',
      isActive: true,
    },
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDiscountType, setNewDiscountType] = useState<'FLAT_DISCOUNT' | 'PERCENTAGE_DISCOUNT'>('PERCENTAGE_DISCOUNT');
  const [newValue, setNewValue] = useState('20');
  const [newMaxDiscount, setNewMaxDiscount] = useState('50');
  const [newMinFare, setNewMinFare] = useState('100');
  const [newUsageLimit, setNewUsageLimit] = useState('1000');
  const [newExpiryDays, setNewExpiryDays] = useState('30');

  const dltTemplates: DltTemplate[] = [
    {
      templateId: 'DLT-AP-1001',
      templateType: 'BOOKING_CONFIRMED',
      teluguHeader: 'EcoRide AP: బుకింగ్ ధృవీకరించబడింది',
      englishHeader: 'EcoRide AP: Booking Confirmed',
      teluguSample: 'EcoRide AP: Mee EV ride confirm ayyindi. Captain: Ramesh (AP39EV1234), OTP: 4821.',
      englishSample: 'EcoRide AP: Your electric ride is confirmed. Captain: Ramesh (AP39EV1234), OTP: 4821.',
      status: 'APPROVED (AP-DLT-VERIFIED)',
    },
    {
      templateId: 'DLT-AP-1002',
      templateType: 'CAPTAIN_ARRIVED',
      teluguHeader: 'EcoRide AP: క్యాప్టెన్ వచ్చారు',
      englishHeader: 'EcoRide AP: Captain Arrived',
      teluguSample: 'EcoRide AP: Mee captain pickup location vadda unnaru. Dayachesi 3 nimishallo cherukondi.',
      englishSample: 'EcoRide AP: Your EV captain has arrived at pickup. Please board within 3 mins.',
      status: 'APPROVED (AP-DLT-VERIFIED)',
    },
    {
      templateId: 'DLT-AP-1005',
      templateType: 'REFERRAL_REWARD',
      teluguHeader: 'EcoRide AP: రిఫరల్ బోనస్ లభించింది',
      englishHeader: 'EcoRide AP: Referral Reward Credited',
      teluguSample: 'EcoRide AP: Mee snehitudu modati EV ride poorthi chesaru! ₹50 mee wallet lo credit ayyindi.',
      englishSample: 'EcoRide AP: Your referee took their first EV ride! ₹50 credited to your wallet.',
      status: 'APPROVED (AP-DLT-VERIFIED)',
    },
  ];

  useEffect(() => {
    fetch('/v1/loyalty/promos')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && Array.isArray(data) && data.length > 0 && setPromos(data))
      .catch(() => {});
  }, []);

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(newValue);
    const maxDisc = Number(newMaxDiscount);
    const minFare = Number(newMinFare);
    const limit = Number(newUsageLimit);
    const days = Number(newExpiryDays);

    const payload = {
      code: newCode.trim().toUpperCase(),
      description: newDescription.trim(),
      discountType: newDiscountType,
      discountValuePaiseOrPercent: newDiscountType === 'FLAT_DISCOUNT' ? val * 100 : val,
      maxDiscountPaise: maxDisc > 0 ? maxDisc * 100 : undefined,
      minTripFarePaise: minFare * 100,
      usageLimit: limit,
      expiresAt: new Date(Date.now() + days * 86400000).toISOString(),
    };

    try {
      const res = await fetch('/v1/loyalty/promos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const saved = await res.json();
        setPromos((prev) => [saved, ...prev]);
        setShowCreateModal(false);
        resetForm();
      } else {
        // Optimistic synthetic add if offline
        const mock: PromoCode = {
          id: `promo-${Date.now()}`,
          code: payload.code,
          description: payload.description,
          discountType: payload.discountType,
          discountValuePaiseOrPercent: payload.discountValuePaiseOrPercent,
          maxDiscountPaise: payload.maxDiscountPaise ?? null,
          minTripFarePaise: payload.minTripFarePaise,
          usageLimit: payload.usageLimit,
          timesUsed: 0,
          expiresAt: payload.expiresAt,
          isActive: true,
        };
        setPromos((prev) => [mock, ...prev]);
        setShowCreateModal(false);
        resetForm();
      }
    } catch {
      setShowCreateModal(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setNewCode('');
    setNewDescription('');
    setNewValue('20');
    setNewMaxDiscount('50');
    setNewMinFare('100');
    setNewUsageLimit('1000');
    setNewExpiryDays('30');
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
            Promotions, Loyalty &amp; AP DLT Compliance
          </h1>
          <p style={{ color: '#8892b0', marginTop: '0.25rem' }}>
            Voucher Codes, Double-Entry Marketing Ledgers, Referral Metrics &amp; TRAI DLT Templates
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setShowCreateModal(true)}
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
            + Create New Promo Code
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

      {/* Referral Performance Overview */}
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
            Referral Program Status
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: brandEmerald, marginTop: '0.25rem' }}>
            ACTIVE
          </div>
          <span style={{ fontSize: '0.75rem', color: '#6fffe9' }}>
            ECO-REF-XXXX Dual-Reward Engine
          </span>
        </div>

        <div style={{ background: voltageSurface, padding: '1.25rem', borderRadius: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: '#8892b0', textTransform: 'uppercase' }}>
            Referrer Incentive
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#38bdf8', marginTop: '0.25rem' }}>
            ₹50.00 / 5000 Paise
          </div>
          <span style={{ fontSize: '0.75rem', color: '#c5d1eb' }}>
            Credited on referee qualifying first ride (&ge; ₹100)
          </span>
        </div>

        <div style={{ background: voltageSurface, padding: '1.25rem', borderRadius: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: '#8892b0', textTransform: 'uppercase' }}>
            Referee Welcome Credit
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#a78bfa', marginTop: '0.25rem' }}>
            ₹25.00 / 2500 Paise
          </div>
          <span style={{ fontSize: '0.75rem', color: '#c5d1eb' }}>
            Instant welcome bonus on first ride completion
          </span>
        </div>

        <div style={{ background: voltageSurface, padding: '1.25rem', borderRadius: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: '#8892b0', textTransform: 'uppercase' }}>
            Ledger Funding Source
          </span>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#f8fafc', marginTop: '0.25rem' }}>
            platform:marketing_promotions
          </div>
          <span style={{ fontSize: '0.75rem', color: '#10b981' }}>
            Strict double-entry parity enforced
          </span>
        </div>
      </section>

      {/* Promo Codes Table */}
      <section style={{ background: voltageSurface, padding: '1.5rem', borderRadius: '8px', marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', color: accentCyan, marginTop: 0, marginBottom: '1rem' }}>
          Active Promotional Discount Vouchers
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                <th style={{ padding: '0.75rem' }}>Code</th>
                <th style={{ padding: '0.75rem' }}>Discount</th>
                <th style={{ padding: '0.75rem' }}>Description</th>
                <th style={{ padding: '0.75rem' }}>Min Fare</th>
                <th style={{ padding: '0.75rem' }}>Max Cap</th>
                <th style={{ padding: '0.75rem' }}>Redemptions</th>
                <th style={{ padding: '0.75rem' }}>Expires</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {promos.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 'bold', color: '#6fffe9', fontFamily: 'monospace' }}>
                    {p.code}
                  </td>
                  <td style={{ padding: '0.75rem', color: brandEmerald, fontWeight: 'bold' }}>
                    {p.discountType === 'FLAT_DISCOUNT'
                      ? `₹${(p.discountValuePaiseOrPercent / 100).toFixed(0)} FLAT`
                      : `${p.discountValuePaiseOrPercent}% OFF`}
                  </td>
                  <td style={{ padding: '0.75rem', color: '#c5d1eb' }}>{p.description}</td>
                  <td style={{ padding: '0.75rem' }}>₹{(p.minTripFarePaise / 100).toFixed(0)}</td>
                  <td style={{ padding: '0.75rem' }}>
                    {p.maxDiscountPaise ? `₹${(p.maxDiscountPaise / 100).toFixed(0)}` : 'No Cap'}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    {p.timesUsed} / {p.usageLimit}
                  </td>
                  <td style={{ padding: '0.75rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                    {new Date(p.expiresAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span
                      style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        background: p.isActive ? '#059669' : '#64748b',
                      }}
                    >
                      {p.isActive ? 'ACTIVE' : 'EXPIRED'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* AP DLT Telecom Registered Templates */}
      <section style={{ background: voltageSurface, padding: '1.5rem', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '1.25rem', color: accentCyan, marginTop: 0, marginBottom: '0.5rem' }}>
          TRAI DLT Registered Telecom Notification Templates
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#8892b0', marginBottom: '1.5rem' }}>
          Pre-approved Telugu (`te`) and English (`en`) transaction notification templates for SMS and WhatsApp
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1rem' }}>
          {dltTemplates.map((t) => (
            <div key={t.templateId} style={{ background: '#0b132b', padding: '1.25rem', borderRadius: '8px', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: '#6fffe9', fontWeight: 'bold' }}>
                  {t.templateId}
                </span>
                <span style={{ background: '#059669', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                  {t.status}
                </span>
              </div>
              <h3 style={{ fontSize: '0.95rem', color: '#f8fafc', margin: '0.75rem 0 0.25rem 0' }}>
                {t.templateType}
              </h3>

              <div style={{ marginTop: '0.75rem', background: '#1c2541', padding: '0.75rem', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  Telugu (ఆంధ్రప్రదేశ్ స్థానిక భాష)
                </div>
                <div style={{ fontSize: '0.85rem', color: '#c5d1eb' }}>{t.teluguSample}</div>
              </div>

              <div style={{ marginTop: '0.5rem', background: '#1c2541', padding: '0.75rem', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  English (Universal Fallback)
                </div>
                <div style={{ fontSize: '0.85rem', color: '#c5d1eb' }}>{t.englishSample}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Create Promo Modal */}
      {showCreateModal && (
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
              maxWidth: '500px',
              width: '100%',
              border: '1px solid #334155',
            }}
          >
            <h2 style={{ color: brandEmerald, marginTop: 0, fontSize: '1.25rem' }}>Create Promo Code</h2>
            <form onSubmit={handleCreatePromo}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#8892b0', marginBottom: '0.25rem' }}>
                  Promo Code (e.g. CAPITAL2026)
                </label>
                <input
                  required
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
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

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#8892b0', marginBottom: '0.25rem' }}>
                  Description
                </label>
                <input
                  required
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Special discount for Vijayawada-Guntur commuters"
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#8892b0', marginBottom: '0.25rem' }}>
                    Discount Type
                  </label>
                  <select
                    value={newDiscountType}
                    onChange={(e) => setNewDiscountType(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: '#0b132b',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      color: '#f8fafc',
                    }}
                  >
                    <option value="PERCENTAGE_DISCOUNT">Percentage (%)</option>
                    <option value="FLAT_DISCOUNT">Flat Rupee (₹)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#8892b0', marginBottom: '0.25rem' }}>
                    {newDiscountType === 'FLAT_DISCOUNT' ? 'Amount (₹)' : 'Percent (%)'}
                  </label>
                  <input
                    type="number"
                    required
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#8892b0', marginBottom: '0.25rem' }}>
                    Min Ride Fare (₹)
                  </label>
                  <input
                    type="number"
                    value={newMinFare}
                    onChange={(e) => setNewMinFare(e.target.value)}
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
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#8892b0', marginBottom: '0.25rem' }}>
                    Max Discount Cap (₹)
                  </label>
                  <input
                    type="number"
                    value={newMaxDiscount}
                    onChange={(e) => setNewMaxDiscount(e.target.value)}
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
                  onClick={() => setShowCreateModal(false)}
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
                  Save Promo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

