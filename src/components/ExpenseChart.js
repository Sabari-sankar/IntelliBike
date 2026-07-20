'use client';
import { useEffect, useRef } from 'react';

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function ExpenseChart({ data, currency = '₹', mode = 'cost' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const DPR = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.scale(DPR, DPR);

    // Clear
    ctx.clearRect(0, 0, W, H);

    const values = data.map((d) => (mode === 'cost' ? d.cost : d.liters));
    const maxVal = Math.max(...values, 1);

    const PAD_LEFT = 48;
    const PAD_RIGHT = 12;
    const PAD_TOP = 20;
    const PAD_BOTTOM = 48;
    const chartW = W - PAD_LEFT - PAD_RIGHT;
    const chartH = H - PAD_TOP - PAD_BOTTOM;
    const barGap = 6;
    const barW = (chartW / 12) - barGap;

    // Horizontal grid lines
    const gridLines = 4;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= gridLines; i++) {
      const y = PAD_TOP + (chartH / gridLines) * i;
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.beginPath();
      ctx.moveTo(PAD_LEFT, y);
      ctx.lineTo(W - PAD_RIGHT, y);
      ctx.stroke();

      // Y-axis labels
      const val = maxVal - (maxVal / gridLines) * i;
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = `${10 * DPR / DPR}px Outfit, sans-serif`;
      ctx.textAlign = 'right';
      const label = mode === 'cost'
        ? val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(0)
        : val.toFixed(1);
      ctx.fillText(label, PAD_LEFT - 4, y + 4);
    }

    // Bars
    data.forEach((d, i) => {
      const val = mode === 'cost' ? d.cost : d.liters;
      const barH = val > 0 ? (val / maxVal) * chartH : 0;
      const x = PAD_LEFT + (i * (chartW / 12)) + barGap / 2;
      const y = PAD_TOP + chartH - barH;

      // Bar gradient
      if (val > 0) {
        const grad = ctx.createLinearGradient(x, y, x, PAD_TOP + chartH);
        grad.addColorStop(0, '#f59e0b');
        grad.addColorStop(1, 'rgba(245,158,11,0.2)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]);
        ctx.fill();

        // Value label on top
        if (barH > 20) {
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.font = `bold ${9}px Outfit, sans-serif`;
          ctx.textAlign = 'center';
          const top = mode === 'cost'
            ? val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(0)
            : val.toFixed(1);
          ctx.fillText(top, x + barW / 2, y - 4);
        }
      }

      // Month label
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = `${10}px Outfit, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(MONTH_SHORT[i], x + barW / 2, H - PAD_BOTTOM + 16);

      // Fill count dot
      if (d.fills > 0) {
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(x + barW / 2, H - PAD_BOTTOM + 28, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });

  }, [data, mode, currency]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '220px', display: 'block' }}
    />
  );
}
