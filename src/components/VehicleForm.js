'use client';
import { useState } from 'react';
import DatePicker from '@/components/DatePicker';

const VEHICLE_TYPES = [
  { value: 'bike', label: '🏍️ Bike' },
  { value: 'scooter', label: '🛵 Scooter' },
  { value: 'car', label: '🚗 Car' },
  { value: 'truck', label: '🚛 Truck' },
];

const FUEL_TYPES = [
  { value: 'petrol', label: '⛽ Petrol' },
  { value: 'diesel', label: '🛢️ Diesel' },
  { value: 'electric', label: '⚡ Electric' },
  { value: 'cng', label: '💨 CNG' },
];

export default function VehicleForm({ initial = null, onSave, onCancel }) {
  const [form, setForm] = useState({
    nickname: initial?.nickname || '',
    model: initial?.model || '',
    type: initial?.type || 'bike',
    fuelType: initial?.fuelType || 'petrol',
    deliveryDate: initial?.deliveryDate || '',
    tankCapacity: initial?.tankCapacity || '',
    color: initial?.color || '',
    regNumber: initial?.regNumber || '',
  });
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.nickname.trim()) e.nickname = 'Nickname is required';
    if (!form.model.trim()) e.model = 'Model is required';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Type chips */}
      <div className="form-group">
        <label className="form-label">Vehicle Type</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {VEHICLE_TYPES.map((t) => (
            <button
              type="button" key={t.value}
              className={`type-chip${form.type === t.value ? ' selected' : ''}`}
              onClick={() => set('type', t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">Nickname *</label>
          <input
            className="form-input" placeholder="e.g. My Pulsar"
            value={form.nickname} onChange={(e) => set('nickname', e.target.value)}
          />
          {errors.nickname && <span style={{ fontSize: 12, color: 'var(--red)' }}>{errors.nickname}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Model *</label>
          <input
            className="form-input" placeholder="e.g. Bajaj Pulsar NS200"
            value={form.model} onChange={(e) => set('model', e.target.value)}
          />
          {errors.model && <span style={{ fontSize: 12, color: 'var(--red)' }}>{errors.model}</span>}
        </div>
      </div>

      {/* Fuel Type */}
      <div className="form-group">
        <label className="form-label">Fuel Type</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {FUEL_TYPES.map((f) => (
            <button
              type="button" key={f.value}
              className={`type-chip${form.fuelType === f.value ? ' selected' : ''}`}
              onClick={() => set('fuelType', f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">Delivery / Purchase Date</label>
          <DatePicker
            value={form.deliveryDate}
            onChange={(v) => set('deliveryDate', v)}
            maxDate={new Date().toISOString().split('T')[0]}
            placeholder="Select date"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Tank Capacity (L)</label>
          <input
            type="number" className="form-input" placeholder="e.g. 12"
            value={form.tankCapacity} onChange={(e) => set('tankCapacity', e.target.value)}
            min="0" step="0.5"
          />
        </div>
      </div>

      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">Color</label>
          <input
            className="form-input" placeholder="e.g. Midnight Black"
            value={form.color} onChange={(e) => set('color', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Registration No.</label>
          <input
            className="form-input" placeholder="e.g. TN 01 AB 1234"
            value={form.regNumber} onChange={(e) => set('regNumber', e.target.value.toUpperCase())}
            style={{ textTransform: 'uppercase' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        {onCancel && (
          <button type="button" className="btn btn-ghost btn-full" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary btn-full">
          {initial ? '✓ Update Vehicle' : '🚗 Add Vehicle'}
        </button>
      </div>
    </form>
  );
}
