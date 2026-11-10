// Provider-neutral market data contracts, strict M15 CSV import, validation.
export const M15_MS = 15 * 60 * 1000;

// Instrument specs must come from the broker/provider; these are placeholders
// for research only (EURUSD/AUDUSD). XAUUSD is intentionally absent: its contract
// size and pricing are broker-specific and must be fetched, never assumed.
export const INSTRUMENTS = {
  EURUSD: { quote: 'USD', pipSize: 0.0001, precision: 5, minUnits: 1000, unitStep: 1000, source: 'placeholder-research-default' },
  AUDUSD: { quote: 'USD', pipSize: 0.0001, precision: 5, minUnits: 1000, unitStep: 1000, source: 'placeholder-research-default' },
};

const TZ_RE = /(Z|[+-]\d{2}:?\d{2})$/;

/** Parse strict CSV: header time,open,high,low,close[,volume]. Times need an explicit timezone. */
export function parseCandlesCsv(text) {
  const errors = [];
  const lines = text.trim().split(/\r?\n/);
  const header = (lines.shift() || '').trim().toLowerCase().split(',');
  const need = ['time', 'open', 'high', 'low', 'close'];
  if (need.some((h, i) => header[i] !== h)) {
    return { candles: [], errors: ['header must start with time,open,high,low,close'] };
  }
  const seen = new Set();
  const candles = [];
  lines.forEach((line, i) => {
    const n = i + 2;
    const f = line.split(',').map((s) => s.trim());
    if (f.length < 5) return errors.push(`line ${n}: too few fields`);
    if (!TZ_RE.test(f[0])) return errors.push(`line ${n}: timestamp lacks explicit timezone`);
    const t = Date.parse(f[0]);
    if (Number.isNaN(t)) return errors.push(`line ${n}: bad timestamp`);
    if (t % M15_MS !== 0) return errors.push(`line ${n}: not on a 15-minute boundary`);
    const [o, h, l, c] = f.slice(1, 5).map(Number);
    if ([o, h, l, c].some((x) => !Number.isFinite(x) || x <= 0)) return errors.push(`line ${n}: non-numeric or non-positive price`);
    if (h < Math.max(o, c, l) || l > Math.min(o, c, h)) return errors.push(`line ${n}: inconsistent OHLC`);
    if (seen.has(t)) return errors.push(`line ${n}: duplicate timestamp`);
    seen.add(t);
    candles.push({ openTime: t, closeTime: t + M15_MS, open: o, high: h, low: l, close: c });
  });
  candles.sort((a, b) => a.openTime - b.openTime); // ordering is normalised, never trusted
  return { candles, errors };
}

/** Keep only bars fully closed at asOf. Future/incomplete bars never reach the strategy. */
export function completedBars(candles, asOf) {
  const t = asOf instanceof Date ? asOf.getTime() : asOf;
  const done = candles.filter((c) => c.closeTime <= t);
  return { bars: done, excluded: candles.length - done.length };
}

/** Return index of first gap in trailing `count` bars, or -1. Missing bars are never filled. */
export function findGap(bars, count) {
  const w = bars.slice(-count);
  for (let i = 1; i < w.length; i++) if (w[i].openTime - w[i - 1].openTime !== M15_MS) return i;
  return -1;
}

/** Validate a bid/ask quote. */
export function validateQuote(q, now, maxAgeMs = 60_000) {
  const issues = [];
  if (!(q.bid > 0 && q.ask > 0)) issues.push('non-positive price');
  if (q.bid >= q.ask) issues.push('crossed or locked quote');
  if (q.sourceTime > now.getTime() + 1000) issues.push('future timestamp');
  if (now.getTime() - q.sourceTime > maxAgeMs) issues.push('stale quote');
  if (q.tradable === false) issues.push('instrument not tradable');
  return issues;
}
