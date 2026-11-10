// EMA: recursive smoothing seeded with the first available close.
export function ema(values, period) {
  const k = 2 / (period + 1);
  let e = values[0];
  for (let i = 1; i < values.length; i++) e = values[i] * k + e * (1 - k);
  return e;
}

export function trueRange(bar, prevClose) {
  return Math.max(bar.high - bar.low, Math.abs(bar.high - prevClose), Math.abs(bar.low - prevClose));
}

// ATR: simple mean of the last `period` true ranges (not Wilder smoothing).
export function atr(bars, period = 14) {
  if (bars.length < period + 1) return null;
  const w = bars.slice(-(period + 1));
  let sum = 0;
  for (let i = 1; i < w.length; i++) sum += trueRange(w[i], w[i - 1].close);
  return sum / period;
}
