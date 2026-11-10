// READ-ONLY OANDA v20 adapter: candles + bid/ask pricing. No order endpoints exist in this file.
// Credentials come from environment variables on the server only. Never log or expose the token.
import { M15_MS, validateQuote } from '../data.js';

const HOSTS = { practice: 'https://api-fxpractice.oanda.com', live: 'https://api-fxtrade.oanda.com' };
export const toOandaInstrument = (pair) => `${pair.slice(0, 3)}_${pair.slice(3)}`;
const ms = (t) => Math.floor(Date.parse(t.replace(/(\.\d{3})\d+Z$/, '$1Z')) / M15_MS) * M15_MS;

export function oandaFromEnv(env = process.env, fetchImpl = fetch) {
  if (!env.OANDA_TOKEN || !env.OANDA_ACCOUNT_ID) return null;
  const host = HOSTS[env.OANDA_ENV || 'practice'];
  if (!host) throw new Error('OANDA_ENV must be practice or live');
  const get = async (path) => {
    const res = await fetchImpl(host + path, { headers: { Authorization: `Bearer ${env.OANDA_TOKEN}` } });
    if (!res.ok) throw new Error(`OANDA HTTP ${res.status}`); // body not echoed
    return res.json();
  };
  return {
    name: `oanda-${env.OANDA_ENV || 'practice'}`,
    /** Completed M15 mid candles only. */
    async candles(pair, count = 200) {
      const j = await get(`/v3/instruments/${toOandaInstrument(pair)}/candles?granularity=M15&count=${count}&price=M`);
      return j.candles.filter((c) => c.complete).map((c) => ({
        openTime: ms(c.time), closeTime: ms(c.time) + M15_MS,
        open: +c.mid.o, high: +c.mid.h, low: +c.mid.l, close: +c.mid.c,
      }));
    },
    async quote(pair) {
      const j = await get(`/v3/accounts/${env.OANDA_ACCOUNT_ID}/pricing?instruments=${toOandaInstrument(pair)}`);
      const p = j.prices[0];
      return { bid: +p.bids[0].price, ask: +p.asks[0].price, sourceTime: Date.parse(p.time.replace(/(\.\d{3})\d+Z$/, '$1Z')), tradable: p.tradeable };
    },
  };
}

/** Live analysis: evaluates the frozen rule with the LIVE spread as cost and validates the quote. */
export async function liveAnalysis(adapter, pair, evaluate, now = new Date()) {
  const [candles, q] = await Promise.all([adapter.candles(pair), adapter.quote(pair)]);
  const issues = validateQuote(q, now);
  const spread = q.ask - q.bid;
  const base = { feed: adapter.name, quote: { ...q, spread, ageMs: now.getTime() - q.sourceTime }, quoteIssues: issues };
  if (issues.length) return { ...base, instrument: pair, state: 'DATA_BLOCKED', reasons: ['quote check failed: ' + issues.join(', ')] };
  const r = evaluate(candles, now, { instrument: pair, feed: adapter.name, costs: { spread, slippage: 0.00005, commission: 0 } });
  return { ...base, ...r };
}
