'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import PetrolForm from '@/components/PetrolForm';
import { vehicleStorage, petrolStorage, settingsStorage } from '@/lib/storage';

export default function PetrolPage() {
  const router = useRouter();
  const [vehicle, setVehicle] = useState(null);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [currency, setCurrency] = useState('₹');
  const [showModal, setShowModal] = useState(false);
  const [editLog, setEditLog] = useState(null);
  const [toast, setToast] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const loadData = () => {
    const activeId = settingsStorage.getActiveVehicleId();
    const v = vehicleStorage.getById(activeId) || vehicleStorage.getAll()[0];
    if (!v) { router.replace('/setup'); return; }
    setVehicle(v);
    setCurrency(settingsStorage.getCurrency());
    setLogs(petrolStorage.getByVehicle(v.id));
    setStats(petrolStorage.getStats(v.id));
  };

  useEffect(() => { loadData(); }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const handleSave = (data) => {
    if (editLog) {
      petrolStorage.update(editLog.id, data);
      showToast('✓ Fill-up updated!');
    } else {
      petrolStorage.add(data);
      showToast('✓ Fill-up logged!');
    }
    setShowModal(false);
    setEditLog(null);
    loadData();
  };

  const handleDelete = (id) => {
    petrolStorage.delete(id);
    setDeleteConfirm(null);
    showToast('Deleted.');
    loadData();
  };

  const openEdit = (log) => {
    setEditLog(log);
    setShowModal(true);
  };

  const MILEAGE_COLOR = (m) => {
    if (!m) return 'var(--text-muted)';
    if (m >= 50) return 'var(--emerald)';
    if (m >= 35) return 'var(--primary)';
    return 'var(--red)';
  };

  return (
    <>
      <Header title="Petrol Log" showVehicleSwitch={true} />
      <div className="page safe-top">
        <div className="page-inner">

          {/* Summary bar */}
          {stats && stats.totalFills > 0 && (
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8,
              marginBottom: 20
            }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary)' }}>
                  ₹{stats.totalCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 2 }}>Total Spent</div>
              </div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--emerald)' }}>
                  {stats.avgMileage > 0 ? `${stats.avgMileage.toFixed(1)} km/L` : '—'}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 2 }}>Avg Mileage</div>
              </div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                  {stats.totalLiters.toFixed(1)}L
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 2 }}>Total Fuel</div>
              </div>
            </div>
          )}

          {/* Log list */}
          {logs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">⛽</div>
              <div className="empty-title">No fill-ups yet</div>
              <div className="empty-desc">Tap + to log your first petrol fill</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {logs.map((log, i) => (
                <div key={log.id} className="card" style={{ padding: '14px 16px' }}>
                  {/* Header row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 2 }}>
                        {new Date(log.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>
                        {currency}{log.totalCost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    {log.mileage && (
                      <div style={{
                        background: `${MILEAGE_COLOR(log.mileage)}22`,
                        border: `1px solid ${MILEAGE_COLOR(log.mileage)}44`,
                        borderRadius: 10, padding: '6px 12px', textAlign: 'center'
                      }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: MILEAGE_COLOR(log.mileage) }}>
                          {log.mileage}
                        </div>
                        <div style={{ fontSize: 9, color: 'var(--text-faint)' }}>km/L</div>
                      </div>
                    )}
                  </div>

                  {/* Details row */}
                  <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>Liters</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{log.liters}L</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>Rate</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{currency}{log.pricePerLiter}/L</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>Odometer</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{log.odometerKm.toLocaleString()} km</div>
                    </div>
                  </div>

                  {/* Mileage info */}
                  {(() => {
                    const prevLogItem = logs[i + 1];
                    if (prevLogItem && log.odometerKm > prevLogItem.odometerKm) {
                      const kmDriven = log.odometerKm - prevLogItem.odometerKm;
                      const calculatedMileage = log.mileage || (kmDriven / log.liters).toFixed(2);
                      return (
                        <div style={{
                          fontSize: 12, color: 'var(--text)',
                          background: 'var(--surface)', border: '1px solid var(--border)',
                          borderRadius: 8, padding: '8px 12px',
                          marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 2
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600 }}>⚡ Tank Mileage:</span>
                            <strong style={{ color: MILEAGE_COLOR(calculatedMileage) }}>{calculatedMileage} km/L</strong>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            🛣️ {prevLogItem.odometerKm.toLocaleString()} km → {log.odometerKm.toLocaleString()} km = <strong>{kmDriven.toLocaleString()} km driven</strong>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                            📐 Calculation: {kmDriven} km ÷ {log.liters} L = {calculatedMileage} km/L
                          </div>
                        </div>
                      );
                    } else if (i === logs.length - 1) {
                      return (
                        <div style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 10 }}>
                          ℹ️ First entry — mileage will calculate automatically on your next fill-up.
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {log.notes && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, fontStyle: 'italic' }}>
                      "{log.notes}"
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => openEdit(log)}
                      style={{ flex: 1 }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => setDeleteConfirm(log.id)}
                      style={{ flex: 1 }}
                    >
                      🗑️ Delete
                    </button>
                  </div>

                  {/* Delete confirm */}
                  {deleteConfirm === log.id && (
                    <div style={{
                      marginTop: 10, padding: '10px 12px',
                      background: 'var(--red-glow)', border: '1px solid rgba(239,68,68,0.3)',
                      borderRadius: 10, display: 'flex', gap: 8, alignItems: 'center'
                    }}>
                      <span style={{ fontSize: 13, color: 'var(--text)', flex: 1 }}>Delete this entry?</span>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(log.id)}>Yes</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(null)}>No</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FAB */}
      <button className="fab" onClick={() => { setEditLog(null); setShowModal(true); }}>+</button>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setEditLog(null); }}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">
              {editLog ? '✏️ Edit Fill-Up' : '⛽ Log Petrol Fill'}
            </div>
            <PetrolForm
              vehicleId={vehicle?.id}
              initial={editLog}
              onSave={handleSave}
              onCancel={() => { setShowModal(false); setEditLog(null); }}
            />
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
      <BottomNav />
    </>
  );
}
