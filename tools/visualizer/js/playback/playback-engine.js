export class PlaybackEngine {
  constructor(onChange) {
    this.onChange = onChange;
    this.dataset = null;
    this.time = 0;
    this.speed = 1;
    this.playing = false;
    this.loop = false;
    this.lastClock = 0;
  }
  load(dataset) {
    this.dataset = dataset;
    this.time = dataset.start;
    this.playing = false;
    this.lastClock = 0;
    this.onChange();
  }
  play() {
    if (!this.dataset) return;
    if (this.time >= this.dataset.end) this.time = this.dataset.start;
    this.playing = true;
    this.lastClock = 0;
    this.onChange();
  }
  pause() { this.playing = false; this.lastClock = 0; this.onChange(); }
  toggle() { this.playing ? this.pause() : this.play(); }
  restart() { if (!this.dataset) return; this.time = this.dataset.start; this.lastClock = 0; this.onChange(); }
  seek(time) {
    if (!this.dataset) return;
    this.time = Math.max(this.dataset.start, Math.min(this.dataset.end, time));
    this.lastClock = 0;
    this.onChange();
  }
  step(direction) {
    if (!this.dataset) return;
    this.pause();
    const t = this.dataset.columns.t;
    let lo = 0, hi = t.length;
    while (lo < hi) { const mid = (lo + hi) >>> 1; if (t[mid] < this.time) lo = mid + 1; else hi = mid; }
    const index = direction > 0 ? (t[lo] === this.time ? lo + 1 : lo) : lo - 1;
    this.seek(t[Math.max(0, Math.min(t.length - 1, index))]);
  }
  tick(clock) {
    if (!this.playing || !this.dataset) return;
    if (this.lastClock) {
      let next = this.time + (clock - this.lastClock) / 1000 * this.speed;
      if (next >= this.dataset.end) {
        if (this.loop && this.dataset.end > this.dataset.start) next = this.dataset.start + ((next - this.dataset.start) % (this.dataset.end - this.dataset.start));
        else { next = this.dataset.end; this.playing = false; }
      }
      this.time = next;
      this.onChange();
    }
    this.lastClock = clock;
  }
}
