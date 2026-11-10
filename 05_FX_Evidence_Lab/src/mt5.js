// Convert an MT5 "Export bars" file (tab or comma separated) to the strict CSV the lab imports.
// MT5 times are BROKER SERVER time, so the caller must state the server's UTC offset explicitly.
export function mt5ToCsv(text, utcOffsetHours) {
  if (!Number.isFinite(utcOffsetHours) || Math.abs(utcOffsetHours) > 14) throw new Error('broker UTC offset required (e.g. 2 or 3)');
  const lines = text.trim().split(/\r?\n/);
  const head = lines.shift().split(/[\t,;]/).map((s) => s.replace(/[<>]/g, '').trim().toLowerCase());
  const idx = (n) => head.indexOf(n);
  const [d, t, o, h, l, c] = ['date', 'time', 'open', 'high', 'low', 'close'].map(idx);
  if ([d, t, o, h, l, c].some((i) => i < 0)) throw new Error('not an MT5 bar export: need DATE, TIME, OPEN, HIGH, LOW, CLOSE columns');
  const sign = utcOffsetHours < 0 ? '-' : '+';
  const abs = Math.abs(utcOffsetHours);
  const off = `${sign}${String(Math.floor(abs)).padStart(2, '0')}:${String(Math.round((abs % 1) * 60)).padStart(2, '0')}`;
  const out = ['time,open,high,low,close'];
  for (const line of lines) {
    const f = line.split(/[\t,;]/).map((s) => s.trim());
    if (f.length < 6) continue;
    out.push(`${f[d].replace(/\./g, '-')}T${f[t].length === 5 ? f[t] + ':00' : f[t]}${off},${f[o]},${f[h]},${f[l]},${f[c]}`);
  }
  return out.join('\n');
}
