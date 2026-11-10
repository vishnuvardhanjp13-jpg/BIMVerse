#!/usr/bin/env node
// Usage: node src/cli.js <EURUSD|AUDUSD> <candles.csv> [asOfISO] [equity]
import { readFileSync } from 'node:fs';
import { parseCandlesCsv, INSTRUMENTS } from './data.js';
import { evaluate } from './strategy.js';
import { sizePosition } from './risk.js';

const [instrument, file, asOfArg, equityArg] = process.argv.slice(2);
if (!INSTRUMENTS[instrument] || !file) {
  console.error('usage: node src/cli.js <EURUSD|AUDUSD> <candles.csv> [asOfISO] [equity]');
  process.exit(2);
}
const { candles, errors } = parseCandlesCsv(readFileSync(file, 'utf8'));
if (errors.length) console.error(`import rejected ${errors.length} line(s):\n  ` + errors.slice(0, 10).join('\n  '));
const result = evaluate(candles, asOfArg ? new Date(asOfArg) : new Date(), { instrument });
if (result.state === 'CONDITIONAL') {
  result.sizing = sizePosition({ equity: Number(equityArg) || 10000, entry: result.entry, stop: result.stop, spec: INSTRUMENTS[instrument] });
}
console.log(JSON.stringify(result, null, 2));
console.error('RESEARCH ONLY: no execution, no performance claim. State is not trade advice.');
