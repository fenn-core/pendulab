export const CHANNELS = [
  { key: 'x', label: 'Cart position', unit: 'm', color: '#84c8d5' },
  { key: 'v', label: 'Cart velocity', unit: 'm/s', color: '#8aa8e1' },
  { key: 'theta', label: 'Angular position', unit: 'rad', color: '#e4b872' },
  { key: 'omega', label: 'Angular velocity', unit: 'rad/s', color: '#c8a1d6' },
  { key: 'F', label: 'Control force', unit: 'N', color: '#d68f88' },
  { key: 'dE', label: 'Energy deviation', unit: 'J', color: '#a4c8a1' },
  { key: 'dpx', label: 'Momentum deviation', unit: 'kg·m/s', color: '#c4b5d9' },
];

export function prepareDataset(raw) {
  const { columns: c, length: n } = raw;
  const derived = {};
  const diagnostics = {};
  for (const [key, deviation] of [['E', 'dE'], ['px', 'dpx']]) {
    if (!c[key]) continue;
    const initial = c[key][0];
    const series = new Float64Array(n);
    let maxAbsolute = 0;
    for (let i = 0; i < n; i++) {
      series[i] = c[key][i] - initial;
      maxAbsolute = Math.max(maxAbsolute, Math.abs(series[i]));
    }
    derived[deviation] = series;
    diagnostics[key] = { initial, maxAbsolute };
  }
  const minMax = {};
  for (const ch of CHANNELS) {
    const series = c[ch.key] || derived[ch.key];
    if (!series) continue;
    const blockSize = 64;
    const count = Math.ceil(n / blockSize);
    const min = new Float64Array(count), max = new Float64Array(count);
    for (let block = 0; block < count; block++) {
      let lo = Infinity, hi = -Infinity;
      for (let i = block * blockSize; i < Math.min(n, (block + 1) * blockSize); i++) {
        lo = Math.min(lo, series[i]); hi = Math.max(hi, series[i]);
      }
      min[block] = lo; max[block] = hi;
    }
    minMax[ch.key] = { min, max, blockSize };
  }
  let maxAbsX = 0;
  for (let i = 0; i < n; i++) maxAbsX = Math.max(maxAbsX, Math.abs(c.x[i]));
  return { ...raw, derived, diagnostics, minMax, maxAbsX, start: c.t[0], end: c.t[n - 1] };
}

export function lowerBound(times, time) {
  let lo = 0, hi = times.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (times[mid] < time) lo = mid + 1; else hi = mid;
  }
  return lo;
}

export function indexAtTime(dataset, time) {
  const i = lowerBound(dataset.columns.t, time);
  if (i <= 0) return 0;
  if (i >= dataset.length) return dataset.length - 1;
  return time - dataset.columns.t[i - 1] <= dataset.columns.t[i] - time ? i - 1 : i;
}

export function visualStateAt(dataset, time) {
  const c = dataset.columns, right = lowerBound(c.t, time);
  if (right <= 0 || right >= dataset.length) {
    const i = right <= 0 ? 0 : dataset.length - 1;
    return { x: c.x[i], theta: c.theta[i] };
  }
  const left = right - 1;
  const alpha = (time - c.t[left]) / (c.t[right] - c.t[left]);
  const delta = Math.atan2(Math.sin(c.theta[right] - c.theta[left]), Math.cos(c.theta[right] - c.theta[left]));
  return { x: c.x[left] + (c.x[right] - c.x[left]) * alpha, theta: c.theta[left] + delta * alpha };
}

export function rangeMinMax(series, blocks, start, end) {
  let lo = Infinity, hi = -Infinity, i = start;
  const b = blocks.blockSize;
  while (i <= end && i % b) { lo = Math.min(lo, series[i]); hi = Math.max(hi, series[i]); i++; }
  while (i + b - 1 <= end) {
    const k = i / b; lo = Math.min(lo, blocks.min[k]); hi = Math.max(hi, blocks.max[k]); i += b;
  }
  while (i <= end) { lo = Math.min(lo, series[i]); hi = Math.max(hi, series[i]); i++; }
  return [lo, hi];
}
