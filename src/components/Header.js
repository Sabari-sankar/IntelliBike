'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { vehicleStorage, settingsStorage } from '@/lib/storage';

const VEHICLE_EMOJI = { bike: '🏍️', car: '🚗', scooter: '🛵', truck: '🚛' };

export default function Header({ title, showVehicleSwitch = false }) {
  const [vehicles, setVehicles] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    setVehicles(vehicleStorage.getAll());
    setActiveId(settingsStorage.getActiveVehicleId());
    setTheme(settingsStorage.getTheme());
  }, []);

  const activeVehicle = vehicles.find((v) => v.id === activeId);

  const switchVehicle = (id) => {
    settingsStorage.setActiveVehicle(id);
    setActiveId(id);
    setShowPicker(false);
    window.location.reload();
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    settingsStorage.setTheme(next);
  };

  return (
    <>
      <style>{`
        .header {
          position: fixed; top: 0; left: 0; right: 0;
          height: var(--header-height);
          background: var(--header-bg);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
          display: flex; align-items: center;
          padding: env(safe-area-inset-top,0px) 16px 0;
          z-index: 50; gap: 10px;
        }
        .header-logo { font-size: 22px; flex-shrink: 0; }
        .header-title { font-size: 17px; font-weight: 700; color: var(--text); flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .header-actions { display: flex; align-items: center; gap: 6px; }
        .header-btn {
          width: 34px; height: 34px; border-radius: 10px;
          background: var(--surface); border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; cursor: pointer; transition: all 0.2s;
          text-decoration: none; color: var(--text-muted);
          -webkit-tap-highlight-color: transparent;
        }
        .header-btn:hover { border-color: var(--border-strong); color: var(--text); }
        .vehicle-btn {
          display: flex; align-items: center; gap: 5px;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 20px; padding: 5px 10px 5px 8px;
          cursor: pointer; transition: all 0.2s;
          font-family: inherit; color: var(--text); font-size: 13px; font-weight: 600;
          white-space: nowrap; max-width: 150px; overflow: hidden;
          -webkit-tap-highlight-color: transparent;
        }
        .vehicle-btn:hover { border-color: var(--primary); background: var(--primary-glow); }
        .vehicle-picker {
          position: fixed; top: calc(var(--header-height) + 8px); right: 16px;
          background: var(--picker-bg); border: 1px solid var(--border-strong);
          border-radius: var(--radius); padding: 8px; z-index: 60; min-width: 200px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.25);
        }
        .picker-item {
          display: flex; align-items: center; gap: 10px; padding: 10px 12px;
          border-radius: 10px; cursor: pointer; transition: background 0.15s;
          font-size: 14px; font-weight: 500; color: var(--text);
          -webkit-tap-highlight-color: transparent;
        }
        .picker-item:hover { background: var(--surface); }
        .picker-item.active-vehicle { background: var(--primary-glow); color: var(--primary); }
        .picker-divider { height: 1px; background: var(--border); margin: 6px 0; }
        .picker-add { color: var(--primary); font-weight: 600; text-decoration: none; }
        .overlay-close { position: fixed; inset: 0; z-index: 55; }
        .theme-btn {
          width: 34px; height: 34px; border-radius: 10px;
          background: var(--surface); border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          font-size: 17px; cursor: pointer; transition: all 0.2s;
          -webkit-tap-highlight-color: transparent;
        }
        .theme-btn:hover { border-color: var(--primary); background: var(--primary-glow); }
      `}</style>

      <header className="header">
        <span className="header-logo">⛽</span>
        <span className="header-title">{title || 'IntelliBike'}</span>

        <div className="header-actions">
          {showVehicleSwitch && vehicles.length > 0 && (
            <button className="vehicle-btn" onClick={() => setShowPicker(!showPicker)}>
              <span>{VEHICLE_EMOJI[activeVehicle?.type] || '🚗'}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 90 }}>
                {activeVehicle?.nickname || 'Select'}
              </span>
              <span style={{ fontSize: 9, color: 'var(--text-faint)' }}>▼</span>
            </button>
          )}

          {/* Theme Toggle */}
          <button className="theme-btn" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          <Link href="/vehicles" className="header-btn" title="Vehicles">🚗</Link>
        </div>
      </header>

      {showPicker && (
        <>
          <div className="overlay-close" onClick={() => setShowPicker(false)} />
          <div className="vehicle-picker">
            {vehicles.map((v) => (
              <div
                key={v.id}
                className={`picker-item${v.id === activeId ? ' active-vehicle' : ''}`}
                onClick={() => switchVehicle(v.id)}
              >
                <span>{VEHICLE_EMOJI[v.type] || '🚗'}</span>
                <div>
                  <div style={{ fontWeight: 600 }}>{v.nickname}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{v.model}</div>
                </div>
                {v.id === activeId && <span style={{ marginLeft: 'auto', fontSize: 13 }}>✓</span>}
              </div>
            ))}
            <div className="picker-divider" />
            <Link href="/vehicles" className="picker-item picker-add" onClick={() => setShowPicker(false)}>
              <span>➕</span> Add Vehicle
            </Link>
          </div>
        </>
      )}
    </>
  );
}
