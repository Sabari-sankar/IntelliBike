'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import ServiceForm from '@/components/ServiceForm';
import { vehicleStorage, serviceStorage, petrolStorage, settingsStorage } from '@/lib/storage';

const SERVICE_TYPE_ICONS = {
  'General Service': '🔧',
  'Oil Change': '🛢️',
  'Air Filter': '💨',
  'Spark Plug': '⚡',
  'Chain Lube / Adjustment': '🔗',
  'Tyre Change': '🚲',
  'Brake Service': '🛑',
  'Battery Replacement': '🔋',
  'Coolant Change': '❄️',
  'Clutch Service': '⚙️',
  'Other': '🔩',
};

export default function ServicePage() {
  const router = useRouter();
  const [vehicle, setVehicle] = useState(null);
  const [records, setRecords] = useState([]);
  const [currency, setCurrency] = useState('₹');
  const [lastOdometer, setLastOdometer] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [toast, setToast] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const loadData = () => {
    const activeId = settingsStorage.getActiveVehicleId();
    const v = vehicleStorage.getById(activeId) || vehicleStorage.getAll()[0];
    if (!v) { router.replace('/setup'); return; }
    setVehicle(v);
    setCurrency(settingsStorage.getCurrency());
    setRecords(serviceStorage.getAll(v.id));
    const logs = petrolStorage.getByVehicle(v.id);
    if (logs.length > 0) setLastOdometer(logs[0].odometerKm);
  };

  useEffect(() => { loadData(); }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const handleSave = (data) => {
    if (editRecord) {
      serviceStorage.update(editRecord.id, data);
      showToast('✓ Service record updated!');
    } else {
      serviceStorage.add(data);
      showToast('✓ Service record saved!');
    }
    setShowModal(false);
    setEditRecord(null);
    loadData();
  };

  const handleDelete = (id) => {
    serviceStorage.delete(id);
    setDeleteConfirm(null);
    showToast('Deleted.');
    loadData();
  };

  const getServiceStatus = (record) => {
    if (!record.nextServiceKm || !lastOdometer) return 'normal';
    const kmLeft = record.nextServiceKm - lastOdometer;
    if (kmLeft <= 0) return 'overdue';
    if (kmLeft <= 500) return 'soon';
    return 'normal';
  };

  const STATUS_STYLES = {
    overdue: { color: 'var(--red)', bg: 'var(--red-glow)', border: 'rgba(239,68,68,0.25)', label: '⚠️ Overdue' },
    soon:    { color: 'var(--primary)', bg: 'var(--primary-glow)', border: 'rgba(245,158,11,0.25)', label: '⏰ Due Soon' },
    normal:  { color: 'var(--emerald)', bg: 'var(--emerald-glow)', border: 'rgba(16,185,129,0.15)', label: '✓ OK' },
  };

  const totalServiceCost = records.reduce((s, r) => s + (r.cost || 0), 0);

  return (
    <>
      <Header title="Service Records" />
      <div className="page">
        <div className="page-inner">

          {/* Summary */}
          {records.length > 0 && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <div style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>
                  {currency}{totalServiceCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>Total Service Cost</div>
              </div>
              <div style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{records.length}</div>
                <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>Service Records</div>
              </div>
            </div>
          )}

          {/* Records list */}
          {records.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔧</div>
              <div className="empty-title">No service records</div>
              <div className="empty-desc">Tap + to log your first service</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {records.map((record) => {
                const status = getServiceStatus(record);
                const st = STATUS_STYLES[status];
                const icon = SERVICE_TYPE_ICONS[record.type] || '🔩';
                return (
                  <div key={record.id} className="card" style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                      <div className="icon-wrap" style={{ background: 'rgba(255,255,255,0.05)', fontSize: 20, flexShrink: 0 }}>
                        {icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 15 }}>{record.type}</div>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                            background: st.bg, color: st.color, border: `1px solid ${st.border}`
                          }}>
                            {st.label}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>
                          {new Date(record.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div style={{ display: 'flex', gap: 16, marginBottom: record.notes ? 8 : 10 }}>
                      {record.cost > 0 && (
                        <div>
                          <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>Cost</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>
                            {currency}{record.cost.toLocaleString('en-IN')}
                          </div>
                        </div>
                      )}
                      {record.odometerKm > 0 && (
                        <div>
                          <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>At KM</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                            {record.odometerKm.toLocaleString()}
                          </div>
                        </div>
                      )}
                      {record.nextServiceKm > 0 && (
                        <div>
                          <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>Next at</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: status === 'overdue' ? 'var(--red)' : 'var(--text)' }}>
                            {record.nextServiceKm.toLocaleString()} km
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Next service progress */}
                    {record.nextServiceKm > 0 && record.odometerKm > 0 && lastOdometer > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${Math.min(100, ((lastOdometer - record.odometerKm) / (record.nextServiceKm - record.odometerKm)) * 100)}%`,
                              background: status === 'overdue' ? 'var(--red)' : status === 'soon' ? 'var(--primary)' : 'var(--emerald)'
                            }}
                          />
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 4 }}>
                          {Math.max(0, record.nextServiceKm - lastOdometer).toLocaleString()} km remaining
                        </div>
                      </div>
                    )}

                    {record.notes && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 10 }}>
                        "{record.notes}"
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setEditRecord(record); setShowModal(true); }} style={{ flex: 1 }}>
                        ✏️ Edit
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(record.id)} style={{ flex: 1 }}>
                        🗑️ Delete
                      </button>
                    </div>

                    {deleteConfirm === record.id && (
                      <div style={{
                        marginTop: 10, padding: '10px 12px',
                        background: 'var(--red-glow)', border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: 10, display: 'flex', gap: 8, alignItems: 'center'
                      }}>
                        <span style={{ fontSize: 13, color: 'var(--text)', flex: 1 }}>Delete this record?</span>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(record.id)}>Yes</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(null)}>No</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <button className="fab" onClick={() => { setEditRecord(null); setShowModal(true); }}>+</button>

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setEditRecord(null); }}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">{editRecord ? '✏️ Edit Service Record' : '🔧 Add Service Record'}</div>
            <ServiceForm
              vehicleId={vehicle?.id}
              initial={editRecord}
              onSave={handleSave}
              onCancel={() => { setShowModal(false); setEditRecord(null); }}
            />
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
      <BottomNav />
    </>
  );
}
