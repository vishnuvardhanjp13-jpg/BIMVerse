# Outstanding blockers and release gates

1. **Execution**: none connected, by design. Needs explicit authorization, validated edge, paper/forward results, legal review.
2. **Data source**: choose an eligible read-only adapter (user's MT5 terminal first, or OANDA v20 after confirming entity and rights). User must enter credentials via a secret mechanism, never in chat.
3. **Historical bid/ask data** consistent with the broker, for costed backtests.
4. **Instrument specs** (pip, contract size, min size, step) must be fetched from the broker; current values are placeholders. XAUUSD deferred.
5. **Calendar/news** licensed source and terms; until then event risk is reported as UNKNOWN.
6. **H4/H1 context** code (v0.1 is M15-only and must not be called the full strategy).
7. **Data rights** for multi-user display/derived signals in writing; **jurisdiction review** (UAE first; India, UK/EU, US, Australia separately).
8. **Backtest/walk-forward harness** with trial ledger and multiple-testing correction.
