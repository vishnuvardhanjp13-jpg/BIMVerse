import test from 'node:test';
import assert from 'node:assert/strict';
import { twelveDataFromEnv } from '../src/brokers/twelvedata.js';
import { liveAnalysis } from '../src/brokers/oanda.js';
import { evaluate } from '../src/strategy.js';

test('no key -> not configured', () => assert.equal(twelveDataFromEnv({}), null));

test('key goes in header not URL; candles parsed as UTC open time; cached within the bar', async () => {
  let calls = 0;
  const f = async (url, opts) => {
    calls++;
    assert.ok(!url.includes('KEY123'));
    assert.equal(opts.headers.Authorization, 'apikey KEY123');
    return { ok: true, json: async () => ({ status: 'ok', values: [{ datetime: '2026-11-06 12:15:00', open: '1.1', high: '1.2', low: '1.0', close: '1.1' }, { datetime: '2026-11-06 12:00:00', open: '1.1', high: '1.2', low: '1.0', close: '1.1' }] }) };
  };
  const now = Date.parse('2026-11-06T12:20:00Z');
  const a = twelveDataFromEnv({ TWELVE_DATA_API_KEY: 'KEY123' }, f, () => now);
  const bars = await a.candles('EURUSD');
  assert.equal(new Date(bars[0].openTime).toISOString(), '2026-11-06T12:00:00.000Z');
  await a.candles('EURUSD');
  assert.equal(calls, 1);
});

test('API error becomes a thrown error without echoing the key; analysis flags assumed spread', async () => {
  const bad = twelveDataFromEnv({ TWELVE_DATA_API_KEY: 'KEY123' }, async () => ({ ok: true, json: async () => ({ status: 'error', message: 'rate limit' }) }));
  await assert.rejects(bad.candles('EURUSD'), (e) => !e.message.includes('KEY123') && /rate limit/.test(e.message));
  const ok = twelveDataFromEnv({ TWELVE_DATA_API_KEY: 'KEY123' }, async () => ({ ok: true, json: async () => ({ status: 'ok', values: [] }) }));
  const r = await liveAnalysis(ok, 'EURUSD', evaluate, new Date('2026-11-06T12:20:00Z'));
  assert.equal(r.state, 'DATA_BLOCKED');
  assert.ok(r.reasons.some((x) => /spread is assumed/.test(x)));
});
