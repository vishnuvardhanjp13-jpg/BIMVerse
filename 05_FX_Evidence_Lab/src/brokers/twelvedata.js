// READ-ONLY Twelve Data adapter (M15 candles). No bid/ask on this feed: spread is an ASSUMED setting.
// Key is sent in an Authorization header (never in the URL) and read from the server environment only.
// Free plans have tight credit limits, so candles are cached until the next M15 bar can exist.
import { M15_MS } from '../data.js';

const symbol = (pair) => `${pair.slice(0, 3)}/${pair.slice(3)}`;

export function twelveDataFromEnv(env = process.env, fetchImpl = fetch, nowFn = () => Date.now()) {
  if (!env.TWELVE_DATA_API_KEY) return null;
  const assumedSpread = Number(env.ASSUMED_SPREAD) || 0.00012;
  const cache = new Map();
  return {
    name: 'twelvedata',
    hasQuote: false,
    assumedSpread,
    async candles(pair, count = 200) {
      const hit = cache.get(pair);
      if (hit && nowFn() < hit.validUntil) return hit.bars;
      const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol(pair))}&interval=15min&outputsize=${count}&timezone=UTC&order=ASC`;
      const res = await fetchImpl(url, { headers: { Authorization: `apikey ${env.TWELVE_DATA_API_KEY}` } });
      if (!res.ok) throw new Error(`Twelve Data HTTP ${res.status}`);
      const j = await res.json();
      if (j.status === 'error' || !Array.isArray(j.values)) throw new Error(`Twelve Data error: ${j.message || 'bad response'}`.slice(0, 120));
      const bars = j.values.map((v) => {
        const t = Date.parse(v.datetime.replace(' ', 'T') + 'Z'); // bar OPEN time, UTC
        return { openTime: t, closeTime: t + M15_MS, open: +v.open, high: +v.high, low: +v.low, close: +v.close };
      }).sort((a, b) => a.openTime - b.openTime);
      // Includes the forming bar; the strategy drops it via the completed-bar filter.
      const next = Math.floor(nowFn() / M15_MS) * M15_MS + M15_MS + 5000;
      cache.set(pair, { bars, validUntil: next });
      return bars;
    },
  };
}
