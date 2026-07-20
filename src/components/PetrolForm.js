'use client';
import { useState, useEffect } from 'react';
import DatePicker from '@/components/DatePicker';
import { settingsStorage, petrolStorage } from '@/lib/storage';

export default function PetrolForm({ vehicleId, initial = null, onSave, onCancel }) {
  const currency = settingsStorage.getCurrency();
  const today = new Date().toISOString().split('T')[0];

  // fillMode: 'amount' = enter total ₹ → auto-calc liters
  //           'liters' = enter liters directly
  const [fillMode, setFillMode] = useState(initial ? 'liters' : 'amount');
  const [prevLog, setPrevLog] = useState(null);

  const [form, setForm] = useState({
    date: initial?.date || today,
    odometerKm: initial?.odometerKm || '',
    liters: initial?.liters || '',
    pricePerLiter: initial?.pricePerLiter || '',
    totalCost: initial?.totalCost || '',
    notes: initial?.notes || '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (vehicleId) {
      const logs = petrolStorage.getByVehicle(vehicleId);
      // find previous log (excluding current editing log if initial is provided)
      const prev = logs.find((l) => l.id !== initial?.id);
      setPrevLog(prev || null);
    }
  }, [vehicleId, initial]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Live computed liters & total
  const computedLiters = fillMode === 'amount' && form.totalCost && form.pricePerLiter
    ? (parseFloat(form.totalCost) / parseFloat(form.pricePerLiter)).toFixed(2)
    : null;

  const computedTotal = fillMode === 'liters' && form.liters && form.pricePerLiter
    ? (parseFloat(form.liters) * parseFloat(form.pricePerLiter)).toFixed(2)
    : null;

  const displayLiters = fillMode === 'liters' ? form.liters : computedLiters;
  const displayTotal  = fillMode === 'amount' ? form.totalCost : computedTotal;

  // Live mileage calculation based on distance driven & fuel from previous fill
  const currentOdo = parseFloat(form.odometerKm) || 0;
  const prevOdo = prevLog ? prevLog.odometerKm : 0;
  const kmDriven = (prevLog && currentOdo > prevOdo) ? currentOdo - prevOdo : 0;
  const prevLiters = prevLog ? prevLog.liters : 0;
  const liveMileage = (kmDriven > 0 && prevLiters > 0) ? (kmDriven / prevLiters).toFixed(2) : null;

  const validate = () => {
    const e = {};
    if (!form.date) e.date = 'Date is required';
    if (!form.odometerKm || parseFloat(form.odometerKm) < 0) e.odometerKm = 'Valid odometer required';
    if (prevLog && parseFloat(form.odometerKm) <= prevLog.odometerKm) {
      e.odometerKm = `Odometer must be greater than previous (${prevLog.odometerKm.toLocaleString()} km)`;
    }
    if (!form.pricePerLiter || parseFloat(form.pricePerLiter) <= 0) e.pricePerLiter = 'Price must be > 0';
    if (fillMode === 'amount') {
      if (!form.totalCost || parseFloat(form.totalCost) <= 0) e.totalCost = 'Total amount must be > 0';
    } else {
      if (!form.liters || parseFloat(form.liters) <= 0) e.liters = 'Liters must be > 0';
    }
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({ ...form, vehicleId, fillMode });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Fill Mode Toggle */}
      <div className="form-group">
        <label className="form-label">Fill Entry Mode</label>
        <div className="fill-mode-toggle">
          <button
            type="button"
            className={`fill-mode-btn${fillMode === 'amount' ? ' active' : ''}`}
            onClick={() => setFillMode('amount')}
          >
            💰 By Amount (₹)
          </button>
          <button
            type="button"
            className={`fill-mode-btn${fillMode === 'liters' ? ' active' : ''}`}
            onClick={() => setFillMode('liters')}
          >
            ⛽ By Liters
          </button>
        </div>
      </div>

      {/* Date & Odometer */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="form-group">
          <label className="form-label">📅 Date *</label>
          <DatePicker
            value={form.date}
            onChange={(v) => set('date', v)}
            maxDate={new Date().toISOString().split('T')[0]}
            placeholder="Select fill-up date"
          />
          {errors.date && <span style={{ fontSize: 12, color: 'var(--red)' }}>{errors.date}</span>}
        </div>
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="form-label">🔢 Current Odometer (km) *</label>
            {prevLog && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Previous: <strong style={{ color: 'var(--primary)' }}>{prevLog.odometerKm.toLocaleString()} km</strong>
              </span>
            )}
          </div>
          <input
            type="number" className="form-input"
            placeholder={prevLog ? `e.g. ${prevLog.odometerKm + 350}` : "e.g. 1500"}
            value={form.odometerKm} onChange={(e) => set('odometerKm', e.target.value)}
            min="0" step="1"
          />
          {errors.odometerKm && <span style={{ fontSize: 12, color: 'var(--red)' }}>{errors.odometerKm}</span>}
        </div>
      </div>

      {/* Price / Liter — always required */}
      <div className="form-group">
        <label className="form-label">💲 Fuel Price ({currency}/Liter) *</label>
        <input
          type="number" className="form-input" placeholder="e.g. 108.50"
          value={form.pricePerLiter} onChange={(e) => set('pricePerLiter', e.target.value)}
          min="0" step="0.01"
        />
        {errors.pricePerLiter && <span style={{ fontSize: 12, color: 'var(--red)' }}>{errors.pricePerLiter}</span>}
      </div>

      {/* Conditional field */}
      {fillMode === 'amount' ? (
        <div className="form-group">
          <label className="form-label">💰 Total Amount Paid ({currency}) *</label>
          <input
            type="number" className="form-input" placeholder="e.g. 500"
            value={form.totalCost} onChange={(e) => set('totalCost', e.target.value)}
            min="0" step="0.01"
          />
          {errors.totalCost && <span style={{ fontSize: 12, color: 'var(--red)' }}>{errors.totalCost}</span>}
          {/* Show computed liters */}
          {computedLiters && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginTop: 4,
              padding: '8px 12px', background: 'var(--blue-glow)',
              border: '1px solid rgba(59,130,246,0.25)', borderRadius: 8
            }}>
              <span style={{ fontSize: 13 }}>⛽</span>
              <span style={{ fontSize: 13, color: 'var(--text)' }}>
                Auto-calculated: <strong style={{ color: 'var(--blue)' }}>{computedLiters}L</strong>
                {' '}({currency}{form.totalCost} ÷ {currency}{form.pricePerLiter}/L)
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="form-group">
          <label className="form-label">⛽ Liters Filled *</label>
          <input
            type="number" className="form-input" placeholder="e.g. 8.5"
            value={form.liters} onChange={(e) => set('liters', e.target.value)}
            min="0" step="0.01"
          />
          {errors.liters && <span style={{ fontSize: 12, color: 'var(--red)' }}>{errors.liters}</span>}
        </div>
      )}

      {/* Live Mileage Calculation Box */}
      {prevLog && kmDriven > 0 && prevLiters > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, var(--emerald-glow) 0%, rgba(16,185,129,0.05) 100%)',
          border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--emerald)' }}>
              ⚡ Live Mileage Calculation
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--emerald)' }}>
              {liveMileage} <span style={{ fontSize: 11, fontWeight: 600 }}>km/L</span>
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
            <div>🛣️ Distance Driven: <strong>{currentOdo.toLocaleString()} km - {prevOdo.toLocaleString()} km = {kmDriven.toLocaleString()} km</strong></div>
            <div>⛽ Fuel Consumed: <strong>{prevLiters} L (from previous fill at {prevOdo.toLocaleString()} km)</strong></div>
            <div style={{ color: 'var(--emerald)', marginTop: 2 }}>
              📐 Formula: {kmDriven} km ÷ {prevLiters} L = <strong>{liveMileage} km/L</strong>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 4, fontStyle: 'italic' }}>
              ℹ️ Today's fuel fill will be used for your next mileage calculation.
            </div>
          </div>
        </div>
      )}

      {/* Live total/liters summary */}
      {displayTotal && displayLiters && (
        <div style={{
          background: 'var(--primary-glow)', border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 12, padding: '12px 16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, marginBottom: 2 }}>
              {fillMode === 'amount' ? 'Total Paid' : 'Total Cost'}
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)' }}>
              {currency}{parseFloat(displayTotal).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{displayLiters}L</div>
            <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{currency}{form.pricePerLiter}/L</div>
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="form-group">
        <label className="form-label">📝 Notes (optional)</label>
        <textarea
          className="form-input" placeholder="e.g. Full tank, highway fill..."
          value={form.notes} onChange={(e) => set('notes', e.target.value)}
          style={{ minHeight: 60 }}
        />
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        {onCancel && (
          <button type="button" className="btn btn-ghost btn-full" onClick={onCancel}>Cancel</button>
        )}
        <button type="submit" className="btn btn-primary btn-full">
          {initial ? '✓ Update Entry' : '⛽ Log Fill-Up'}
        </button>
      </div>
    </form>
  );
}
