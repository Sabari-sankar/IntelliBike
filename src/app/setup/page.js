'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { vehicleStorage } from '@/lib/storage';
import VehicleForm from '@/components/VehicleForm';

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0 = welcome, 1 = form

  useEffect(() => {
    if (vehicleStorage.hasVehicles()) router.replace('/dashboard');
  }, [router]);

  const handleSave = (data) => {
    vehicleStorage.add(data);
    router.replace('/dashboard');
  };

  if (step === 0) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '32px 24px', textAlign: 'center',
        background: 'radial-gradient(ellipse at top, rgba(245,158,11,0.08) 0%, var(--bg) 60%)'
      }}>
        {/* Hero */}
        <img src="/logo.png" alt="IntelliBike Logo" style={{ width: 84, height: 84, borderRadius: 20, marginBottom: 16, boxShadow: '0 8px 32px rgba(245,158,11,0.25)', objectFit: 'cover' }} />
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 8 }}>
          Welcome to <span style={{ color: 'var(--primary)' }}>IntelliBike</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 15, maxWidth: 300, marginBottom: 48 }}>
          Track your fuel expenses, mileage, and service records — completely offline, no ads.
        </p>

        {/* Features */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 320, marginBottom: 40 }}>
          {[
            { icon: '⛽', label: 'Track every petrol fill-up' },
            { icon: '📊', label: 'View mileage & expense graphs' },
            { icon: '📅', label: 'Calendar with fuel & service dates' },
            { icon: '🔧', label: 'Service record management' },
            { icon: '🌐', label: 'Works 100% offline' },
          ].map(({ icon, label }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '12px 16px'
            }}>
              <span style={{ fontSize: 20 }}>{icon}</span>
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{label}</span>
            </div>
          ))}
        </div>

        <button className="btn btn-primary" style={{ padding: '16px 48px', fontSize: 16 }} onClick={() => setStep(1)}>
          Get Started →
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', padding: '24px 16px',
      background: 'radial-gradient(ellipse at top, rgba(245,158,11,0.06) 0%, var(--bg) 60%)'
    }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <button
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer', marginBottom: 20, padding: 0 }}
          onClick={() => setStep(0)}
        >
          ← Back
        </button>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 6 }}>
            Add Your <span style={{ color: 'var(--primary)' }}>Vehicle</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Enter details about your bike or car to get started.
          </p>
        </div>

        <div className="card">
          <VehicleForm onSave={handleSave} />
        </div>
      </div>
    </div>
  );
}
