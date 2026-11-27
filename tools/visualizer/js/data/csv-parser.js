const REQUIRED = ['t', 'x', 'theta', 'v', 'omega'];
const OPTIONAL = ['F', 'E', 'px'];

// CSV values are retained as Float64 numbers; presentation never mutates these arrays.
export async function parseCSV(text, filename = 'dataset.csv', onProgress = () => {}) {
  if (!text || !text.trim()) throw new Error('The CSV file is empty.');
  const firstEnd = text.indexOf('\n');
  const headerLine = (firstEnd < 0 ? text : text.slice(0, firstEnd)).replace(/^\uFEFF/, '').replace(/\r$/, '');
  const headers = headerLine.split(',').map(s => s.trim());
  const duplicate = headers.find((h, i) => headers.indexOf(h) !== i);
  if (duplicate) throw new Error(`Duplicate CSV column: ${duplicate}`);
  const missing = REQUIRED.filter(h => !headers.includes(h));
  if (missing.length) throw new Error(`Missing required column${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}. Expected t,x,theta,v,omega.`);
  const known = [...REQUIRED, ...OPTIONAL].filter(h => headers.includes(h));
  const positions = Object.fromEntries(known.map(h => [h, headers.indexOf(h)]));
  const values = Object.fromEntries(known.map(h => [h, []]));
  let cursor = firstEnd < 0 ? text.length : firstEnd + 1;
  let row = 1;
  let previousTime = -Infinity;
  while (cursor < text.length) {
    const batchEnd = Math.min(text.length, cursor + 2_000_000);
    while (cursor < batchEnd && cursor < text.length) {
      let end = text.indexOf('\n', cursor);
      if (end < 0) end = text.length;
      const line = text.slice(cursor, end).replace(/\r$/, '');
      cursor = end + 1;
      row++;
      if (!line.trim()) continue;
      const cells = line.split(',');
      if (cells.length !== headers.length) throw new Error(`Row ${row}: expected ${headers.length} columns, found ${cells.length}.`);
      for (const h of known) {
        const raw = cells[positions[h]].trim();
        if (!raw || !Number.isFinite(Number(raw))) throw new Error(`Row ${row}, ${h}: expected a finite number; found “${raw}”.`);
        values[h].push(Number(raw));
      }
      const t = values.t[values.t.length - 1];
      if (t <= previousTime) throw new Error(`Row ${row}: timestamps must increase strictly (t=${t}).`);
      previousTime = t;
    }
    onProgress(Math.min(1, cursor / text.length));
    if (cursor < text.length) await new Promise(resolve => setTimeout(resolve, 0));
  }
  if (!values.t.length) throw new Error('The CSV has a header but no samples.');
  const columns = Object.fromEntries(known.map(h => [h, Float64Array.from(values[h])]));
  return { filename, headers, columns, length: columns.t.length };
}
