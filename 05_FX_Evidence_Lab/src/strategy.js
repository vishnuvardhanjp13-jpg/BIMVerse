// Strategy m15-breakout-retest v0.1 (research baseline, parameters are design assumptions, not optimised).
import { M15_MS, completedBars, findGap } from './data.js';
import { ema, atr } from './indicators.js';

export const STATES = ['DATA_BLOCKED', 'WAIT', 'CONDITIONAL', 'TRIGGERED', 'EXPIRED', 'INVALIDATED', 'CLOSED'];
export const VERSION = 'm15-breakout-retest-v0.1';
export const PARAMS = {
  window: 100, lookback: 20, atrPeriod: 14, retestAtr: 0.15, triggerAtr: 0.1,
  stopAtr: 0.2, targetR: 2, minNetRR: 1.5, expiryBars: 2, maxDataAgeMs: 45 * 60 * 1000,
};
// Costs in PRICE units. Editable assumptions; spread should come from bid/ask data.
export const DEFAULT_COSTS = { spread: 0.00012, slippage: 0.00005, commission: 0 };

export function evaluate(candles, asOf, { instrument, costs = DEFAULT_COSTS, params = PARAMS, feed = 'csv' } = {}) {
  const asOfMs = asOf instanceof Date ? asOf.getTime() : asOf;
  const base = { strategy: VERSION, instrument, feed, analysisTime: new Date(asOfMs).toISOString() };
  const { bars, excluded } = completedBars(candles, asOfMs);
  const block = (reason) => ({ ...base, state: 'DATA_BLOCKED', reasons: [reason], excludedIncompleteBars: excluded });
  if (bars.length < params.window) return block(`need ${params.window} completed bars, have ${bars.length}`);
  const last = bars[bars.length - 1];
  if (asOfMs - last.closeTime > params.maxDataAgeMs) return block('stale data (market closed or feed delayed)');
  if (findGap(bars, params.window) !== -1) return block('gap in trailing window (session gaps not yet classified)');

  const w = bars.slice(-params.window);
  const dataCutoff = new Date(last.closeTime).toISOString();
  const retest = w[w.length - 1], brk = w[w.length - 2];
  const prior = w.slice(-2 - params.lookback, -2);
  const hh = Math.max(...prior.map((b) => b.high));
  const ll = Math.min(...prior.map((b) => b.low));
  const a = atr(w, params.atrPeriod);
  const closes = w.map((b) => b.close);
  const e20 = ema(closes, 20), e50 = ema(closes, 50);
  const ctx = { ...base, dataCutoff, indicators: { atr: a, ema20: e20, ema50: e50, priorHigh: hh, priorLow: ll } };

  let side = null;
  if (brk.close > hh && retest.low <= hh + params.retestAtr * a && retest.close > hh && e20 > e50) side = 'long';
  else if (brk.close < ll && retest.high >= ll - params.retestAtr * a && retest.close < ll && e20 < e50) side = 'short';
  if (!side) return { ...ctx, state: 'WAIT', reasons: ['no breakout/retest setup on latest completed bars'] };

  const long = side === 'long';
  const entry = long ? retest.high + params.triggerAtr * a : retest.low - params.triggerAtr * a;
  const stop = long
    ? Math.min(brk.low, retest.low) - params.stopAtr * a
    : Math.max(brk.high, retest.high) + params.stopAtr * a;
  const risk = Math.abs(entry - stop);
  const target = long ? entry + params.targetR * risk : entry - params.targetR * risk;
  const cost = costs.spread + costs.slippage + costs.commission;
  const netRR = (params.targetR * risk - cost) / (risk + cost);
  const candidate = {
    ...ctx, side, orderType: 'stop-entry', entry, stop, target,
    targetLogic: `fixed ${params.targetR}R (hypothetical, not structural S/R)`,
    expiresAt: new Date(last.closeTime + params.expiryBars * M15_MS).toISOString(),
    cancelIf: 'stop level crossed before entry', netRR, costs,
    reasons: [`${long ? 'upside' : 'downside'} breakout close beyond 20-bar ${long ? 'high' : 'low'}, retest held, EMA20 ${long ? '>' : '<'} EMA50`],
    opposingEvidence: ['no higher-timeframe or event context yet', 'single-rule baseline with unverified edge'],
    eventRestrictions: 'calendar not connected: event risk UNKNOWN',
    researchOnly: true,
  };
  if (netRR < params.minNetRR) return { ...candidate, state: 'WAIT', reasons: [`rejected: net reward/risk ${netRR.toFixed(2)} < ${params.minNetRR} after costs`] };
  return { ...candidate, state: 'CONDITIONAL' };
}

/**
 * Advance a CONDITIONAL candidate over bars that closed after it was created.
 * Conservative: if a single bar touches both stop and target, the stop is assumed first.
 */
export function advance(candidate, laterBars) {
  const long = candidate.side === 'long';
  const expiry = Date.parse(candidate.expiresAt);
  let triggered = false;
  for (const b of laterBars) {
    if (!triggered) {
      const stopCrossed = long ? b.low <= candidate.stop : b.high >= candidate.stop;
      const entryHit = long ? b.high >= candidate.entry : b.low <= candidate.entry;
      if (stopCrossed) return { state: 'INVALIDATED', at: b.closeTime, reason: 'stop crossed before entry' };
      if (entryHit) {
        triggered = true;
        // same-bar stop after entry is ambiguous -> assume stop first (conservative)
        const stopSame = long ? b.low <= candidate.stop : b.high >= candidate.stop;
        if (stopSame) return { state: 'CLOSED', at: b.closeTime, netR: -1, exit: 'stop (same-bar, conservative)' };
        continue;
      }
      if (b.closeTime > expiry) return { state: 'EXPIRED', at: b.closeTime };
    } else {
      const stopHit = long ? b.low <= candidate.stop : b.high >= candidate.stop;
      const tgtHit = long ? b.high >= candidate.target : b.low <= candidate.target;
      if (stopHit) return { state: 'CLOSED', at: b.closeTime, netR: -1, exit: 'stop' };
      if (tgtHit) return { state: 'CLOSED', at: b.closeTime, netR: candidate.netRR, exit: 'target' };
    }
  }
  return { state: triggered ? 'TRIGGERED' : 'CONDITIONAL' };
}
