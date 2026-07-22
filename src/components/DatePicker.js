'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function parseDate(str) {
  // str: YYYY-MM-DD
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toDateStr(date) {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDisplay(str) {
  if (!str) return '';
  const d = parseDate(str);
  if (!d) return str;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function DatePicker({ value, onChange, label, placeholder = 'Select date', maxDate, minDate, id }) {
  const today = new Date();
  const parsed = parseDate(value);

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState((parsed || today).getFullYear());
  const [viewMonth, setViewMonth] = useState((parsed || today).getMonth());
  const [yearPickerOpen, setYearPickerOpen] = useState(false);
  const wrapRef = useRef(null);
  const selectedYearRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setYearPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Scroll selected year into view when year picker opens
  useEffect(() => {
    if (yearPickerOpen === 'year' && selectedYearRef.current) {
      setTimeout(() => {
        selectedYearRef.current?.scrollIntoView({ block: 'center', behavior: 'instant' });
      }, 50);
    }
  }, [yearPickerOpen]);

  // Sync view to value changes
  useEffect(() => {
    if (parsed) { setViewYear(parsed.getFullYear()); setViewMonth(parsed.getMonth()); }
  }, [value]);

  const handleDayClick = useCallback((day) => {
    const selected = new Date(viewYear, viewMonth, day);
    // Clamp to minDate / maxDate
    if (maxDate && selected > parseDate(maxDate)) return;
    if (minDate && selected < parseDate(minDate)) return;
    onChange(toDateStr(selected));
    setOpen(false);
    setYearPickerOpen(false);
  }, [viewYear, viewMonth, onChange, maxDate, minDate]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  // Build grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const isToday = (d) => d && d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
  const isSelected = (d) => {
    if (!d || !parsed) return false;
    return d === parsed.getDate() && viewMonth === parsed.getMonth() && viewYear === parsed.getFullYear();
  };
  const isDisabled = (d) => {
    if (!d) return false;
    const dt = new Date(viewYear, viewMonth, d);
    if (maxDate && dt > parseDate(maxDate)) return true;
    if (minDate && dt < parseDate(minDate)) return true;
    return false;
  };

  // Year picker range: from currentYear + 5 down to 95 years ago
  const currentYear = today.getFullYear();
  const years = Array.from({ length: 101 }, (_, i) => currentYear + 5 - i);

  const goToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    onChange(toDateStr(today));
    setOpen(false);
    setYearPickerOpen(false);
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }} id={id}>
      <style>{`
        .dp-trigger {
          width: 100%;
          background: var(--input-bg);
          border: 1.5px solid var(--border);
          border-radius: 10px;
          padding: 12px 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: border-color 0.2s, box-shadow 0.2s;
          font-family: inherit;
          font-size: 15px;
          color: var(--text);
          outline: none;
          -webkit-tap-highlight-color: transparent;
          text-align: left;
        }
        .dp-trigger:hover, .dp-trigger.open {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--primary-glow);
        }
        .dp-trigger-icon {
          font-size: 16px;
          flex-shrink: 0;
        }
        .dp-trigger-text {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .dp-trigger-arrow {
          font-size: 10px;
          color: var(--text-faint);
          transition: transform 0.2s;
        }
        .dp-trigger.open .dp-trigger-arrow {
          transform: rotate(180deg);
        }
        .dp-popup {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          z-index: 200;
          background: var(--modal-bg);
          border: 1px solid var(--border-strong);
          border-radius: 16px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.35);
          overflow: hidden;
          animation: dp-pop 0.18s cubic-bezier(0.34,1.56,0.64,1);
          min-width: 280px;
        }
        @keyframes dp-pop {
          from { opacity: 0; transform: translateY(-8px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .dp-header {
          display: flex;
          align-items: center;
          padding: 14px 12px 10px;
          gap: 6px;
          border-bottom: 1px solid var(--border);
          background: var(--surface);
        }
        .dp-nav-btn {
          width: 30px; height: 30px;
          border-radius: 8px;
          background: var(--surface);
          border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; cursor: pointer;
          color: var(--text-muted);
          transition: all 0.15s;
          flex-shrink: 0;
          -webkit-tap-highlight-color: transparent;
        }
        .dp-nav-btn:hover { background: var(--primary-glow); border-color: var(--primary); color: var(--primary); }
        .dp-month-year-btn {
          flex: 1;
          text-align: center;
          font-weight: 700;
          font-size: 14px;
          color: var(--text);
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 8px;
          border: 1px solid transparent;
          transition: all 0.15s;
          font-family: inherit;
          background: transparent;
          -webkit-tap-highlight-color: transparent;
        }
        .dp-month-year-btn:hover { background: var(--surface-hover); border-color: var(--border); }
        .dp-grid-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          padding: 8px 10px 4px;
          gap: 2px;
        }
        .dp-grid-header span {
          text-align: center;
          font-size: 11px;
          font-weight: 700;
          color: var(--text-faint);
          padding: 4px 0;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .dp-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          padding: 0 10px 6px;
          gap: 2px;
        }
        .dp-cell {
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          border: 1.5px solid transparent;
          transition: all 0.12s;
          color: var(--text);
          -webkit-tap-highlight-color: transparent;
          position: relative;
          font-family: inherit;
          background: transparent;
        }
        .dp-cell:hover:not(.empty):not(.disabled) {
          background: var(--primary-glow);
          border-color: var(--primary);
          color: var(--primary);
        }
        .dp-cell.today {
          border-color: rgba(245,158,11,0.4);
          color: var(--primary);
          font-weight: 700;
        }
        .dp-cell.selected {
          background: var(--primary) !important;
          border-color: var(--primary) !important;
          color: #000 !important;
          font-weight: 800;
          box-shadow: 0 2px 8px var(--primary-glow);
        }
        .dp-cell.disabled {
          opacity: 0.25;
          cursor: not-allowed;
          pointer-events: none;
        }
        .dp-cell.empty { cursor: default; pointer-events: none; }
        .dp-footer {
          padding: 8px 12px 12px;
          border-top: 1px solid var(--border);
          display: flex;
          gap: 6px;
          align-items: center;
        }
        .dp-today-btn {
          flex: 1;
          padding: 8px;
          border-radius: 8px;
          border: 1.5px solid var(--primary);
          background: var(--primary-glow);
          color: var(--primary);
          font-family: inherit;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
          -webkit-tap-highlight-color: transparent;
        }
        .dp-today-btn:hover { background: var(--primary); color: #000; }
        .dp-clear-btn {
          padding: 8px 14px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text-muted);
          font-family: inherit;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          -webkit-tap-highlight-color: transparent;
        }
        .dp-clear-btn:hover { border-color: var(--red); color: var(--red); background: var(--red-glow); }

        /* Year Picker */
        .dp-year-picker {
          max-height: 240px;
          overflow-y: auto;
          padding: 8px 10px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 4px;
          scrollbar-width: thin;
        }
        .dp-year-btn {
          padding: 8px 4px;
          border-radius: 8px;
          border: 1px solid transparent;
          background: transparent;
          font-family: inherit;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-muted);
          cursor: pointer;
          text-align: center;
          transition: all 0.12s;
          -webkit-tap-highlight-color: transparent;
        }
        .dp-year-btn:hover { background: var(--primary-glow); border-color: var(--primary); color: var(--primary); }
        .dp-year-btn.current-year { color: var(--primary); font-weight: 700; }
        .dp-year-btn.selected-year { background: var(--primary); color: #000; font-weight: 800; border-radius: 8px; }

        /* Month picker strip */
        .dp-month-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 4px;
          padding: 8px 10px;
        }
        .dp-month-btn {
          padding: 8px 4px;
          border-radius: 8px;
          border: 1px solid transparent;
          background: transparent;
          font-family: inherit;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-muted);
          cursor: pointer;
          text-align: center;
          transition: all 0.12s;
          -webkit-tap-highlight-color: transparent;
        }
        .dp-month-btn:hover { background: var(--primary-glow); border-color: var(--primary); color: var(--primary); }
        .dp-month-btn.current-month { color: var(--primary); font-weight: 700; }
        .dp-month-btn.selected-month { background: var(--primary); color: #000; font-weight: 800; }
      `}</style>

      {/* Trigger Button */}
      <button
        type="button"
        className={`dp-trigger${open ? ' open' : ''}`}
        onClick={() => { setOpen((o) => !o); setYearPickerOpen(false); }}
      >
        <span className="dp-trigger-icon">📅</span>
        <span className="dp-trigger-text" style={{ color: value ? 'var(--text)' : 'var(--text-faint)' }}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        <span className="dp-trigger-arrow">▼</span>
      </button>

      {/* Popup */}
      {open && (
        <div className="dp-popup">

          {/* Year Picker Mode */}
          {yearPickerOpen === 'year' && (
            <>
              <div className="dp-header">
                <button
                  type="button"
                  className="dp-month-year-btn"
                  onClick={() => setYearPickerOpen(false)}
                  style={{ fontSize: 13 }}
                >
                  ← Back
                </button>
              </div>
              <div className="dp-year-picker">
                {years.map((yr) => (
                  <button
                    key={yr}
                    ref={yr === viewYear ? selectedYearRef : null}
                    type="button"
                    className={`dp-year-btn${yr === currentYear ? ' current-year' : ''}${yr === viewYear ? ' selected-year' : ''}`}
                    onClick={() => { setViewYear(yr); setYearPickerOpen(false); }}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Month Picker Mode */}
          {yearPickerOpen === 'month' && (
            <>
              <div className="dp-header">
                <button
                  type="button"
                  className="dp-month-year-btn"
                  onClick={() => setYearPickerOpen(false)}
                  style={{ fontSize: 13 }}
                >
                  ← Back
                </button>
              </div>
              <div className="dp-month-strip">
                {MONTHS_SHORT.map((mn, i) => (
                  <button
                    key={mn}
                    type="button"
                    className={`dp-month-btn${i === today.getMonth() && viewYear === today.getFullYear() ? ' current-month' : ''}${i === viewMonth ? ' selected-month' : ''}`}
                    onClick={() => { setViewMonth(i); setYearPickerOpen(false); }}
                  >
                    {mn}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Calendar Mode */}
          {!yearPickerOpen && (
            <>
              <div className="dp-header">
                <button type="button" className="dp-nav-btn" onClick={prevMonth}>‹</button>
                <button
                  type="button"
                  className="dp-month-year-btn"
                  onClick={() => setYearPickerOpen('month')}
                  title="Pick month"
                >
                  {MONTHS[viewMonth]}
                </button>
                <button
                  type="button"
                  className="dp-month-year-btn"
                  onClick={() => setYearPickerOpen('year')}
                  title="Pick year"
                  style={{ flex: '0 0 auto', minWidth: 54 }}
                >
                  {viewYear}
                </button>
                <button type="button" className="dp-nav-btn" onClick={nextMonth}>›</button>
              </div>

              <div className="dp-grid-header">
                {DAYS.map((d) => <span key={d}>{d}</span>)}
              </div>

              <div className="dp-grid">
                {cells.map((d, i) => (
                  <button
                    key={i}
                    type="button"
                    className={[
                      'dp-cell',
                      !d ? 'empty' : '',
                      isToday(d) && !isSelected(d) ? 'today' : '',
                      isSelected(d) ? 'selected' : '',
                      isDisabled(d) ? 'disabled' : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => d && handleDayClick(d)}
                    disabled={!d || isDisabled(d)}
                  >
                    {d || ''}
                  </button>
                ))}
              </div>

              <div className="dp-footer">
                <button type="button" className="dp-today-btn" onClick={goToday}>
                  Today
                </button>
                {value && (
                  <button
                    type="button"
                    className="dp-clear-btn"
                    onClick={() => { onChange(''); setOpen(false); }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
