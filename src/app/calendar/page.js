'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { vehicleStorage, petrolStorage, serviceStorage, settingsStorage } from '@/lib/storage';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const SHORT_DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function CalendarGrid({ viewYear, viewMonth, fillDates, serviceDates, activeTab, petrolMap, serviceMap, currency }) {
  const [selected, setSelected] = useState(null);

  const today = new Date();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const fmt = (d) => `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const isToday = (d) => d && d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();

  const hasDot = (d) => {
    if (!d) return false;
    const date = fmt(d);
    return activeTab === 'petrol' ? fillDates.has(date) : serviceDates.has(date);
  };

  const dotColor = activeTab === 'petrol' ? 'var(--blue)' : 'var(--primary)';

  const selDate = selected ? fmt(selected) : null;
  const selPetrol = selDate && activeTab === 'petrol' ? (petrolMap[selDate] || []) : [];
  const selService = selDate && activeTab === 'service' ? (serviceMap[selDate] || []) : [];

  return (
    <>
      {/* Grid */}
      <div className="card" style={{ padding: 12, marginBottom: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 6 }}>
          {SHORT_DAYS.map((d) => (
            <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text-faint)', padding: '4px 0' }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {cells.map((d, i) => {
            const dot = hasDot(d);
            const todayCell = isToday(d);
            const selCell = d && selected === d;
            return (
              <div
                key={i}
                onClick={() => d && setSelected(selCell ? null : d)}
                style={{
                  aspectRatio: '1', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', borderRadius: 10,
                  cursor: d ? 'pointer' : 'default', gap: 2,
                  background: selCell ? 'var(--primary)' : todayCell ? 'var(--primary-glow)' : 'transparent',
                  border: todayCell && !selCell ? '1px solid rgba(245,158,11,0.4)' : '1px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                {d && (
                  <>
                    <span style={{
                      fontSize: 13, lineHeight: 1,
                      fontWeight: todayCell || selCell ? 700 : 500,
                      color: selCell ? '#000' : todayCell ? 'var(--primary)' : 'var(--text)',
                    }}>{d}</span>
                    <div style={{ height: 4, display: 'flex', alignItems: 'center' }}>
                      {dot && (
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: selCell ? '#000' : dotColor }} />
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 14, justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {activeTab === 'petrol' ? 'Petrol Fill' : 'Service Date'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 14, height: 14, borderRadius: 4, background: 'var(--primary-glow)', border: '1px solid rgba(245,158,11,0.4)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Today</span>
        </div>
      </div>

      {/* Selected date details */}
      {selected && (selPetrol.length > 0 || selService.length > 0) && (
        <div className="section">
          <div className="section-title">
            {new Date(selDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          {selPetrol.map((log) => (
            <div key={log.id} className="list-row" style={{ marginBottom: 8 }}>
              <div className="icon-wrap icon-blue">⛽</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Petrol Fill — {log.liters}L</div>
                <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                  {currency}{log.totalCost.toLocaleString()} · {currency}{log.pricePerLiter}/L · {log.odometerKm.toLocaleString()} km
                </div>
                {log.mileage && <div style={{ fontSize: 11, color: 'var(--emerald)', marginTop: 2 }}>⚡ {log.mileage} km/L</div>}
              </div>
            </div>
          ))}
          {selService.map((rec) => (
            <div key={rec.id} className="list-row" style={{ marginBottom: 8 }}>
              <div className="icon-wrap icon-amber">🔧</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{rec.type}</div>
                <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                  {rec.cost > 0 ? `${currency}${rec.cost.toLocaleString()}` : 'No cost'}
                  {rec.odometerKm > 0 ? ` · ${rec.odometerKm.toLocaleString()} km` : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {selected && selPetrol.length === 0 && selService.length === 0 && (
        <div style={{ textAlign: 'center', padding: 16, color: 'var(--text-faint)', fontSize: 13 }}>
          No {activeTab === 'petrol' ? 'fills' : 'services'} on this day
        </div>
      )}
    </>
  );
}

export default function CalendarPage() {
  const router = useRouter();
  const [vehicle, setVehicle] = useState(null);
  const [fillDates, setFillDates] = useState(new Set());
  const [serviceDates, setServiceDates] = useState(new Set());
  const [petrolMap, setPetrolMap] = useState({});
  const [serviceMap, setServiceMap] = useState({});
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState('petrol'); // 'petrol' | 'service'
  const [currency, setCurrency] = useState('₹');

  useEffect(() => {
    const activeId = settingsStorage.getActiveVehicleId();
    const v = vehicleStorage.getById(activeId) || vehicleStorage.getAll()[0];
    if (!v) { router.replace('/setup'); return; }
    setVehicle(v);
    setCurrency(settingsStorage.getCurrency());

    const pLogs = petrolStorage.getByVehicle(v.id);
    const sRecords = serviceStorage.getAll(v.id);

    setFillDates(new Set(pLogs.map((l) => l.date)));
    setServiceDates(new Set(sRecords.map((s) => s.date)));

    const pm = {};
    pLogs.forEach((l) => { if (!pm[l.date]) pm[l.date] = []; pm[l.date].push(l); });
    const sm = {};
    sRecords.forEach((s) => { if (!sm[s.date]) sm[s.date] = []; sm[s.date].push(s); });
    setPetrolMap(pm);
    setServiceMap(sm);
  }, [router]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  // Month summary stats
  const monthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
  const monthPetrolLogs = Object.entries(petrolMap)
    .filter(([d]) => d.startsWith(monthPrefix)).flatMap(([, l]) => l);
  const monthServiceRecs = Object.entries(serviceMap)
    .filter(([d]) => d.startsWith(monthPrefix)).flatMap(([, s]) => s);

  const monthPetrolCost = monthPetrolLogs.reduce((s, l) => s + l.totalCost, 0);
  const monthServiceCost = monthServiceRecs.reduce((s, r) => s + r.cost, 0);

  return (
    <>
      <Header title="Calendar" showVehicleSwitch={true} />
      <div className="page">
        <div className="page-inner">

          {/* Tab Bar */}
          <div className="tab-bar">
            <button className={`tab-btn${activeTab === 'petrol' ? ' active' : ''}`} onClick={() => setActiveTab('petrol')}>
              ⛽ Petrol History
            </button>
            <button className={`tab-btn${activeTab === 'service' ? ' active' : ''}`} onClick={() => setActiveTab('service')}>
              🔧 Service History
            </button>
          </div>

          {/* Month Navigator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <button className="btn btn-ghost btn-icon" onClick={prevMonth} style={{ fontSize: 18 }}>←</button>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>{MONTH_NAMES[viewMonth]}</div>
              <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>{viewYear}</div>
            </div>
            <button className="btn btn-ghost btn-icon" onClick={nextMonth} style={{ fontSize: 18 }}>→</button>
          </div>

          {/* Month Stats Banner */}
          {activeTab === 'petrol' && monthPetrolLogs.length > 0 && (
            <div style={{
              display: 'flex', gap: 10, marginBottom: 12,
              background: 'var(--primary-glow)', border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: 12, padding: '10px 14px'
            }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary)' }}>
                  {currency}{monthPetrolCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>Month Petrol Spend</div>
              </div>
              <div style={{ width: 1, background: 'rgba(245,158,11,0.2)' }} />
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{monthPetrolLogs.length}</div>
                <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>Fill-Ups</div>
              </div>
              <div style={{ width: 1, background: 'rgba(245,158,11,0.2)' }} />
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                  {monthPetrolLogs.reduce((s, l) => s + l.liters, 0).toFixed(1)}L
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>Total Liters</div>
              </div>
            </div>
          )}

          {activeTab === 'service' && monthServiceRecs.length > 0 && (
            <div style={{
              display: 'flex', gap: 10, marginBottom: 12,
              background: 'var(--emerald-glow)', border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: 12, padding: '10px 14px'
            }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--emerald)' }}>
                  {currency}{monthServiceCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>Month Service Cost</div>
              </div>
              <div style={{ width: 1, background: 'rgba(16,185,129,0.2)' }} />
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{monthServiceRecs.length}</div>
                <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>Services</div>
              </div>
            </div>
          )}

          {/* Calendar component */}
          <CalendarGrid
            key={`${viewYear}-${viewMonth}-${activeTab}`}
            viewYear={viewYear}
            viewMonth={viewMonth}
            fillDates={fillDates}
            serviceDates={serviceDates}
            activeTab={activeTab}
            petrolMap={petrolMap}
            serviceMap={serviceMap}
            currency={currency}
          />

        </div>
      </div>
      <BottomNav />
    </>
  );
}
