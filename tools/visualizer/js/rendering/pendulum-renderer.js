import { visualStateAt, lowerBound } from '../data/dataset.js';

export function fitCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const width = Math.max(1, Math.round(rect.width * dpr));
  const height = Math.max(1, Math.round(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width: rect.width, height: rect.height };
}

export class PendulumRenderer {
  constructor(canvas) { this.canvas = canvas; this.showTrail = false; this.showAxes = true; this.showReference = true; this.length = 0.3; }
  draw(dataset, time) {
    const { ctx, width: w, height: h } = fitCanvas(this.canvas);
    ctx.clearRect(0, 0, w, h);
    const railY = h * .75;
    const viewHalf = Math.max(this.length * 2.4, dataset ? dataset.maxAbsX + this.length * 1.45 : 0.8);
    const px = Math.min((w - 100) / (2 * viewHalf), h * .49 / Math.max(this.length, .001));
    const origin = w / 2;
    const mapX = x => origin + x * px;
    const L = this.length * px;
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#252f36';
    const grid = niceStep(viewHalf * 2 / Math.max(3, w / 100));
    for (let x = Math.ceil(-viewHalf / grid) * grid; x <= viewHalf; x += grid) {
      const X = mapX(x); ctx.beginPath(); ctx.moveTo(X, 0); ctx.lineTo(X, h); ctx.stroke();
      ctx.fillStyle = '#64737a'; ctx.font = '10px IBM Plex Mono, monospace'; ctx.textAlign = 'center';
      ctx.fillText(`${+x.toFixed(2)} m`, X, h - 14);
    }
    for (let y = railY; y > 0; y -= grid * px) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    ctx.strokeStyle = '#52616a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(24, railY + 19); ctx.lineTo(w - 24, railY + 19); ctx.stroke();
    ctx.strokeStyle = '#38444b'; ctx.lineWidth = 1;
    for (let x = 28; x < w - 28; x += 14) { ctx.beginPath(); ctx.moveTo(x, railY + 20); ctx.lineTo(x - 8, railY + 27); ctx.stroke(); }
    if (this.showAxes) {
      ctx.strokeStyle = '#657d82'; ctx.setLineDash([4, 5]);
      ctx.beginPath(); ctx.moveTo(origin, railY - Math.min(L * 1.8, h * .68)); ctx.lineTo(origin, railY + 22); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#a1b0b5'; ctx.font = '11px IBM Plex Mono, monospace'; ctx.textAlign = 'left';
      ctx.fillText('+x →', Math.min(w - 45, origin + 10), railY + 47);
      ctx.fillText('+y ↑', Math.min(w - 45, origin + 10), railY - Math.min(L * 1.8, h * .68) + 10);
    }
    if (!dataset) return;
    const state = visualStateAt(dataset, time);
    const cx = mapX(state.x), pivotY = railY - 15;
    const mx = cx + Math.sin(state.theta) * L, my = pivotY - Math.cos(state.theta) * L;
    if (this.showTrail) {
      const t = dataset.columns.t, start = lowerBound(t, Math.max(dataset.start, time - 1.4)), end = lowerBound(t, time);
      const stride = Math.max(1, Math.ceil((end - start) / 240));
      ctx.beginPath(); let first = true;
      for (let i = start; i <= end && i < dataset.length; i += stride) {
        const x = mapX(dataset.columns.x[i]) + Math.sin(dataset.columns.theta[i]) * L;
        const y = pivotY - Math.cos(dataset.columns.theta[i]) * L;
        first ? ctx.moveTo(x, y) : ctx.lineTo(x, y); first = false;
      }
      ctx.strokeStyle = 'rgba(228,184,114,.28)'; ctx.lineWidth = 1.5; ctx.stroke();
    }
    if (this.showReference) {
      ctx.setLineDash([5, 5]); ctx.strokeStyle = '#61777c'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx, pivotY); ctx.lineTo(cx, pivotY - L); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#74898d'; ctx.font = '10px IBM Plex Mono, monospace'; ctx.textAlign = 'left';
      ctx.fillText('θ = 0', cx + 8, pivotY - L + 3);
    }
    ctx.fillStyle = '#1b242a'; ctx.strokeStyle = '#a9bac0'; ctx.lineWidth = 1.5;
    ctx.fillRect(cx - 34, railY - 30, 68, 30); ctx.strokeRect(cx - 34, railY - 30, 68, 30);
    ctx.fillStyle = '#44535a';
    ctx.fillRect(cx - 25, railY - 2, 16, 6); ctx.fillRect(cx + 9, railY - 2, 16, 6);
    ctx.strokeStyle = '#e4b872'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(cx, pivotY); ctx.lineTo(mx, my); ctx.stroke();
    ctx.fillStyle = '#182227'; ctx.strokeStyle = '#e4b872'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(mx, my, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e4b872'; ctx.beginPath(); ctx.arc(mx, my, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d7e0e0'; ctx.strokeStyle = '#83969a';
    ctx.beginPath(); ctx.arc(cx, pivotY, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#64777b'; ctx.lineWidth = 1;
    const dimX = Math.min(w - 40, cx + L + 27);
    ctx.beginPath(); ctx.moveTo(dimX, pivotY); ctx.lineTo(dimX, pivotY - L); ctx.moveTo(dimX - 5, pivotY); ctx.lineTo(dimX + 5, pivotY); ctx.moveTo(dimX - 5, pivotY - L); ctx.lineTo(dimX + 5, pivotY - L); ctx.stroke();
    ctx.fillStyle = '#9aadaf'; ctx.font = '10px IBM Plex Mono, monospace'; ctx.textAlign = 'left';
    ctx.fillText(`l = ${this.length.toFixed(3)} m`, dimX + 8, pivotY - L / 2);
  }
}

function niceStep(value) {
  const scale = 10 ** Math.floor(Math.log10(Math.max(value, 1e-6)));
  const n = value / scale;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * scale;
}
