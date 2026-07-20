'use client';
import { useState } from 'react';
import DatePicker from '@/components/DatePicker';

const SERVICE_TYPES = [
  'General Service', 'Oil Change', 'Air Filter', 'Spark Plug',
  'Chain Lube / Adjustment', 'Tyre Change', 'Brake Service',
  'Battery Replacement', 'Coolant Change', 'Clutch Service', 'Other'
];

export default function ServiceForm({ vehicleId, initial = null, onSave, onCancel }) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    date: initial?.date || today,
    type: initial?.type || 'General Service',
    cost: initial?.cost || '',
    odometerKm: initial?.odometerKm || '',
    nextServiceKm: initial?.nextServiceKm || '',
    notes: initial?.notes || '',
  });
  const [errors, setErrors] = useState({});
  const [customType, setCustomType] = useState(
    initial?.type && !SERVICE_TYPES.includes(initial.type) ? initial.type : ''
  );

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.date) e.date = 'Date required';
    if (!form.type) e.type = 'Type required';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const finalType = form.type === 'Other' ? (customType || 'Other') : form.type;
    onSave({ ...form, type: finalType, vehicleId });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Service type chips */}
      <div className="form-group">
        <label className="form-label">🔧 Service Type *</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {SERVICE_TYPES.map((t) => (
            <button
              type="button" key={t}
              className={`type-chip${form.type === t ? ' selected' : ''}`}
              style={{ fontSize: 12, padding: '5px 12px' }}
              onClick={() => set('type', t)}
            >
              {t}
            </button>
          ))}
        </div>
        {form.type === 'Other' && (
          <input
            className="form-input" placeholder="Describe the service..."
            value={customType} onChange={(e) => setCustomType(e.target.value)}
            style={{ marginTop: 8 }}
          />
        )}
      </div>

      {/* Date — full-width custom picker */}
      <div className="form-group">
        <label className="form-label">📅 Service Date *</label>
        <DatePicker
          value={form.date}
          onChange={(v) => set('date', v)}
          maxDate={new Date().toISOString().split('T')[0]}
          placeholder="Select service date"
        />
        {errors.date && <span style={{ fontSize: 12, color: 'var(--red)' }}>{errors.date}</span>}
      </div>

      {/* Cost + Odometer */}
      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">💰 Cost (₹)</label>
          <input
            type="number" className="form-input" placeholder="e.g. 850"
            value={form.cost} onChange={(e) => set('cost', e.target.value)}
            min="0" step="1"
          />
        </div>
        <div className="form-group">
          <label className="form-label">📍 Odometer (km)</label>
          <input
            type="number" className="form-input" placeholder="e.g. 15000"
            value={form.odometerKm} onChange={(e) => set('odometerKm', e.target.value)}
            min="0"
          />
        </div>
      </div>

      {/* Next service */}
      <div className="form-group">
        <label className="form-label">⏭️ Next Service At (km)</label>
        <input
          type="number" className="form-input" placeholder="e.g. 16500"
          value={form.nextServiceKm} onChange={(e) => set('nextServiceKm', e.target.value)}
          min="0"
        />
      </div>

      <div className="form-group">
        <label className="form-label">📝 Notes</label>
        <textarea
          className="form-input" placeholder="Additional notes..."
          value={form.notes} onChange={(e) => set('notes', e.target.value)}
          style={{ minHeight: 70 }}
        />
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        {onCancel && (
          <button type="button" className="btn btn-ghost btn-full" onClick={onCancel}>Cancel</button>
        )}
        <button type="submit" className="btn btn-primary btn-full">
          {initial ? '✓ Update Service' : '🔧 Save Record'}
        </button>
      </div>
    </form>
  );
}
