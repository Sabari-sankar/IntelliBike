'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import ExpenseChart from '@/components/ExpenseChart';
import { vehicleStorage, petrolStorage, serviceStorage, settingsStorage } from '@/lib/storage';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const FULL_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

/* ─── Service Bar Chart ─────────────────────────────────────────────── */
function ServiceBarChart({ data, currency }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const DPR = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth || 300;
    const H = 220;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    const ctx = canvas.getContext('2d');
    ctx.scale(DPR, DPR);
    ctx.clearRect(0, 0, W, H);

    const values = data.map((d) => d.cost);
    const maxVal = Math.max(...values, 1);

    const PAD_L = 48, PAD_R = 12, PAD_T = 20, PAD_B = 48;
    const chartW = W - PAD_L - PAD_R;
    const chartH = H - PAD_T - PAD_B;
    const barGap = 6;
    const barW = (chartW / 12) - barGap;

    // Grid lines
    for (let i = 0; i <= 4; i++) {
      const y = PAD_T + (chartH / 4) * i;
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(PAD_L, y); ctx.lineTo(W - PAD_R, y); ctx.stroke();
      const val = maxVal - (maxVal / 4) * i;
      ctx.fillStyle = 'rgba(148,163,184,0.6)';
      ctx.font = '9px Outfit, sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(val >= 1000 ? `${(val/1000).toFixed(1)}k` : val.toFixed(0), PAD_L - 4, y + 4);
    }

    // Bars — emerald for services
    data.forEach((d, i) => {
      const bH = d.cost > 0 ? (d.cost / maxVal) * chartH : 0;
      const x = PAD_L + (i * (chartW / 12)) + barGap / 2;
      const y = PAD_T + chartH - bH;
      if (bH > 0) {
        const g = ctx.createLinearGradient(x, y, x, PAD_T + chartH);
        g.addColorStop(0, '#10b981'); g.addColorStop(1, 'rgba(16,185,129,0.15)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.roundRect(x, y, barW, bH, [4, 4, 0, 0]);
        ctx.fill();
        if (bH > 16) {
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.font = 'bold 8px Outfit, sans-serif'; ctx.textAlign = 'center';
          ctx.fillText(d.cost >= 1000 ? `${(d.cost/1000).toFixed(1)}k` : d.cost.toFixed(0), x + barW/2, y - 4);
        }
      }
      ctx.fillStyle = 'rgba(148,163,184,0.5)';
      ctx.font = '9px Outfit, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(MONTH_NAMES[i], x + barW/2, H - PAD_B + 16);
      if (d.count > 0) {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath(); ctx.arc(x + barW/2, H - PAD_B + 28, 3, 0, Math.PI*2); ctx.fill();
      }
    });
  }, [data, currency]);

  return <canvas ref={ref} style={{ width: '100%', height: 220, display: 'block' }} />;
}

const PIE_COLORS = ['#10b981','#f59e0b','#3b82f6','#8b5cf6','#ef4444','#ec4899','#14b8a6','#f97316'];

/* ─── Service Pie Chart ─────────────────────────────────────────────── */
function ServicePieChart({ breakdown, currency }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !breakdown?.length) return;
    const DPR = window.devicePixelRatio || 1;
    const SIZE = 140;
    canvas.width = SIZE * DPR; canvas.height = SIZE * DPR;
    const ctx = canvas.getContext('2d');
    ctx.scale(DPR, DPR);

    const total = breakdown.reduce((s, d) => s + d.cost, 0);
    if (total === 0) return;

    let start = -Math.PI / 2;
    const cx = SIZE/2, cy = SIZE/2, r = SIZE/2 - 8;

    breakdown.forEach((d, i) => {
      const angle = (d.cost / total) * 2 * Math.PI;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, start + angle);
      ctx.closePath(); ctx.fillStyle = PIE_COLORS[i % PIE_COLORS.length]; ctx.fill();
      start += angle;
    });

    // Donut hole
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.5, 0, 2*Math.PI);
    ctx.fillStyle = 'var(--card-bg, #13131f)'; ctx.fill();
  }, [breakdown]);

  const total = breakdown.reduce((s, d) => s + d.cost, 0);

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <canvas ref={ref} style={{ width: 140, height: 140, flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {breakdown.slice(0, 5).map((d, i) => (
          <div key={d.type} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 100 }}>{d.type}</span>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{currency}{d.cost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>{total > 0 ? `${((d.cost/total)*100).toFixed(0)}%` : '—'}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Graph Page ────────────────────────────────────────────────────── */
export default function GraphPage() {
  const router = useRouter();
  const [vehicle, setVehicle] = useState(null);
  const [activeTab, setActiveTab] = useState('petrol');
  const [mode, setMode] = useState('cost');
  const [year, setYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState([]);
  const [serviceMonthly, setServiceMonthly] = useState([]);
  const [serviceBreakdown, setServiceBreakdown] = useState([]);
  const [yearStats, setYearStats] = useState({ totalCost: 0, totalLiters: 0, totalFills: 0, avgMileage: 0 });
  const [svcYearStats, setSvcYearStats] = useState({ totalCost: 0, count: 0 });
  const [currency, setCurrency] = useState('₹');
  const [allLogs, setAllLogs] = useState([]);

  const loadData = (vid, yr) => {
    const pData = petrolStorage.getMonthlyStats(vid, yr);
    setMonthlyData(pData);
    const total = pData.reduce((s, d) => ({
      cost: s.cost + (d.cost || 0), liters: s.liters + (d.liters || 0), fills: s.fills + (d.fills || 0)
    }), { cost: 0, liters: 0, fills: 0 });
    const logs = petrolStorage.getByVehicle(vid).filter((l) => new Date(l.date).getFullYear() === yr && l.mileage !== null);
    const avgMileage = logs.length > 0 ? logs.reduce((s, l) => s + l.mileage, 0) / logs.length : 0;
    setYearStats({ totalCost: total.cost, totalLiters: total.liters, totalFills: total.fills, avgMileage });
    setAllLogs(petrolStorage.getByVehicle(vid));

    const sData = serviceStorage.getMonthlyStats(vid, yr);
    setServiceMonthly(sData);
    const sTotals = sData.reduce((s, d) => ({ cost: s.cost + (d.cost || 0), count: s.count + (d.count || 0) }), { cost: 0, count: 0 });
    setSvcYearStats(sTotals);
    setServiceBreakdown(serviceStorage.getTypeBreakdown(vid));
  };

  useEffect(() => {
    const activeId = settingsStorage.getActiveVehicleId();
    const v = vehicleStorage.getById(activeId) || vehicleStorage.getAll()[0];
    if (!v) { router.replace('/setup'); return; }
    setVehicle(v);
    setCurrency(settingsStorage.getCurrency());
    loadData(v.id, year);
  }, [year, router]);

  const mileageData = monthlyData.map((d, i) => {
    const logs = allLogs.filter((l) => new Date(l.date).getFullYear() === year && new Date(l.date).getMonth() === i && l.mileage !== null);
    const avg = logs.length > 0 ? logs.reduce((s, l) => s + l.mileage, 0) / logs.length : 0;
    return { ...d, cost: avg, liters: avg };
  });

  const chartData = mode === 'mileage' ? mileageData : monthlyData;
  const nonZero = monthlyData.filter((d) => d.cost > 0);
  const bestMonth = nonZero.length > 0 ? nonZero.reduce((a, b) => a.cost < b.cost ? a : b) : null;
  const worstMonth = nonZero.length > 0 ? nonZero.reduce((a, b) => a.cost > b.cost ? a : b) : null;

  return (
    <>
      <Header title="Analytics" showVehicleSwitch={true} />
      <div className="page safe-top">
        <div className="page-inner">

          {/* Tab Bar */}
          <div className="tab-bar">
            <button className={`tab-btn${activeTab === 'petrol' ? ' active' : ''}`} onClick={() => setActiveTab('petrol')}>
              ⛽ Petrol Stats
            </button>
            <button className={`tab-btn${activeTab === 'service' ? ' active' : ''}`} onClick={() => setActiveTab('service')}>
              🔧 Service Stats
            </button>
          </div>

          {/* Year Navigator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <button className="btn btn-ghost btn-icon" onClick={() => setYear((y) => y - 1)}>←</button>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{year}</div>
              <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                {activeTab === 'petrol' ? 'Petrol Expenses' : 'Service History'}
              </div>
            </div>
            <button className="btn btn-ghost btn-icon" onClick={() => setYear((y) => y + 1)} disabled={year >= new Date().getFullYear()}>→</button>
          </div>

          {/* ══ PETROL TAB ══════════════════════════════════ */}
          {activeTab === 'petrol' && (
            <>
              {/* Mode Toggle */}
              <div className="tab-bar" style={{ marginBottom: 12 }}>
                {[{ key: 'cost', label: '💰 Cost' }, { key: 'liters', label: '⛽ Liters' }, { key: 'mileage', label: '⚡ Mileage' }].map(({ key, label }) => (
                  <button key={key} className={`tab-btn${mode === key ? ' active' : ''}`} onClick={() => setMode(key)}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Chart */}
              <div className="card" style={{ padding: 16, marginBottom: 16 }}>
                {yearStats.totalFills === 0 ? (
                  <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 32 }}>📊</div>
                    <div style={{ color: 'var(--text-faint)', fontSize: 13 }}>No petrol data for {year}</div>
                  </div>
                ) : (
                  <ExpenseChart data={chartData} currency={currency} mode={mode === 'mileage' ? 'cost' : mode} />
                )}
              </div>

              {/* Year Summary */}
              <div className="section">
                <div className="section-title">Year Summary</div>
                <div className="grid-2" style={{ marginBottom: 12 }}>
                  <div className="stat-card">
                    <div className="stat-label">💸 Total Spent</div>
                    <div className="stat-value" style={{ color: 'var(--primary)', fontSize: 18 }}>
                      {currency}{(yearStats.totalCost || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                    <div className="stat-sub">{yearStats.totalFills || 0} fills</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">⚡ Avg Mileage</div>
                    <div className="stat-value" style={{ color: 'var(--emerald)', fontSize: 18 }}>
                      {yearStats.avgMileage > 0 ? yearStats.avgMileage.toFixed(1) : '—'}
                    </div>
                    <div className="stat-sub">km per liter</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">⛽ Total Fuel</div>
                    <div className="stat-value" style={{ fontSize: 18 }}>{(yearStats.totalLiters || 0).toFixed(1)}L</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">📅 Avg Monthly</div>
                    <div className="stat-value" style={{ fontSize: 18 }}>
                      {yearStats.totalFills > 0 ? `${currency}${((yearStats.totalCost || 0) / 12).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—'}
                    </div>
                  </div>
                </div>

                {bestMonth && worstMonth && bestMonth !== worstMonth && (
                  <div className="grid-2">
                    <div className="card" style={{ padding: '12px 14px', borderColor: 'rgba(16,185,129,0.2)' }}>
                      <div style={{ fontSize: 11, color: 'var(--emerald)', fontWeight: 600, marginBottom: 4 }}>💚 Lowest Spend</div>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{FULL_MONTHS[monthlyData.indexOf(bestMonth)]}</div>
                      <div style={{ fontSize: 13, color: 'var(--emerald)' }}>{currency}{bestMonth.cost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                    </div>
                    <div className="card" style={{ padding: '12px 14px', borderColor: 'rgba(239,68,68,0.2)' }}>
                      <div style={{ fontSize: 11, color: 'var(--red)', fontWeight: 600, marginBottom: 4 }}>🔴 Highest Spend</div>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{FULL_MONTHS[monthlyData.indexOf(worstMonth)]}</div>
                      <div style={{ fontSize: 13, color: 'var(--red)' }}>{currency}{worstMonth.cost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Monthly breakdown */}
              {yearStats.totalFills > 0 && (
                <div className="section">
                  <div className="section-title">Monthly Breakdown</div>
                  <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    {monthlyData.map((d, i) => d.fills > 0 && (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: i < 11 ? '1px solid var(--border)' : 'none', gap: 12 }}>
                        <div style={{ width: 32, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{MONTH_NAMES[i]}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: 3, width: `${(d.cost / Math.max(...monthlyData.map(x => x.cost), 1)) * 100}%`, background: 'linear-gradient(90deg, var(--primary), var(--primary-dark))', transition: 'width 0.5s ease' }} />
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', minWidth: 70 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{currency}{d.cost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>{d.liters.toFixed(1)}L · {d.fills} fill</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ══ SERVICE TAB ═════════════════════════════════ */}
          {activeTab === 'service' && (
            <>
              {/* Service bar chart */}
              <div className="card" style={{ padding: 16, marginBottom: 16 }}>
                {svcYearStats.count === 0 ? (
                  <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 32 }}>🔧</div>
                    <div style={{ color: 'var(--text-faint)', fontSize: 13 }}>No service data for {year}</div>
                  </div>
                ) : (
                  <ServiceBarChart data={serviceMonthly} currency={currency} />
                )}
              </div>

              {/* Service year stats */}
              <div className="section">
                <div className="section-title">Year Summary</div>
                <div className="grid-2" style={{ marginBottom: 16 }}>
                  <div className="stat-card">
                    <div className="stat-label">🔧 Service Cost</div>
                    <div className="stat-value" style={{ color: 'var(--emerald)', fontSize: 18 }}>
                      {currency}{(svcYearStats.cost || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                    <div className="stat-sub">{svcYearStats.count || 0} services</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">📅 Avg per Month</div>
                    <div className="stat-value" style={{ fontSize: 18 }}>
                      {svcYearStats.count > 0 ? `${currency}${((svcYearStats.cost || 0) / 12).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Service type breakdown pie */}
              {serviceBreakdown.length > 0 && (
                <div className="section">
                  <div className="section-title">By Service Type</div>
                  <div className="card" style={{ padding: 16 }}>
                    <ServicePieChart breakdown={serviceBreakdown} currency={currency} />
                  </div>
                </div>
              )}

              {/* Service monthly breakdown */}
              {svcYearStats.count > 0 && (
                <div className="section">
                  <div className="section-title">Monthly Breakdown</div>
                  <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    {serviceMonthly.map((d, i) => d.count > 0 && (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: i < 11 ? '1px solid var(--border)' : 'none', gap: 12 }}>
                        <div style={{ width: 32, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{MONTH_NAMES[i]}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: 3, width: `${(d.cost / Math.max(...serviceMonthly.map(x => x.cost), 1)) * 100}%`, background: 'linear-gradient(90deg, var(--emerald), #059669)', transition: 'width 0.5s ease' }} />
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', minWidth: 70 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--emerald)' }}>{currency}{d.cost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>{d.count} service{d.count > 1 ? 's' : ''}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>
      <BottomNav />
    </>
  );
}
