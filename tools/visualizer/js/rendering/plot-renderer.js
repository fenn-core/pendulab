import { fitCanvas } from './pendulum-renderer.js';
import { lowerBound, indexAtTime, rangeMinMax } from '../data/dataset.js';

export class PlotRenderer {
  constructor(host, channel, onSeek) {
    this.host = host; this.channel = channel; this.onSeek = onSeek;
    this.canvas = document.createElement('canvas'); this.canvas.className = 'plot-canvas'; host.append(this.canvas);
    this.dirty = true; this.lastRange = '';
    this.canvas.addEventListener('pointermove', event => this.inspect(event));
    this.canvas.addEventListener('pointerleave', () => { this.hover = null; this.drawOverlay(); });
    this.canvas.addEventListener('click', event => { if (this.dataset && this.range) this.onSeek(this.timeFromEvent(event)); });
  }
  setDataset(dataset) { this.dataset = dataset; this.dirty = true; }
  setRange(start, end) {
    const key = `${start.toFixed(3)}:${end.toFixed(3)}:${this.canvas.clientWidth}:${this.canvas.clientHeight}`;
    if (key !== this.lastRange) { this.range = [start, end]; this.lastRange = key; this.dirty = true; }
  }
  timeFromEvent(event) {
    const x = event.clientX - this.canvas.getBoundingClientRect().left;
    return this.range[0] + Math.max(0, Math.min(1, (x - 48) / (this.canvas.clientWidth - 62))) * (this.range[1] - this.range[0]);
  }
  inspect(event) { if (!this.dataset || !this.range) return; this.hover = this.timeFromEvent(event); this.drawOverlay(); }
  draw(time) { this.time = time; if (this.dirty) this.drawBase(); this.drawOverlay(); }
  drawBase() {
    this.dirty = false;
    const { ctx, width: w, height: h } = fitCanvas(this.canvas);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.base = document.createElement('canvas'); this.base.width = this.canvas.width; this.base.height = this.canvas.height;
    const b = this.base.getContext('2d'); b.setTransform(dpr, 0, 0, dpr, 0, 0);
    b.clearRect(0, 0, w, h);
    b.fillStyle = '#11191d'; b.fillRect(0, 0, w, h);
    if (!this.dataset || !this.range) return;
    const series = this.dataset.columns[this.channel.key] || this.dataset.derived[this.channel.key];
    const [t0, t1] = this.range, times = this.dataset.columns.t;
    const left = Math.max(0, lowerBound(times, t0) - 1), right = Math.min(this.dataset.length - 1, lowerBound(times, t1));
    const [min, max] = rangeMinMax(series, this.dataset.minMax[this.channel.key], left, right);
    const span = Math.max(max - min, Math.abs(max) * .02, 1e-10);
    const yMin = min - span * .12, yMax = max + span * .12;
    this.yRange = [yMin, yMax];
    const plotW = Math.max(1, w - 62), plotH = Math.max(1, h - 32);
    this.plotRect = { x: 48, y: 8, w: plotW, h: plotH };
    b.strokeStyle = '#28343b'; b.lineWidth = 1; b.font = '10px IBM Plex Mono, monospace'; b.fillStyle = '#809198';
    for (let j = 0; j <= 3; j++) {
      const y = 8 + j * plotH / 3;
      b.beginPath(); b.moveTo(48, y + .5); b.lineTo(w - 14, y + .5); b.stroke();
      b.textAlign = 'right'; b.fillText(formatAxis(yMax - j * (yMax - yMin) / 3), 43, y + 3);
    }
    for (let j = 0; j <= 4; j++) {
      const x = 48 + j * plotW / 4;
      b.beginPath(); b.moveTo(x + .5, 8); b.lineTo(x + .5, 8 + plotH); b.stroke();
      b.textAlign = 'center'; b.fillText(`${formatAxis(t0 + j * (t1 - t0) / 4)} s`, x, h - 5);
    }
    b.strokeStyle = this.channel.color; b.lineWidth = 1.3;
    const yFor = v => 8 + (yMax - v) / (yMax - yMin) * plotH;
    b.beginPath();
    if (right - left < plotW * 2) {
      for (let i = left; i <= right; i++) {
        const x = 48 + (times[i] - t0) / (t1 - t0 || 1) * plotW;
        i === left ? b.moveTo(x, yFor(series[i])) : b.lineTo(x, yFor(series[i]));
      }
    } else {
      for (let p = 0; p < Math.ceil(plotW); p++) {
        const a = Math.max(left, lowerBound(times, t0 + p / plotW * (t1 - t0)));
        const z = Math.min(right, Math.max(a, lowerBound(times, t0 + (p + 1) / plotW * (t1 - t0)) - 1));
        if (a > right) break;
        const [lo, hi] = rangeMinMax(series, this.dataset.minMax[this.channel.key], a, z);
        b.moveTo(48 + p, yFor(lo)); b.lineTo(48 + p, yFor(hi));
      }
    }
    b.stroke();
    ctx.clearRect(0, 0, w, h);
  }
  drawOverlay() {
    const { ctx, width: w, height: h } = fitCanvas(this.canvas);
    if (!this.base) return;
    ctx.clearRect(0, 0, w, h); ctx.drawImage(this.base, 0, 0, w, h);
    if (!this.dataset || !this.range || !this.plotRect) return;
    const [t0, t1] = this.range, r = this.plotRect;
    const mark = (time, color, dashed) => {
      if (time < t0 || time > t1) return;
      const x = r.x + (time - t0) / (t1 - t0 || 1) * r.w;
      ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.setLineDash(dashed ? [3, 3] : []);
      ctx.beginPath(); ctx.moveTo(x + .5, r.y); ctx.lineTo(x + .5, r.y + r.h); ctx.stroke(); ctx.setLineDash([]);
    };
    mark(this.time, '#e5edf0', false);
    if (this.hover != null) {
      mark(this.hover, '#e4b872', true);
      const i = indexAtTime(this.dataset, this.hover);
      const series = this.dataset.columns[this.channel.key] || this.dataset.derived[this.channel.key];
      const label = `${this.dataset.columns.t[i].toFixed(4)} s  ${series[i].toPrecision(5)} ${this.channel.unit}`;
      ctx.font = '10px IBM Plex Mono, monospace';
      const bw = Math.min(w - 8, ctx.measureText(label).width + 14);
      ctx.fillStyle = '#263238'; ctx.fillRect(w - bw - 6, 8, bw, 19);
      ctx.fillStyle = '#f0eeee'; ctx.textAlign = 'right'; ctx.fillText(label, w - 12, 21);
    }
  }
}

function formatAxis(value) {
  if (!Number.isFinite(value)) return '—';
  if (value === 0) return '0';
  if (Math.abs(value) < .001 || Math.abs(value) >= 10000) return value.toExponential(1);
  return +value.toPrecision(3) + '';
}
