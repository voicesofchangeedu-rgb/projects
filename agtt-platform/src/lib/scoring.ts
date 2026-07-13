// Adapter: turn a stored Opportunity (raw inputs) into live computed scores.
// This is the ONLY place the app converts DB rows -> engine inputs. Currency is normalized to USD
// here (fix 6.3) before anything is scored or summed.

import type { Opportunity } from "@prisma/client";
import { computeOpportunityScore, type OpportunityScoreOutputs } from "./engine/priority";
import { toUsd, type Currency } from "./engine/currency";

export type ScoredOpportunity = Opportunity & { scores: OpportunityScoreOutputs };

export function scoreOpportunity(o: Opportunity, today: Date = new Date()): ScoredOpportunity {
  const scores = computeOpportunityScore(
    {
      fitScore: o.fitScore,
      strategicValue: o.strategicValue,
      relationshipStrength: o.relationshipStrength,
      reportingBurden: o.reportingBurden,
      competitionLevel: o.competitionLevel,
      timeCommitmentHours: o.timeCommitmentHours,
      expectedAmountUsd: toUsd(o.expectedAmount, o.currency as Currency),
      probability: o.probability,
      fullDeadline: o.fullDeadline,
    },
    today,
  );
  return { ...o, scores };
}

export function scoreAll(list: Opportunity[], today: Date = new Date()): ScoredOpportunity[] {
  return list.map((o) => scoreOpportunity(o, today));
}

