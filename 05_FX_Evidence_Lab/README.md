# FX Evidence Lab (v0.2, private research prototype)

Research-only forex decision-support workbench for EURUSD and AUDUSD. **It does not place trades, has no broker
execution code, and makes no performance claim.** Live trading is deliberately out of scope until the release gates in
`docs/blockers.md` are met.

## What is implemented
| Capability | Status |
| --- | --- |
| Strict M15 CSV import (explicit timezone, 15-min boundary, OHLC consistency, duplicates, ordering) | Implemented, tested |
| Completed-bar filter, gap detection (no forward-fill), staleness block | Implemented, tested |
| Quote validation (crossed, stale, future, non-tradable) | Implemented, tested (no live feed connected) |
| Strategy `m15-breakout-retest-v0.1` (exact rule from the blueprint) | Implemented, tested on synthetic bars only |
| States DATA_BLOCKED / WAIT / CONDITIONAL / TRIGGERED / EXPIRED / INVALIDATED / CLOSED, conservative same-bar ordering | Implemented, tested |
| Position sizing (round down, broker minimum, 0.25% / 0.5% budgets) | Implemented, tested; instrument specs are placeholders |
| Append-only JSONL journal with correction events | Prototype only, not an audited record |

## Not implemented / not connected
Live prices, calendar/news, H1/H4 context, broker or MT5 adapters, backtesting, walk-forward and deflated-Sharpe analysis,
forward test, multi-user backend, UI, XAUUSD. No API is connected. No backtest has been run; **no edge is demonstrated.**

## Daily use (research desk)
```bash
npm start   # http://localhost:8787 (localhost only)
```
In MT5 export M15 bars (View > Symbols > Bars), load the file, enter your broker's server UTC offset and equity, press Scan. You get a state, plan card and position size. You place any order yourself. Journal is stored in the browser only.

## Live analysis (read-only)
Set credentials in your own terminal (never paste them in chat or commit them):
```bash
export OANDA_TOKEN=...        # practice-account API token
export OANDA_ACCOUNT_ID=...
export OANDA_ENV=practice     # default; 'live' only for a live account's read-only data
npm start
```
The page (TradingView-style layout, using TradingView Lightweight Charts, Apache-2.0, vendored in public/vendor) shows a live candlestick chart and EURUSD/AUDUSD status every 10 s from completed M15 bars and the live bid/ask spread.
Verified only against mocked responses; not yet tested against the real OANDA service. Availability depends on your OANDA entity.

### Twelve Data (free key) instead of OANDA
```bash
export TWELVE_DATA_API_KEY=...
export ASSUMED_SPREAD=0.00012   # optional, price units; set to your broker's typical spread
npm start
```
Candles only: there is no bid/ask, so the spread is assumed and labelled so. Candles are re-fetched once per new M15 bar to stay inside free-plan limits. Check Twelve Data's terms for your use. Mocked-response tests only; not yet run against the real service.

## CLI
```bash
npm test
node src/cli.js EURUSD candles.csv 2026-11-06T12:00:00Z 10000
```
CSV header: `time,open,high,low,close` with ISO timestamps carrying a timezone (bar open time).
Tests use synthetic bars, which demonstrate software behaviour only.

Docs: `docs/evidence-register.md`, `docs/experiment-registry.md`, `docs/blockers.md`.
