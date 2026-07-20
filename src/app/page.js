'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { vehicleStorage } from '@/lib/storage';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (vehicleStorage.hasVehicles()) {
      router.replace('/dashboard');
    } else {
      router.replace('/setup');
    }
  }, [router]);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', flexDirection: 'column', gap: 16
    }}>
      <div style={{ fontSize: 48 }}>⛽</div>
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading FuelBook...</p>
    </div>
  );
}
