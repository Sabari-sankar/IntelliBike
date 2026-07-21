'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import VehicleForm from '@/components/VehicleForm';
import { vehicleStorage, petrolStorage, settingsStorage } from '@/lib/storage';

const VEHICLE_EMOJI = { bike: '🏍️', car: '🚗', scooter: '🛵', truck: '🚛' };
const FUEL_EMOJI = { petrol: '⛽', diesel: '🛢️', electric: '⚡', cng: '💨' };

export default function VehiclesPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editVehicle, setEditVehicle] = useState(null);
  const [toast, setToast] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const loadData = () => {
    setVehicles(vehicleStorage.getAll());
    setActiveId(settingsStorage.getActiveVehicleId());
  };

  useEffect(() => { loadData(); }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const handleSave = (data) => {
    if (editVehicle) {
      vehicleStorage.update(editVehicle.id, data);
      showToast('✓ Vehicle updated!');
    } else {
      vehicleStorage.add(data);
      showToast('✓ Vehicle added!');
    }
    setShowAdd(false);
    setEditVehicle(null);
    loadData();
  };

  const handleDelete = (id) => {
    vehicleStorage.delete(id);
    setDeleteConfirm(null);
    showToast('Vehicle deleted.');
    // If deleted was active, switch to first
    if (id === activeId) {
      const remaining = vehicleStorage.getAll();
      if (remaining.length > 0) {
        settingsStorage.setActiveVehicle(remaining[0].id);
        setActiveId(remaining[0].id);
      }
    }
    loadData();
  };

  const handleSetActive = (id) => {
    settingsStorage.setActiveVehicle(id);
    setActiveId(id);
    showToast('Active vehicle changed!');
  };

  return (
    <>
      <Header title="My Vehicles" />
      <div className="page">
        <div className="page-inner">

          {/* Vehicle list */}
          {vehicles.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🚗</div>
              <div className="empty-title">No vehicles yet</div>
              <div className="empty-desc">Add your bike or car to get started</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
              {vehicles.map((v) => {
                const stats = petrolStorage.getStats(v.id);
                const isActive = v.id === activeId;
                return (
                  <div
                    key={v.id}
                    className="card"
                    style={{
                      borderColor: isActive ? 'rgba(245,158,11,0.35)' : 'var(--border)',
                      background: isActive ? 'linear-gradient(135deg, rgba(245,158,11,0.07) 0%, rgba(0,0,0,0) 100%)' : 'var(--surface)',
                    }}
                  >
                    {/* Vehicle header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                      <div style={{ fontSize: 40, lineHeight: 1 }}>{VEHICLE_EMOJI[v.type] || '🚗'}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>{v.nickname}</div>
                          {isActive && (
                            <span className="badge badge-amber">✓ Active</span>
                          )}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{v.model}</div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                            {FUEL_EMOJI[v.fuelType]} {v.fuelType}
                          </span>
                          {v.regNumber && (
                            <span style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 600 }}>
                              📋 {v.regNumber}
                            </span>
                          )}
                          {v.tankCapacity > 0 && (
                            <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                              🪣 {v.tankCapacity}L tank
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Delivery date */}
                    {v.deliveryDate && (
                      <div style={{
                        fontSize: 12, color: 'var(--text-faint)',
                        marginBottom: 10
                      }}>
                        📦 Delivered: {new Date(v.deliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    )}

                    {/* Stats */}
                    {stats.totalFills > 0 && (
                      <div style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                        gap: 8, marginBottom: 12, paddingTop: 12,
                        borderTop: '1px solid var(--border)'
                      }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>
                            ₹{stats.totalCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </div>
                          <div style={{ fontSize: 9, color: 'var(--text-faint)' }}>Total Spent</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--emerald)' }}>
                            {stats.avgMileage > 0 ? `${stats.avgMileage.toFixed(1)}` : '—'}
                          </div>
                          <div style={{ fontSize: 9, color: 'var(--text-faint)' }}>km/L avg</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                            {stats.totalFills}
                          </div>
                          <div style={{ fontSize: 9, color: 'var(--text-faint)' }}>Fill-ups</div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      {!isActive && (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleSetActive(v.id)}
                          style={{ flex: 1 }}
                        >
                          Set Active
                        </button>
                      )}
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => { setEditVehicle(v); setShowAdd(true); }}
                        style={{ flex: 1 }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setDeleteConfirm(v.id)}
                        style={{ flex: 1 }}
                      >
                        🗑️
                      </button>
                    </div>

                    {deleteConfirm === v.id && (
                      <div style={{
                        marginTop: 10, padding: '10px 12px',
                        background: 'var(--red-glow)', border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: 10, display: 'flex', gap: 8, alignItems: 'center'
                      }}>
                        <span style={{ fontSize: 12, color: 'var(--text)', flex: 1 }}>
                          Delete &ldquo;{v.nickname}&rdquo;? All logs will be removed.
                        </span>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(v.id)}>Yes</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(null)}>No</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Add vehicle button */}
          {!showAdd && !editVehicle && (
            <button
              className="btn btn-primary btn-full"
              onClick={() => { setEditVehicle(null); setShowAdd(true); }}
            >
              + Add Vehicle
            </button>
          )}

        </div>
      </div>

      {/* Add / Edit Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => { setShowAdd(false); setEditVehicle(null); }}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">{editVehicle ? '✏️ Edit Vehicle' : '🚗 Add Vehicle'}</div>
            <VehicleForm
              initial={editVehicle}
              onSave={handleSave}
              onCancel={() => { setShowAdd(false); setEditVehicle(null); }}
            />
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
      <BottomNav />
    </>
  );
}
