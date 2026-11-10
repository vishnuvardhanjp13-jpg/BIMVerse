import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseCandlesCsv, completedBars, validateQuote, M15_MS, INSTRUMENTS } from '../src/data.js';
import { evaluate, advance } from '../src/strategy.js';
import { sizePosition } from '../src/risk.js';
import { append, readJournal, metrics } from '../src/journal.js';

const T0 = Date.parse('2026-11-02T00:00:00Z');

// Synthetic long setup (breakout at bar 98, retest at bar 99). Not market data.
function setup(side = 'long') {
  const bars = [];
  const sgn = side === 'long' ? 1 : -1;
  for (let i = 0; i < 100; i++) {
    const p = 1.1 + sgn * 0.00005 * i;
    bars.push({ o: p, h: p + 0.0003, l: p - 0.0003, c: p + sgn * 0.00005 });
  }
  const prior = bars.slice(78, 98);
  if (side === 'long') {
    const hh = Math.max(...prior.map((b) => b.h));
    bars[98] = { o: hh, h: hh + 0.0012, l: hh - 0.0001, c: hh + 0.001 };
    bars[99] = { o: hh + 0.001, h: hh + 0.0008, l: hh, c: hh + 0.0004 };
    bars[99].h = hh + 0.0011;
  } else {
    const ll = Math.min(...prior.map((b) => b.l));
    bars[98] = { o: ll, h: ll + 0.0001, l: ll - 0.0012, c: ll - 0.001 };
    bars[99] = { o: ll - 0.001, h: ll, l: ll - 0.0011, c: ll - 0.0004 };
  }
  return bars.map((b, i) => ({
    openTime: T0 + i * M15_MS, closeTime: T0 + (i + 1) * M15_MS,
    open: b.o, high: Math.max(b.h, b.o, b.c), low: Math.min(b.l, b.o, b.c), close: b.c,
  }));
}
const AS_OF = new Date(T0 + 100 * M15_MS + 60_000);

test('CSV import rejects malformed, timezone-less, duplicate and inconsistent rows', () => {
  const csv = [
    'time,open,high,low,close',
    '2026-11-02T00:00:00Z,1.1,1.2,1.0,1.1',
    '2026-11-02T00:00:00Z,1.1,1.2,1.0,1.1',     // duplicate
    '2026-11-02T00:15:00,1.1,1.2,1.0,1.1',       // no timezone
    '2026-11-02T00:30:00Z,1.1,1.0,1.2,1.1',      // high < low
    '2026-11-02T00:40:00Z,1.1,1.2,1.0,1.1',      // off boundary
    '2026-11-02T00:45:00Z,abc,1.2,1.0,1.1',      // non numeric
  ].join('\n');
  const r = parseCandlesCsv(csv);
  assert.equal(r.candles.length, 1);
  assert.equal(r.errors.length, 5);
});

test('CSV with offset timezone and out-of-order rows is normalised to UTC ascending', () => {
  const r = parseCandlesCsv('time,open,high,low,close\n2026-11-02T04:15:00+04:00,1,1.1,0.9,1\n2026-11-02T04:00:00+04:00,1,1.1,0.9,1');
  assert.deepEqual(r.errors, []);
  assert.equal(new Date(r.candles[0].openTime).toISOString(), '2026-11-02T00:00:00.000Z');
  assert.ok(r.candles[0].openTime < r.candles[1].openTime);
});

test('future / still-forming bars are excluded', () => {
  const bars = setup();
  const { bars: done, excluded } = completedBars(bars, T0 + 99 * M15_MS + 5 * 60_000);
  assert.equal(done.length, 99);
  assert.equal(excluded, 1);
});

test('gap in trailing window blocks output', () => {
  const bars = setup();
  bars.unshift({ openTime: T0 - M15_MS, closeTime: T0, open: 1.1, high: 1.1003, low: 1.0997, close: 1.1 });
  bars.splice(50, 1); // 100 bars remain, with a hole
  const r = evaluate(bars, AS_OF, { instrument: 'EURUSD' });
  assert.equal(r.state, 'DATA_BLOCKED');
  assert.match(r.reasons[0], /gap/);
});

test('insufficient history and stale data both block', () => {
  assert.equal(evaluate(setup().slice(0, 60), AS_OF, { instrument: 'EURUSD' }).state, 'DATA_BLOCKED');
  const stale = new Date(AS_OF.getTime() + 3 * 3600_000);
  assert.match(evaluate(setup(), stale, { instrument: 'EURUSD' }).reasons[0], /stale/);
});

test('long breakout/retest yields a CONDITIONAL research candidate with required fields', () => {
  const r = evaluate(setup('long'), AS_OF, { instrument: 'EURUSD' });
  assert.equal(r.state, 'CONDITIONAL');
  assert.equal(r.side, 'long');
  assert.ok(r.stop < r.entry && r.target > r.entry);
  assert.ok(r.netRR >= 1.5);
  for (const k of ['strategy', 'dataCutoff', 'expiresAt', 'opposingEvidence', 'eventRestrictions', 'targetLogic']) assert.ok(r[k], k);
  assert.equal(r.researchOnly, true);
});

test('short setup is symmetric', () => {
  const r = evaluate(setup('short'), AS_OF, { instrument: 'AUDUSD' });
  assert.equal(r.state, 'CONDITIONAL');
  assert.equal(r.side, 'short');
  assert.ok(r.stop > r.entry && r.target < r.entry);
});

test('excessive costs reject an otherwise valid candidate (no-trade is a normal result)', () => {
  const r = evaluate(setup('long'), AS_OF, { instrument: 'EURUSD', costs: { spread: 0.0008, slippage: 0.0004, commission: 0 } });
  assert.equal(r.state, 'WAIT');
  assert.match(r.reasons[0], /net reward\/risk/);
});

test('future bars never change the decision', () => {
  const bars = setup();
  const extra = { openTime: T0 + 100 * M15_MS, closeTime: T0 + 101 * M15_MS, open: 2, high: 3, low: 1, close: 2 };
  const a = evaluate(bars, AS_OF, { instrument: 'EURUSD' });
  const b = evaluate([...bars, extra], AS_OF, { instrument: 'EURUSD' });
  assert.equal(b.entry, a.entry);
  assert.equal(b.excludedIncompleteBars, undefined); // candidate path; exclusion verified in completedBars test
});

test('lifecycle: stop crossed before entry invalidates; same-bar ambiguity resolves to stop', () => {
  const c = evaluate(setup('long'), AS_OF, { instrument: 'EURUSD' });
  const mk = (i, o, h, l, cl) => ({ openTime: AS_OF.getTime() + i * M15_MS, closeTime: AS_OF.getTime() + (i + 1) * M15_MS, open: o, high: h, low: l, close: cl });
  assert.equal(advance(c, [mk(0, c.entry, c.entry - 0.0001, c.stop - 0.0001, c.stop)]).state, 'INVALIDATED');
  const both = advance(c, [mk(0, c.entry - 0.0001, c.target + 0.001, c.stop + 0.00001, c.entry), mk(1, 1, 1, 1, 1)]);
  assert.equal(both.state, 'CLOSED');
  assert.equal(advance(c, [mk(0, c.entry - 0.0002, c.entry + 0.0001, c.entry - 0.0002, c.entry)]).state, 'TRIGGERED');
  const late = [mk(5, c.entry - 0.0002, c.entry - 0.0001, c.entry - 0.0003, c.entry - 0.0002)];
  assert.equal(advance(c, late).state, 'EXPIRED');
});

test('position sizing rounds down, respects minimums and combined-risk budget', () => {
  const spec = INSTRUMENTS.EURUSD;
  const ok = sizePosition({ equity: 10000, entry: 1.1, stop: 1.0987, spec });
  assert.ok(ok.ok);
  assert.equal(ok.units % spec.unitStep, 0);
  assert.ok(ok.riskPct <= 0.25 + 1e-9);
  assert.equal(sizePosition({ equity: 100, entry: 1.1, stop: 1.0, spec }).ok, false);
  assert.equal(sizePosition({ equity: 10000, entry: 1.1, stop: 1.0987, spec, openRiskPct: 0.5 }).ok, false);
});

test('quote validation catches crossed, stale and future quotes', () => {
  const now = new Date('2026-11-02T10:00:00Z');
  const t = now.getTime();
  assert.deepEqual(validateQuote({ bid: 1.1, ask: 1.1001, sourceTime: t - 1000 }, now), []);
  assert.ok(validateQuote({ bid: 1.1002, ask: 1.1, sourceTime: t }, now).includes('crossed or locked quote'));
  assert.ok(validateQuote({ bid: 1.1, ask: 1.1001, sourceTime: t - 120000 }, now).includes('stale quote'));
  assert.ok(validateQuote({ bid: 1.1, ask: 1.1001, sourceTime: t + 60000 }, now).includes('future timestamp'));
});

test('journal is append-only, applies corrections, and has no metrics when empty', () => {
  const p = join(mkdtempSync(join(tmpdir(), 'fxlab-')), 'j.jsonl');
  assert.equal(metrics([]).trades, 0);
  const a = append(p, { type: 'outcome', kind: 'paper', netR: 2 });
  append(p, { type: 'outcome', kind: 'paper', netR: -1 });
  append(p, { type: 'correction', corrects: a.seq, patch: { netR: 1 } });
  const ev = readJournal(p);
  assert.equal(ev.length, 3);
  assert.equal(ev[0].netR, 2); // history untouched
  const m = metrics(ev);
  assert.equal(m.trades, 2);
  assert.equal(m.expectancyR, 0); // (1 + -1)/2 after correction
});
