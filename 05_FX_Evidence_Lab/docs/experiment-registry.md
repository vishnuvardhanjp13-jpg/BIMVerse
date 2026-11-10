# Experiment registry

Rule: every strategy/parameter trial is recorded here, including failures. Do not edit past entries; add new ones.

| ID | Date | Strategy | Parameters | Data | Result | Status |
| --- | --- | --- | --- | --- | --- | --- |
| EXP-000 | 2026-11-10 | m15-breakout-retest-v0.1 | window 100, lookback 20, ATR 14 (simple mean), retest 0.15 ATR, trigger +0.1 ATR, stop 0.2 ATR, 2R target, min net R:R 1.5, expiry 2 bars. Design assumptions, not optimised. | None | **Not evaluated.** Unit tests on synthetic bars only. | Pre-registered baseline |

Frozen before evaluation: cost model (spread/slippage/commission editable, 1x/1.5x/2x stress), chronological dev/validation/holdout split (dates to be set before viewing results), forward review checkpoint 12 weeks AND 100 closed trades.
Stop/revise rules: edge vanishes out of sample, implementation defects change outcomes, results need untradeable fills, or costs remove expected gain. Preserve failed versions.
