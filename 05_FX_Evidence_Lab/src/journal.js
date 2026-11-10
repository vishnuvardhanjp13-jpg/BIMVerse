// Append-only JSONL research journal with correction events (never edits history).
// Prototype-grade: a local file is NOT an audited or immutable record.
import { appendFileSync, existsSync, readFileSync } from 'node:fs';

export function readJournal(path) {
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

export function append(path, event) {
  const seq = readJournal(path).length + 1;
  const rec = { seq, recordedAt: new Date().toISOString(), ...event };
  appendFileSync(path, JSON.stringify(rec) + '\n');
  return rec;
}

/** Latest view of each record after applying corrections. Source of outcome type is kept ('paper'|'hypothetical'). */
export function currentView(events) {
  const view = new Map();
  for (const e of events) {
    if (e.type === 'correction') view.set(e.corrects, { ...view.get(e.corrects), ...e.patch, corrected: true });
    else view.set(e.seq, e);
  }
  return [...view.values()];
}

export function metrics(events) {
  const closed = currentView(events).filter((e) => e.type === 'outcome' && Number.isFinite(e.netR));
  if (!closed.length) return { trades: 0, note: 'no closed outcomes; no performance claim possible' };
  const rs = closed.map((e) => e.netR);
  const sum = rs.reduce((a, b) => a + b, 0);
  const wins = rs.filter((r) => r > 0).reduce((a, b) => a + b, 0);
  const losses = -rs.filter((r) => r < 0).reduce((a, b) => a + b, 0);
  let peak = 0, eq = 0, maxDd = 0;
  for (const r of rs) { eq += r; peak = Math.max(peak, eq); maxDd = Math.max(maxDd, peak - eq); }
  return { trades: rs.length, expectancyR: sum / rs.length, profitFactor: losses ? wins / losses : null, maxDrawdownR: maxDd };
}
