// Bearbeitungsstelle 1: Die Beschriftungen sind selbst gewählte Zuschreibungen.
export const labels = {
  A: { fast: 'entschlossen', slow: 'zögerlich' },
  B: { fast: 'unsicher', slow: 'besonnen' }
};

export function interpret(speed, threshold) {
  if (!Number.isFinite(speed)) return { A: '—', B: '—', fast: null };
  const fast = speed >= threshold;
  return { A: labels.A[fast ? 'fast' : 'slow'], B: labels.B[fast ? 'fast' : 'slow'], fast };
}

export function handGeometry(points, aspect) {
  if (!points || points.length < 21) return null;
  const ids = [0, 5, 9, 13, 17];
  if (![...ids].every(i => Number.isFinite(points[i]?.x) && Number.isFinite(points[i]?.y))) return null;
  const x = ids.reduce((s, i) => s + points[i].x, 0) / ids.length;
  const y = ids.reduce((s, i) => s + points[i].y, 0) / ids.length;
  const width = Math.hypot((points[5].x - points[17].x) * aspect, points[5].y - points[17].y);
  return width >= 0.035 ? { x: x * aspect, y, width } : null;
}

export class MotionMeter {
  constructor() { this.reset(); }
  reset() { this.previous = null; this.value = null; }
  update(points, time, aspect, tau) {
    const hand = handGeometry(points, aspect);
    if (!hand) { this.reset(); return null; }
    const last = this.previous;
    this.previous = { ...hand, time };
    if (!last) { this.value = null; return null; }
    const dt = (time - last.time) / 1000;
    const distance = Math.hypot(hand.x - last.x, hand.y - last.y);
    if (dt <= 0 || dt > 0.25 || distance > hand.width * 6) { this.value = null; return null; }
    const raw = distance / dt / hand.width;
    // Bearbeitungsstelle 2: Zeitabhängige Glättung; tau = 0 schaltet sie aus.
    const alpha = tau === 0 ? 1 : 1 - Math.exp(-dt / tau);
    this.value = this.value === null ? raw : this.value + alpha * (raw - this.value);
    return this.value;
  }
}
