import test from 'node:test';
import assert from 'node:assert/strict';
import { mt5ToCsv } from '../src/mt5.js';
import { parseCandlesCsv } from '../src/data.js';

test('MT5 export converts with explicit broker offset to UTC', () => {
  const mt5 = '<DATE>\t<TIME>\t<OPEN>\t<HIGH>\t<LOW>\t<CLOSE>\t<TICKVOL>\t<VOL>\t<SPREAD>\n2026.11.06\t12:15:00\t1.1\t1.101\t1.099\t1.1005\t10\t0\t12';
  const { candles, errors } = parseCandlesCsv(mt5ToCsv(mt5, 3));
  assert.deepEqual(errors, []);
  assert.equal(new Date(candles[0].openTime).toISOString(), '2026-11-06T09:15:00.000Z');
});
test('MT5 conversion refuses missing offset and non-MT5 files', () => {
  assert.throws(() => mt5ToCsv('a,b', NaN), /offset/);
  assert.throws(() => mt5ToCsv('a,b\n1,2', 3), /not an MT5/);
});
