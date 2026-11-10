import test from 'node:test';
import assert from 'node:assert/strict';
import { oandaFromEnv, liveAnalysis, toOandaInstrument } from '../src/brokers/oanda.js';
import { evaluate } from '../src/strategy.js';

const env = { OANDA_TOKEN: 'secret-token', OANDA_ACCOUNT_ID: '001-001-1-001' };
const NOW = new Date('2026-11-06T12:07:00Z');
const mockFetch = (quote) => async (url, opts) => {
  assert.equal(opts.headers.Authorization, 'Bearer secret-token');
  assert.ok(!url.includes('secret-token'), 'token must never be in URL');
  if (url.includes('/candles')) {
    const candles = [];
    for (let i = 0; i < 3; i++) candles.push({ complete: true, time: `2026-11-06T11:${30 + i * 15 - (i > 1 ? 60 : 0)}:00.000000000Z`.replace('11:60', '12:00'), mid: { o: '1.1', h: '1.1002', l: '1.0998', c: '1.1001' } });
    candles.push({ complete: false, time: '2026-11-06T12:00:00.000000000Z', mid: { o: '1', h: '1', l: '1', c: '1' } });
    return { ok: true, json: async () => ({ candles }) };
  }
  return { ok: true, json: async () => ({ prices: [{ bids: [{ price: String(quote.bid) }], asks: [{ price: String(quote.ask) }], time: quote.time, tradeable: true }] }) };
};

test('not configured without env vars; practice by default; no order methods', () => {
  assert.equal(oandaFromEnv({}), null);
  const a = oandaFromEnv(env, mockFetch({}));
  assert.equal(a.name, 'oanda-practice');
  assert.deepEqual(Object.keys(a).sort(), ['candles', 'name', 'quote']);
  assert.equal(toOandaInstrument('EURUSD'), 'EUR_USD');
});

test('incomplete candles are dropped; short history blocks', async () => {
  const a = oandaFromEnv(env, mockFetch({ bid: 1.1, ask: 1.1001, time: '2026-11-06T12:06:59.000000000Z' }));
  const c = await a.candles('EURUSD');
  assert.equal(c.length, 3);
  const r = await liveAnalysis(a, 'EURUSD', evaluate, NOW);
  assert.equal(r.state, 'DATA_BLOCKED');
  assert.ok(Math.abs(r.quote.spread - 0.0001) < 1e-9);
});

test('stale or crossed live quote blocks before any strategy output', async () => {
  const stale = oandaFromEnv(env, mockFetch({ bid: 1.1, ask: 1.1001, time: '2026-11-06T11:50:00.000000000Z' }));
  assert.match((await liveAnalysis(stale, 'EURUSD', evaluate, NOW)).reasons[0], /stale quote/);
  const crossed = oandaFromEnv(env, mockFetch({ bid: 1.1002, ask: 1.1, time: '2026-11-06T12:06:59.000000000Z' }));
  assert.match((await liveAnalysis(crossed, 'EURUSD', evaluate, NOW)).reasons[0], /crossed/);
});
