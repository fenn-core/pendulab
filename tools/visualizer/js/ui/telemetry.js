const FIELDS = [
  ['t', 'Simulation time', 's'], ['x', 'Cart position', 'm'], ['v', 'Cart velocity', 'm/s'],
  ['theta', 'Angular position', 'rad'], ['omega', 'Angular velocity', 'rad/s'],
  ['F', 'Control input force', 'N'], ['K', 'Kinetic energy', 'J'], ['U', 'Potential energy', 'J'],
  ['E', 'Total mechanical energy', 'J'], ['dE', 'Energy deviation', 'J'],
  ['px', 'Horizontal momentum', 'kg·m/s'], ['dpx', 'Momentum deviation', 'kg·m/s'],
];

export class TelemetryView {
  constructor(list, diagnostics) { this.list = list; this.diagnostics = diagnostics; this.rows = new Map(); this.lastIndex = -1; this.precision = 5; this.build(); }
  build() {
    for (const [key, label, unit] of FIELDS) {
      const row = document.createElement('div'); row.className = 'telemetry-row';
      const name = document.createElement('span'); name.className = 'name'; name.textContent = label;
      const value = document.createElement('span'); value.className = 'value'; value.textContent = '—';
      const unitEl = document.createElement('span'); unitEl.className = 'unit'; unitEl.textContent = unit;
      const right = document.createElement('span'); right.append(value, unitEl); row.append(name, right);
      this.list.append(row); this.rows.set(key, { row, value });
    }
  }
  setDataset(dataset) { this.dataset = dataset; this.lastIndex = -1; this.updateDiagnostics(0); }
  setPrecision(p) { this.precision = p; this.lastIndex = -1; }
  update(index) {
    if (!this.dataset || index === this.lastIndex) return;
    this.lastIndex = index;
    for (const [key] of FIELDS) {
      const series = this.dataset.columns[key] || this.dataset.derived[key];
      const item = this.rows.get(key);
      item.row.classList.toggle('unavailable', !series);
      item.value.textContent = series ? formatValue(series[index], this.precision) : 'UNAVAILABLE';
    }
    this.updateDiagnostics(index);
  }
  updateDiagnostics(index) {
    this.diagnostics.replaceChildren();
    if (!this.dataset) return;
    const title = document.createElement('div'); title.className = 'diag-title'; title.textContent = 'DIAGNOSTIC COMPARISON'; this.diagnostics.append(title);
    for (const [key, label, unit] of [['E', 'Total energy', 'J'], ['px', 'Horizontal momentum', 'kg·m/s']]) {
      const c = this.dataset.columns[key], stats = this.dataset.diagnostics[key];
      const group = document.createElement('div'); group.className = 'diag-group';
      const heading = document.createElement('div'); heading.className = 'diag-header'; heading.innerHTML = `<span>${label}</span><span>${unit}</span>`; group.append(heading);
      if (!c) { addRow(group, 'Recorded channel', 'UNAVAILABLE'); this.diagnostics.append(group); continue; }
      const delta = c[index] - stats.initial;
      addRow(group, 'Initial · recorded', formatValue(stats.initial, this.precision));
      addRow(group, 'Current · recorded', formatValue(c[index], this.precision));
      addRow(group, '|Current − initial| · derived', formatValue(Math.abs(delta), this.precision));
      addRow(group, 'Relative deviation · derived', stats.initial !== 0 ? formatValue(Math.abs(delta / stats.initial) * 100, this.precision) + ' %' : 'N/A (zero baseline)');
      addRow(group, 'Maximum |deviation| · derived', formatValue(stats.maxAbsolute, this.precision));
      this.diagnostics.append(group);
    }
    const note = document.createElement('div'); note.className = 'diag-note'; note.textContent = 'Deviations describe recorded change from the first sample. Under external forcing, they are not integration error estimates.'; this.diagnostics.append(note);
  }
}

function addRow(parent, name, value) {
  const row = document.createElement('div'); row.className = 'diag-row';
  const a = document.createElement('span'); a.textContent = name;
  const b = document.createElement('strong'); b.textContent = value;
  row.append(a, b); parent.append(row);
}
export function formatValue(value, precision = 5) {
  if (!Number.isFinite(value)) return '—';
  if (value === 0) return '0';
  if (Math.abs(value) < .0001 || Math.abs(value) >= 100000) return value.toExponential(Math.max(1, precision - 1));
  return value.toPrecision(precision);
}
