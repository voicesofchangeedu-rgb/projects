// AGTT scoring engine — the single source of truth. Pure, framework-free.
// Never store any of these outputs in the database: recompute live from raw inputs + today.
// See docs/model-breakdown.md for a plain-language walkthrough of every line.

import {
  PRIORITY_WEIGHTS,
  BAND_THRESHOLDS,
  MAX_EFFORT_HOURS,
  MONEY_SCALE_DIVISOR,
  MONEY_LOG_MULTIPLIER,
  SCORE_MIN,
  SCORE_MAX,
} from "./constants";
import { coerceDate, daysBetween } from "./dates";

export type PriorityBand = "High" | "Medium" | "Low";

export interface OpportunityScoreInputs {
  fitScore: number; // 1-10
  strategicValue: number; // 1-10
  relationshipStrength: number; // 0-5
  reportingBurden: number; // 1-5
  competitionLevel: number; // 1-5
  timeCommitmentHours: number; // hours to prepare/apply
  expectedAmountUsd: number; // ALREADY currency-normalized to USD
  probability: number; // 0-1
  fullDeadline: Date | null; // null if no fixed/parseable deadline (rolling, invite-only, etc.)
}

export interface OpportunityScoreOutputs {
  expectedValueUsd: number;
  daysToDeadline: number | null;
  urgencyScore: number; // 0-10, higher = closer deadline
  easeScore: number; // 0-10, higher = LESS effort (renamed from sheet's "Effort_Score")
  moneyScore: number; // 0-10, log-scaled on amount
  priorityScore: number;
  priorityBand: PriorityBand;
}

const clamp = (min: number, max: number, v: number) => Math.max(min, Math.min(max, v));
const round2 = (v: number) => Math.round(v * 100) / 100;

export function computeOpportunityScore(
  input: OpportunityScoreInputs,
  today: Date,
): OpportunityScoreOutputs {
  const expectedValueUsd = input.expectedAmountUsd * input.probability;

  const daysToDeadline = input.fullDeadline ? daysBetween(input.fullDeadline, today) : null;

  // FIX vs original sheet (decisions-log 6.4): no fixed deadline -> 0 urgency, not accidentally 10.
  const urgencyScore =
    daysToDeadline == null
      ? 0
      : clamp(SCORE_MIN, SCORE_MAX, round2(10 * (1 / (1 + Math.max(0, daysToDeadline)))));

  // Higher = less work. (Sheet named this "Effort_Score" but the sign is inverted; decisions-log 6.1.)
  const easeScore = clamp(
    SCORE_MIN,
    SCORE_MAX,
    round2(10 * (1 - Math.min(input.timeCommitmentHours, MAX_EFFORT_HOURS) / MAX_EFFORT_HOURS)),
  );

  // FIX vs original sheet (decisions-log 6.3): rescaled by /1000 so real $5K-$10M spreads across 0-10.
  const moneyScore = clamp(
    SCORE_MIN,
    SCORE_MAX,
    round2(
      Math.log10(Math.max(0, input.expectedAmountUsd) / MONEY_SCALE_DIVISOR + 1) *
        MONEY_LOG_MULTIPLIER,
    ),
  );

  const w = PRIORITY_WEIGHTS;
  const priorityScore = round2(
    w.fitScore * input.fitScore +
      w.strategicValue * input.strategicValue +
      w.relationshipStrength * input.relationshipStrength +
      w.moneyScore * moneyScore +
      w.urgencyScore * urgencyScore +
      w.easeScore * easeScore +
      w.reportingBurden * input.reportingBurden +
      w.competitionLevel * input.competitionLevel,
  );

  const priorityBand: PriorityBand =
    priorityScore >= BAND_THRESHOLDS.high
      ? "High"
      : priorityScore >= BAND_THRESHOLDS.medium
        ? "Medium"
        : "Low";

  return {
    expectedValueUsd,
    daysToDeadline,
    urgencyScore,
    easeScore,
    moneyScore,
    priorityScore,
    priorityBand,
  };
}

// Reproduces the ORIGINAL sheet formulas verbatim, bugs included. Used only by parity tests to
// prove we understand the source, and to show the before/after delta of the 6.3/6.4 fixes.
// Takes the RAW deadline text (not a parsed Date) so it can reproduce the sheet's distinction
// between a truly blank cell (urgency 0, "" coerced to 0 in the sum) and non-empty unparseable
// text like "N/A (rolling)" (urgency 10, MAX(0, text) collapsed to 0 -> "due today").
export interface LegacyScoreInputs extends Omit<OpportunityScoreInputs, "fullDeadline"> {
  rawFullDeadline: unknown; // the original cell value/text, blank or otherwise
}

export function computeLegacyScore(input: LegacyScoreInputs, today: Date): OpportunityScoreOutputs {
  const expectedValueUsd = input.expectedAmountUsd * input.probability;
  const parsed = coerceDate(input.rawFullDeadline);
  const daysToDeadline = parsed ? daysBetween(parsed, today) : null;

  const rawText = input.rawFullDeadline == null ? "" : String(input.rawFullDeadline).trim();
  let urgencyScore: number;
  if (daysToDeadline != null) {
    urgencyScore = clamp(SCORE_MIN, SCORE_MAX, round2(10 * (1 / (1 + Math.max(0, daysToDeadline)))));
  } else if (rawText === "") {
    urgencyScore = 0; // blank cell -> "" -> 0 in the arithmetic (e.g. Earthshot = 40.1)
  } else {
    urgencyScore = 10; // non-empty unparseable text -> "due today" bug (e.g. Mulago = 59)
  }

  const easeScore = clamp(
    SCORE_MIN,
    SCORE_MAX,
    round2(10 * (1 - Math.min(input.timeCommitmentHours, MAX_EFFORT_HOURS) / MAX_EFFORT_HOURS)),
  );

  // Original: LOG10(amount + 1) * 3, capped at 10 — saturates at ~$2,154 (raw amount, no FX).
  const moneyScore = clamp(SCORE_MIN, SCORE_MAX, round2(Math.log10(input.expectedAmountUsd + 1) * 3));

  const w = PRIORITY_WEIGHTS;
  const priorityScore = round2(
    w.fitScore * input.fitScore +
      w.strategicValue * input.strategicValue +
      w.relationshipStrength * input.relationshipStrength +
      w.moneyScore * moneyScore +
      w.urgencyScore * urgencyScore +
      w.easeScore * easeScore +
      w.reportingBurden * input.reportingBurden +
      w.competitionLevel * input.competitionLevel,
  );

  const priorityBand: PriorityBand =
    priorityScore >= BAND_THRESHOLDS.high
      ? "High"
      : priorityScore >= BAND_THRESHOLDS.medium
        ? "Medium"
        : "Low";

  return { expectedValueUsd, daysToDeadline, urgencyScore, easeScore, moneyScore, priorityScore, priorityBand };
}

