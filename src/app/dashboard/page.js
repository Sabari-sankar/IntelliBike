'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { vehicleStorage, petrolStorage, serviceStorage, settingsStorage } from '@/lib/storage';

const VEHICLE_EMOJI = { bike: '🏍️', car: '🚗', scooter: '🛵', truck: '🚛' };
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/* ─── Mini Pie Chart (Canvas) ──────────────────────────────────────── */
function MiniPieChart({ segments, size = 120 }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !segments?.length) return;
    const DPR = window.devicePixelRatio || 1;
    canvas.width = size * DPR;
    canvas.height = size * DPR;
    const ctx = canvas.getContext('2d');
    ctx.scale(DPR, DPR);

    const total = segments.reduce((s, seg) => s + seg.value, 0);
    if (total === 0) return;

    let start = -Math.PI / 2;
    const cx = size / 2, cy = size / 2, r = size / 2 - 6;

    segments.forEach((seg) => {
      const angle = (seg.value / total) * 2 * Math.PI;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, start + angle);
      ctx.closePath();
      ctx.fillStyle = seg.color;
      ctx.fill();
      start += angle;
    });

    // Center donut hole
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.52, 0, 2 * Math.PI);
    ctx.fillStyle = 'var(--card-bg, #13131f)';
    ctx.fill();
  }, [segments, size]);

  return <canvas ref={ref} style={{ width: size, height: size, display: 'block' }} />;
}

/* ─── Mini Bar Chart (Canvas) ──────────────────────────────────────── */
function MiniBarChart({ data, color = '#f59e0b', height = 80 }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !data?.length) return;
    const DPR = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth || 200;
    canvas.width = W * DPR;
    canvas.height = height * DPR;
    const ctx = canvas.getContext('2d');
    ctx.scale(DPR, DPR);
    ctx.clearRect(0, 0, W, height);

    const maxV = Math.max(...data.map((d) => d.value), 1);
    const barW = W / data.length;
    const gap = barW * 0.25;

    data.forEach((d, i) => {
      const bH = d.value > 0 ? Math.max(4, (d.value / maxV) * (height - 20)) : 0;
      const x = i * barW + gap / 2;
      const y = height - bH - 14;
      if (bH > 0) {
        const grad = ctx.createLinearGradient(x, y, x, height - 14);
        grad.addColorStop(0, color);
        grad.addColorStop(1, `${color}44`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barW - gap, bH, [3, 3, 0, 0]);
        ctx.fill();
      }
      // Month label
      ctx.fillStyle = 'rgba(148,163,184,0.8)';
      ctx.font = `${9}px Outfit, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(d.label, x + (barW - gap) / 2, height - 2);
    });
  }, [data, color, height]);

  return <canvas ref={ref} style={{ width: '100%', height, display: 'block' }} />;
}

/* ─── Dashboard Page ───────────────────────────────────────────────── */
export default function DashboardPage() {
  const router = useRouter();
  const [allVehicles, setAllVehicles] = useState([]);
  const [vehicle, setVehicle] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [nextService, setNextService] = useState(null);
  const [nextRefill, setNextRefill] = useState(null);
  const [serviceStats, setServiceStats] = useState({ totalCost: 0, count: 0 });
  const [barData, setBarData] = useState([]);
  const [pieSegments, setPieSegments] = useState([]);
  const [currency, setCurrency] = useState('₹');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!vehicleStorage.hasVehicles()) { router.replace('/setup'); return; }

    const activeId = settingsStorage.getActiveVehicleId();
    const v = vehicleStorage.getById(activeId) || vehicleStorage.getAll()[0];
    if (!v) return;
    if (!activeId) settingsStorage.setActiveVehicle(v.id);

    const all = vehicleStorage.getAll();
    setAllVehicles(all);
    setVehicle(v);
    setCurrency(settingsStorage.getCurrency());

    const s = petrolStorage.getStats(v.id);
    setStats(s);
    setRecentLogs(petrolStorage.getByVehicle(v.id).slice(0, 3));

    const services = serviceStorage.getAll(v.id);
    if (services.length > 0) setNextService(services[0]);

    const svcCost = services.reduce((t, s) => t + s.cost, 0);
    setServiceStats({ totalCost: svcCost, count: services.length });

    setNextRefill(petrolStorage.getNextRefillEstimate(v.id));

    // Bar chart: last 6 months petrol spend
    const last6 = petrolStorage.getLast6MonthsStats(v.id);
    setBarData(last6.map((m) => ({ label: MONTH_SHORT[m.month], value: m.cost })));

    // Pie: petrol cost vs service cost
    if (s.totalCost > 0 || svcCost > 0) {
      setPieSegments([
        { label: 'Petrol', value: s.totalCost, color: '#f59e0b' },
        { label: 'Service', value: svcCost, color: '#10b981' },
      ]);
    }

    setLoading(false);
  }, [router]);

  const switchVehicle = (id) => {
    settingsStorage.setActiveVehicle(id);
    window.location.reload();
  };

  const lastOdometer = petrolStorage.getByVehicle(vehicle?.id || '')?.[0]?.odometerKm || 0;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: 40 }}>⛽</span>
        <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading...</span>
      </div>
    );
  }

  return (
    <>
      <Header title="Dashboard" showVehicleSwitch={true} />
      <div className="page">
        <div className="page-inner">

          {/* ── All Vehicles Scroll ─────────────────────────────── */}
          {allVehicles.length > 1 && (
            <div className="section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div className="section-title" style={{ marginBottom: 0 }}>All Vehicles</div>
                <Link href="/vehicles" style={{ fontSize: 12, color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Manage →</Link>
              </div>
              <div className="vehicle-scroll">
                {allVehicles.map((v) => {
                  const vs = petrolStorage.getStats(v.id);
                  const isActive = v.id === vehicle?.id;
                  return (
                    <div
                      key={v.id}
                      className={`vehicle-mini-card${isActive ? ' active-vehicle' : ''}`}
                      onClick={() => !isActive && switchVehicle(v.id)}
                    >
                      <div style={{ fontSize: 24, marginBottom: 4 }}>{VEHICLE_EMOJI[v.type] || '🚗'}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: isActive ? 'var(--primary)' : 'var(--text)', marginBottom: 2 }}>
                        {v.nickname}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-faint)', marginBottom: 6 }}>{v.model}</div>
                      {vs.avgMileage > 0 && (
                        <div style={{ fontSize: 11, color: 'var(--emerald)', fontWeight: 600 }}>⚡ {vs.avgMileage.toFixed(1)} km/L</div>
                      )}
                      {isActive && (
                        <div style={{ position: 'absolute', top: 8, right: 8, width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)' }} />
                      )}
                    </div>
                  );
                })}
                <div
                  className="vehicle-mini-card"
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1.5px dashed var(--border-strong)', background: 'transparent', cursor: 'pointer' }}
                  onClick={() => router.push('/vehicles')}
                >
                  <div style={{ fontSize: 24, marginBottom: 4 }}>➕</div>
                  <div style={{ fontSize: 12, color: 'var(--text-faint)', fontWeight: 600 }}>Add Vehicle</div>
                </div>
              </div>
            </div>
          )}

          {/* ── Vehicle Hero ──────────────────────────────────── */}
          <div className="vehicle-hero" style={{ marginBottom: 20, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Active Vehicle
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 4, color: 'var(--text)' }}>
                  {vehicle?.nickname}
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{vehicle?.model}</p>
                {vehicle?.regNumber && (
                  <div style={{
                    display: 'inline-block', marginTop: 6,
                    background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border)',
                    borderRadius: 6, padding: '2px 10px', fontSize: 12, fontWeight: 700,
                    letterSpacing: '0.08em', color: 'var(--text)'
                  }}>
                    {vehicle.regNumber}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 48, lineHeight: 1, position: 'relative', zIndex: 1 }}>
                {VEHICLE_EMOJI[vehicle?.type] || '🚗'}
              </div>
            </div>
            {lastOdometer > 0 && (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>📍</span>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>
                    {lastOdometer.toLocaleString()} <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 400 }}>km</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>Current Odometer</div>
                </div>
              </div>
            )}
          </div>

          {/* ── 4 Stats Grid ─────────────────────────────────── */}
          <div className="grid-2" style={{ marginBottom: 20 }}>
            <div className="stat-card">
              <div className="stat-label">💸 Total Petrol</div>
              <div className="stat-value" style={{ color: 'var(--primary)', fontSize: 18 }}>
                {currency}{(stats?.totalCost || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <div className="stat-sub">{stats?.totalFills || 0} fill-ups</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">⚡ Avg Mileage</div>
              <div className="stat-value" style={{ color: 'var(--emerald)', fontSize: 18 }}>
                {stats?.avgMileage ? stats.avgMileage.toFixed(1) : '—'}
              </div>
              <div className="stat-sub">km per liter</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">🔧 Service Cost</div>
              <div className="stat-value" style={{ fontSize: 18, color: 'var(--blue)' }}>
                {currency}{serviceStats.totalCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <div className="stat-sub">{serviceStats.count} services</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">🛣️ Total KM</div>
              <div className="stat-value" style={{ fontSize: 18 }}>
                {(stats?.totalKm || 0) > 0 ? stats.totalKm.toLocaleString() : '—'}
              </div>
              <div className="stat-sub">km driven</div>
            </div>
          </div>

          {/* ── Mini Charts Row ───────────────────────────────── */}
          {(stats?.totalFills > 0 || serviceStats.count > 0) && (
            <div className="grid-2" style={{ marginBottom: 20 }}>
              {/* Pie Chart */}
              <div className="card" style={{ padding: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Expense Split
                </div>
                {pieSegments.length > 0 ? (
                  <>
                    <MiniPieChart segments={pieSegments} size={100} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
                      {pieSegments.map((s) => (
                        <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</span>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>
                            {currency}{s.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ color: 'var(--text-faint)', fontSize: 12, padding: '20px 0' }}>No data yet</div>
                )}
              </div>

              {/* Bar Chart: last 6 months */}
              <div className="card" style={{ padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                  Last 6 Months
                </div>
                {barData.some((d) => d.value > 0) ? (
                  <MiniBarChart data={barData} color="#f59e0b" height={100} />
                ) : (
                  <div style={{ color: 'var(--text-faint)', fontSize: 12, padding: '30px 0', textAlign: 'center' }}>No data yet</div>
                )}
              </div>
            </div>
          )}

          {/* ── Next Fill Estimate ────────────────────────────── */}
          {nextRefill && (() => {
            const kmLeft = nextRefill.estimatedKm - lastOdometer;
            const isDue = kmLeft <= 0;
            const isNearDue = kmLeft > 0 && kmLeft <= 30;
            return (
              <div className="section">
                <div className="section-title">⛽ Next Expected Fill</div>
                <div style={{
                  background: isDue
                    ? 'linear-gradient(135deg, var(--red-glow) 0%, rgba(239,68,68,0.04) 100%)'
                    : 'linear-gradient(135deg, var(--blue-glow) 0%, var(--primary-glow) 100%)',
                  border: `1px solid ${isDue ? 'rgba(239,68,68,0.25)' : 'rgba(59,130,246,0.2)'}`,
                  borderRadius: 16, padding: 16,
                }}>
                  {/* Top row: icon + target km */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                      <span style={{ fontSize: 32 }}>{isDue ? '🔴' : isNearDue ? '🟡' : '🎯'}</span>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Fill Expected At
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: isDue ? 'var(--red)' : 'var(--text)' }}>
                          ~{nextRefill.estimatedKm.toLocaleString()} km
                        </div>
                      </div>
                    </div>
                    <div style={{
                      textAlign: 'right',
                      background: isDue ? 'var(--red-glow)' : isNearDue ? 'var(--primary-glow)' : 'var(--blue-glow)',
                      border: `1px solid ${isDue ? 'rgba(239,68,68,0.3)' : isNearDue ? 'rgba(245,158,11,0.3)' : 'rgba(59,130,246,0.3)'}`,
                      borderRadius: 12, padding: '8px 12px'
                    }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: isDue ? 'var(--red)' : isNearDue ? 'var(--primary)' : 'var(--blue)' }}>
                        {isDue ? 'Fill Now!' : `+${nextRefill.kmRange.toLocaleString()} km`}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>
                        {isDue ? 'Overdue' : 'expected range'}
                      </div>
                    </div>
                  </div>

                  {/* Range indicator bar */}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>📍 Last Fill: <strong>{nextRefill.lastOdometer.toLocaleString()} km</strong></span>
                      <span style={{ fontSize: 11, color: 'var(--blue)', fontWeight: 700 }}>🎯 Next: ~{nextRefill.estimatedKm.toLocaleString()} km</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 3,
                        width: '100%',
                        background: 'linear-gradient(90deg, var(--emerald) 0%, var(--primary) 70%, var(--blue) 100%)',
                      }} />
                    </div>
                  </div>

                  {/* Bottom details */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-faint)', background: 'var(--surface)', borderRadius: 8, padding: '4px 8px' }}>
                      ⚡ {nextRefill.avgMileage.toFixed(1)} km/L {nextRefill.isEstimated ? '(est.)' : 'avg'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-faint)', background: 'var(--surface)', borderRadius: 8, padding: '4px 8px' }}>
                      ⛽ ~{nextRefill.avgLiters}L avg fill
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-faint)', background: 'var(--surface)', borderRadius: 8, padding: '4px 8px' }}>
                      🛣️ ~{nextRefill.kmRange} km per fill
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── Last Fill Summary ─────────────────────────────── */}
          {stats?.lastFill && (
            <div className="section">
              <div className="section-title">Last Fill-Up</div>
              <div className="card-amber">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>
                      {currency}{stats.lastFill.totalCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                      {stats.lastFill.liters}L · {currency}{stats.lastFill.pricePerLiter}/L
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>
                      📅 {new Date(stats.lastFill.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  {stats.lastFill.mileage && (
                    <div style={{ background: 'var(--emerald-glow)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 12, padding: '8px 12px', textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--emerald)' }}>{stats.lastFill.mileage}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>km/L</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Service Alert ─────────────────────────────────── */}
          {nextService?.nextServiceKm > 0 && lastOdometer > 0 && (
            <div className="section">
              <div className="section-title">Service Alert</div>
              <div className="card" style={{ borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 28 }}>🔧</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 14 }}>
                      Next: {nextService.type}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      Due at {nextService.nextServiceKm.toLocaleString()} km
                      {' '}
                      {lastOdometer < nextService.nextServiceKm
                        ? `(${(nextService.nextServiceKm - lastOdometer).toLocaleString()} km left)`
                        : '— Overdue!'}
                    </div>
                    <div className="progress-bar" style={{ marginTop: 8 }}>
                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.min(100, (lastOdometer / nextService.nextServiceKm) * 100)}%`,
                          background: lastOdometer >= nextService.nextServiceKm ? 'var(--red)' : 'var(--primary)'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Quick Actions ─────────────────────────────────── */}
          <div className="section">
            <div className="section-title">Quick Actions</div>
            <div className="grid-2">
              <Link href="/petrol" className="btn btn-primary btn-full" style={{ textDecoration: 'none' }}>⛽ Add Fill-Up</Link>
              <Link href="/service" className="btn btn-ghost btn-full" style={{ textDecoration: 'none' }}>🔧 Add Service</Link>
            </div>
          </div>

          {/* ── Recent Fills ──────────────────────────────────── */}
          {recentLogs.length > 0 && (
            <div className="section">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div className="section-title" style={{ marginBottom: 0 }}>Recent Fills</div>
                <Link href="/petrol" style={{ fontSize: 12, color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>See All →</Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recentLogs.map((log) => (
                  <div key={log.id} className="list-row">
                    <div className="icon-wrap icon-amber">⛽</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        {log.liters}L — {currency}{log.totalCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                        {new Date(log.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {log.odometerKm.toLocaleString()} km
                      </div>
                    </div>
                    {log.mileage && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--emerald)' }}>{log.mileage}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>km/L</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {stats?.totalFills === 0 && allVehicles.length === 1 && (
            <div className="empty-state">
              <div className="empty-icon">⛽</div>
              <div className="empty-title">No fill-ups yet</div>
              <div className="empty-desc">Tap "Add Fill-Up" to log your first petrol entry</div>
              <Link href="/petrol" className="btn btn-primary" style={{ marginTop: 8, textDecoration: 'none' }}>Add First Fill-Up</Link>
            </div>
          )}

        </div>
      </div>
      <BottomNav />
    </>
  );
}
