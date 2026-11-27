# Pendulab visualizer

A static, browser-based playback and diagnostics workspace for recorded Pendulab simulation output. It does not simulate or correct motion.

## Launch

From the repository root, run `python3 -m http.server 8000`, then open `http://localhost:8000/tools/visualizer/`. No build step or packages are required. The **Load demo** button opens `examples/simulation.csv`, a copy of the repository's C-generated `results/simulation.csv` at implementation time. You can also select a local CSV or drop one anywhere on the page.

## Data format

The C program in `targets/sim/main.c` writes `t,x,theta,v,omega,F,E,px` with an initial row and one row per integration step. Required columns are `t,x,theta,v,omega`; optional columns are `F,E,px`. Columns can appear in any order. Timestamps must be finite and strictly increasing, with any positive spacing. Other columns are ignored, so future telemetry can coexist with the current adapter. Units are SI: seconds, meters, radians, meters per second, radians per second, newtons, joules, and kilogram meters per second.

The cart position is `x`. The pendulum angle `theta` is measured from vertical upright, with positive angle toward the right. The renderer uses `massX = x + l sin(theta)` and `massY = l cos(theta)` relative to the cart pivot. The project preset link length `l = 0.3 m` comes from `targets/sim/main.c`; change it in the mechanical view if a dataset was recorded with another length. The visualizer never infers physical parameters from motion.

The CSV records total mechanical energy `E` and horizontal momentum `px`; it does not record kinetic or potential energy separately. Those readouts remain unavailable. Diagnostic deviations are presentation calculations from the first recorded value. Relative deviation is unavailable for a zero baseline. In a forced or controlled run, energy or momentum change is not automatically numerical error.

## Controls

- Play/pause, restart, previous/next recorded sample, timeline seek, loop, and seven playback speeds from 0.1× to 10×.
- Space toggles play/pause, Left and Right step through recorded samples, and Home restarts. Keyboard shortcuts are disabled while an input or select has focus.
- Plot mode switches between full history and a rolling window; the window width can be set from 1 to 60 seconds. **Channels** toggles individual plots. Hover a trace to inspect the nearest recorded value; click it to seek.
- Mechanical options toggle the upright reference, recent mass trail, and coordinate axes. **Digits** sets telemetry precision.

The mechanical view interpolates only `x` and `theta` for smooth animation, with angle wrapping handled across ±π. Numeric telemetry and hover inspection use recorded samples. The playback clock advances according to the CSV timestamps, and frame stepping follows sample indices.

## Code map

- `js/data/csv-parser.js`: CSV validation and typed-array ingestion.
- `js/data/dataset.js`: derived display deviations, indexed lookup, and min/max blocks for plots.
- `js/playback/playback-engine.js`: reusable timestamp-based transport.
- `js/rendering/pendulum-renderer.js`: Canvas mechanical geometry, independent of the workspace.
- `js/rendering/plot-renderer.js`: Canvas time-series traces and synchronized cursors.
- `js/ui/telemetry.js`: recorded readouts and diagnostic comparisons.
- `js/main.js`: page wiring, loading, and rendering loop.

To add another pendulum configuration, define its recorded state and physical geometry parameters, then add a geometry renderer that consumes a prepared dataset and playback time. The playback engine and plots do not contain pendulum equations. A compact portfolio embed can reuse the playback engine and geometry renderer without the diagnostics UI.

## Limits

The implemented geometry and schema are for the existing single pendulum. No double or triple pendulum schema is assumed. Only the project's CSV form is supported; quoted CSV fields are not needed for its numeric output. Large files are parsed in batches to keep the page responsive, but browser memory must still accommodate the text and typed arrays. The supplied demonstration is a fixed copy of project output and does not automatically update when the C simulation is rerun.
