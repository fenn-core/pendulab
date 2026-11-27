import { parseCSV } from './data/csv-parser.js';
import { CHANNELS, prepareDataset, indexAtTime } from './data/dataset.js';
import { PlaybackEngine } from './playback/playback-engine.js';
import { PendulumRenderer } from './rendering/pendulum-renderer.js';
import { PlotRenderer } from './rendering/plot-renderer.js';
import { TelemetryView } from './ui/telemetry.js';

const $ = id => document.getElementById(id);
const mechanical = new PendulumRenderer($('mechanical-canvas'));
const telemetry = new TelemetryView($('telemetry-list'), $('diagnostics'));
const plots = new Map();
let dataset = null, dirty = true, lastPlotTime = 0, loadGeneration = 0;
const playback = new PlaybackEngine(() => { dirty = true; });
const enabled = new Set(['x', 'theta', 'omega', 'F', 'dE', 'dpx']);

function notify(message, error = false) {
  $('footer-message').textContent = message;
  $('message').hidden = !error;
  if (error) $('message').textContent = message;
}

function updateHeader() {
  $('dataset-name').textContent = dataset?.filename || 'No dataset';
  $('duration').textContent = dataset ? `${(dataset.end - dataset.start).toFixed(3)} s` : '—';
  $('status').textContent = dataset ? playback.playing ? 'PLAYING' : playback.time >= dataset.end ? 'COMPLETE' : 'PAUSED' : 'STANDBY';
  $('play').textContent = playback.playing ? 'Ⅱ' : '▶';
  $('play').setAttribute('aria-label', playback.playing ? 'Pause' : 'Play');
}

function updatePlots() {
  const host = $('plots-grid'), picker = $('channel-picker');
  host.replaceChildren(); picker.replaceChildren(); plots.clear();
  if (!dataset) { const empty = document.createElement('div'); empty.className = 'empty-plots'; empty.textContent = 'Load a CSV dataset to inspect recorded channels.'; host.append(empty); return; }
  for (const ch of CHANNELS) {
    const available = !!(dataset.columns[ch.key] || dataset.derived[ch.key]);
    const option = document.createElement('label');
    const check = document.createElement('input'); check.type = 'checkbox'; check.checked = available && enabled.has(ch.key); check.disabled = !available;
    check.addEventListener('change', () => { check.checked ? enabled.add(ch.key) : enabled.delete(ch.key); updatePlots(); dirty = true; });
    option.append(check, document.createTextNode(` ${ch.label}${available ? '' : ' · unavailable'}`)); picker.append(option);
    if (!available || !enabled.has(ch.key)) continue;
    const card = document.createElement('article'); card.className = 'plot-card';
    const label = document.createElement('div'); label.className = 'plot-label';
    const name = document.createElement('span'); const dot = document.createElement('i'); dot.className = 'series-key'; dot.style.background = ch.color;
    name.append(dot, document.createTextNode(ch.label));
    const unit = document.createElement('span'); unit.textContent = ch.unit;
    label.append(name, unit); card.append(label); host.append(card);
    const plot = new PlotRenderer(card, ch, time => playback.seek(time)); plot.setDataset(dataset); plots.set(ch.key, plot);
  }
  if (!plots.size) { const empty = document.createElement('div'); empty.className = 'empty-plots'; empty.textContent = 'Enable a recorded channel to display a plot.'; host.append(empty); }
}

async function loadText(text, filename) {
  const generation = ++loadGeneration;
  playback.pause(); notify(`Parsing ${filename}…`);
  try {
    const raw = await parseCSV(text, filename, progress => { if (generation === loadGeneration) notify(`Parsing ${filename} · ${Math.round(progress * 100)}%`); });
    if (generation !== loadGeneration) return;
    dataset = prepareDataset(raw);
    playback.load(dataset); telemetry.setDataset(dataset); updatePlots();
    $('timeline').disabled = false;
    $('timeline-start').textContent = `${dataset.start.toFixed(3)} s`;
    $('timeline-end').textContent = `${dataset.end.toFixed(3)} s`;
    $('end-time').textContent = dataset.end.toFixed(3);
    notify(`${dataset.length.toLocaleString()} recorded samples loaded · ${filename}`);
    dirty = true;
  } catch (error) { if (generation === loadGeneration) notify(error.message, true); }
}

$('file-input').addEventListener('change', async event => {
  const file = event.target.files[0]; if (!file) return;
  await loadText(await file.text(), file.name); event.target.value = '';
});
$('demo-button').addEventListener('click', async () => {
  try {
    notify('Loading bundled C simulation output…');
    const response = await fetch(new URL('../examples/simulation.csv', import.meta.url));
    if (!response.ok) throw new Error(`Demo request failed: HTTP ${response.status}.`);
    await loadText(await response.text(), 'simulation.csv · project demo');
  } catch (error) { notify(`${error.message} Run the visualizer through a local HTTP server.`, true); }
});

let dragDepth = 0;
document.addEventListener('dragenter', event => { event.preventDefault(); dragDepth++; $('drop-overlay').hidden = false; });
document.addEventListener('dragleave', event => { event.preventDefault(); if (--dragDepth <= 0) { dragDepth = 0; $('drop-overlay').hidden = true; } });
document.addEventListener('dragover', event => event.preventDefault());
document.addEventListener('drop', async event => {
  event.preventDefault(); dragDepth = 0; $('drop-overlay').hidden = true;
  const file = event.dataTransfer.files[0];
  if (!file) return;
  if (!/\.csv$/i.test(file.name)) return notify('Please drop a .csv file.', true);
  await loadText(await file.text(), file.name);
});

$('play').addEventListener('click', () => playback.toggle());
$('restart').addEventListener('click', () => playback.restart());
$('back').addEventListener('click', () => playback.step(-1));
$('forward').addEventListener('click', () => playback.step(1));
$('speed').addEventListener('change', event => { playback.speed = Number(event.target.value); });
$('loop').addEventListener('change', event => { playback.loop = event.target.checked; });
$('timeline').addEventListener('input', event => { if (dataset) playback.seek(dataset.start + Number(event.target.value) / 100000 * (dataset.end - dataset.start)); });
$('window-mode').addEventListener('change', () => { lastPlotTime = 0; dirty = true; });
$('window-size').addEventListener('change', () => { lastPlotTime = 0; dirty = true; });
$('channels-button').addEventListener('click', () => { $('channel-picker').hidden = !$('channel-picker').hidden; });
$('precision').addEventListener('change', event => { telemetry.setPrecision(Number(event.target.value)); dirty = true; });
$('show-reference').addEventListener('change', event => { mechanical.showReference = event.target.checked; dirty = true; });
$('show-trail').addEventListener('change', event => { mechanical.showTrail = event.target.checked; dirty = true; });
$('show-axes').addEventListener('change', event => { mechanical.showAxes = event.target.checked; dirty = true; });
$('length-input').addEventListener('change', event => {
  const length = Number(event.target.value);
  if (!Number.isFinite(length) || length <= 0) { event.target.value = mechanical.length; return notify('Link length must be a positive number in meters.', true); }
  mechanical.length = length;
  document.querySelector('.source-tag').textContent = 'USER SET';
  document.querySelector('.source-tag').title = 'Length entered in this visualizer';
  dirty = true;
});
document.addEventListener('keydown', event => {
  const tag = document.activeElement?.tagName;
  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(tag)) return;
  if (event.code === 'Space') { event.preventDefault(); playback.toggle(); }
  else if (event.code === 'ArrowRight') { event.preventDefault(); playback.step(1); }
  else if (event.code === 'ArrowLeft') { event.preventDefault(); playback.step(-1); }
  else if (event.code === 'Home') { event.preventDefault(); playback.restart(); }
});
new ResizeObserver(() => { for (const plot of plots.values()) plot.dirty = true; dirty = true; }).observe(document.querySelector('.workspace'));

function render(clock) {
  playback.tick(clock);
  if (dirty && dataset) {
    const time = playback.time, index = indexAtTime(dataset, time);
    mechanical.draw(dataset, time); telemetry.update(index); updateHeader();
    $('current-time').textContent = time.toFixed(3);
    $('timeline').value = Math.round((time - dataset.start) / (dataset.end - dataset.start || 1) * 100000);
    $('sample-readout').textContent = `SAMPLE ${(index + 1).toLocaleString()} / ${dataset.length.toLocaleString()}`;
    if (!playback.playing || clock - lastPlotTime >= 50) {
      const rolling = $('window-mode').value === 'rolling';
      const width = Number($('window-size').value);
      const start = rolling ? Math.max(dataset.start, Math.min(time - width / 2, dataset.end - width)) : dataset.start;
      const end = rolling ? Math.min(dataset.end, start + width) : dataset.end;
      for (const plot of plots.values()) { plot.setRange(start, end); plot.draw(time); }
      lastPlotTime = clock;
    } else for (const plot of plots.values()) { plot.time = time; plot.drawOverlay(); }
    dirty = false;
  } else if (!dataset && dirty) { mechanical.draw(null, 0); updateHeader(); dirty = false; }
  requestAnimationFrame(render);
}
updatePlots(); requestAnimationFrame(render);
