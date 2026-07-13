// Scoring constants — the exact values recovered from the live AGTT Google Sheet formulas
// (2026-07-13). Kept as named, editable constants so the weights and thresholds can be tuned
// later without touching the calculation logic. See docs/model-breakdown.md.

export const PRIORITY_WEIGHTS = {
  fitScore: 2.0,
  strategicValue: 1.2,
  relationshipStrength: 1.2,
  moneyScore: 1.5,
  urgencyScore: 1.0,
  easeScore: 1.0,
  reportingBurden: -0.8,
  competitionLevel: -0.6,
} as const;

export const BAND_THRESHOLDS = {
  high: 32, // priorityScore >= 32 -> High
  medium: 22, // priorityScore >= 22 -> Medium, else Low
} as const;

// Effort/ease scaling: hours are clamped to this ceiling before scoring.
export const MAX_EFFORT_HOURS = 80;

// Money score log scaling. Original sheet used /1 (saturated at ~$2,154). Rescaled to /1000 so
// the real $5K-$10M dataset spreads across 0-10 (saturation now ~$2.15M). See decisions-log.md 6.3.
export const MONEY_SCALE_DIVISOR = 1000;
export const MONEY_LOG_MULTIPLIER = 3;

export const SCORE_MIN = 0;
export const SCORE_MAX = 10;

