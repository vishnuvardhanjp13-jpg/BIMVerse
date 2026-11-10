// Research risk controls. Configurable; not a guarantee against gap losses.
export const DEFAULT_RISK = { perPositionPct: 0.25, combinedOpenPct: 0.5 };

/**
 * Size a position from loss at the stop in account currency. Rounds DOWN to the
 * volume step; rejects below broker minimum or over budget.
 * quoteToAccount: current conversion of the quote currency into account currency (1 for USD/USD).
 */
export function sizePosition({ equity, entry, stop, spec, quoteToAccount = 1, openRiskPct = 0, risk = DEFAULT_RISK, costPerUnit = 0 }) {
  const reasons = [];
  const stopDist = Math.abs(entry - stop);
  if (!(equity > 0) || !(stopDist > 0)) return { ok: false, units: 0, reasons: ['invalid equity or stop distance'] };
  const budgetPct = Math.min(risk.perPositionPct, risk.combinedOpenPct - openRiskPct);
  if (budgetPct <= 0) return { ok: false, units: 0, reasons: ['combined open-risk budget exhausted'] };
  const budget = (equity * budgetPct) / 100;
  const lossPerUnit = (stopDist + costPerUnit) * quoteToAccount;
  const raw = budget / lossPerUnit;
  const units = Math.floor(raw / spec.unitStep) * spec.unitStep;
  if (units < spec.minUnits) reasons.push(`below broker minimum (${spec.minUnits} units)`);
  if (reasons.length) return { ok: false, units: 0, reasons };
  return { ok: true, units, riskAmount: units * lossPerUnit, riskPct: (units * lossPerUnit * 100) / equity, reasons };
}
