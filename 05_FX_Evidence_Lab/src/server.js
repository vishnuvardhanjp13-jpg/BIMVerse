// Local static server for the research desk. Binds to localhost only. No orders, no secrets, no external calls.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { oandaFromEnv, liveAnalysis } from './brokers/oanda.js';
import { evaluate } from './strategy.js';
import { INSTRUMENTS } from './data.js';

const root = join(fileURLToPath(import.meta.url), '..', '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const port = Number(process.env.PORT) || 8787;

const adapter = oandaFromEnv();
const cache = new Map();

createServer(async (req, res) => {
  const url0 = new URL(req.url, 'http://x');
  if (url0.pathname === '/api/analysis') {
    res.setHeader('content-type', 'application/json');
    const pair = url0.searchParams.get('pair');
    if (!INSTRUMENTS[pair]) { res.writeHead(400); return res.end('{"error":"unsupported pair"}'); }
    if (!adapter) { res.writeHead(200); return res.end(JSON.stringify({ state: 'DATA_BLOCKED', instrument: pair, reasons: ['live feed not configured: set OANDA_TOKEN and OANDA_ACCOUNT_ID on the server'] })); }
    const hit = cache.get(pair);
    if (hit && Date.now() - hit.at < 5000) { res.writeHead(200); return res.end(hit.body); }
    let body;
    try { body = JSON.stringify(await liveAnalysis(adapter, pair, evaluate)); }
    catch (e) { body = JSON.stringify({ state: 'DATA_BLOCKED', instrument: pair, reasons: ['feed error: ' + e.message] }); }
    cache.set(pair, { at: Date.now(), body });
    res.writeHead(200); return res.end(body);
  }
  let p =normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (p === '/' || p === '\\') p = '/public/index.html';
  if (!/^[\\/](public|src)[\\/]/.test(p) || p.includes('..')) { res.writeHead(404); return res.end('not found'); }
  try {
    const body = await readFile(join(root, p));
    res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(body);
  } catch { res.writeHead(404); res.end('not found'); }
}).listen(port, '127.0.0.1', () => console.log(`FX Evidence Lab (research only) -> http://localhost:${port}`));
