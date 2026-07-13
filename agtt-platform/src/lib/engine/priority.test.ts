import { describe, it, expect } from "vitest";
import seed from "../../seed-data.json";
import { computeLegacyScore, computeOpportunityScore, type LegacyScoreInputs } from "./priority";
import { coerceDate } from "./dates";
import { toUsd, type Currency } from "./currency";

// The sheet's cached (auto) values were computed with TODAY() = 2026-07-13. Freeze it so
// day-dependent outputs (Days_to_Deadline / Urgency / Priority) are reproducible. See §8 caveat.
const REFERENCE_TODAY = new Date(Date.UTC(2026, 6, 13)); // 2026-07-13

interface SeedRow {
  displayId: string;
  name: string;
  fitScore: number;
  strategicValue: number;
  relationshipStrength: number;
  reportingBurden: number;
  competitionLevel: number;
  timeCommitmentHours: number;
  expectedAmount: number;
  currency: Currency;
  probability: number;
  fullDeadlineText: string | null;
  _cachedPriority: number | string | null;
  _cachedBand: string | null;
}

const rows = seed as unknown as SeedRow[];

// Only rows the sheet actually scored to a number (others are name-only stubs, or the #VALUE!
// row 25 which the sheet itself failed to compute — we intentionally do NOT reproduce that error).
const scoredRows = rows.filter((r) => typeof r._cachedPriority === "number");

function legacyInputs(r: SeedRow): LegacyScoreInputs {
  return {
    fitScore: r.fitScore,
    strategicValue: r.strategicValue,
    relationshipStrength: r.relationshipStrength,
    reportingBurden: r.reportingBurden,
    competitionLevel: r.competitionLevel,
    timeCommitmentHours: r.timeCommitmentHours,
    // Legacy scored the RAW amount regardless of currency (that is the 6.3 bug).
    expectedAmountUsd: r.expectedAmount,
    probability: r.probability,
    rawFullDeadline: r.fullDeadlineText,
  };
}

describe("AGTT parity: legacy replica reproduces the live sheet exactly", () => {
  it("has 14 numerically-scored source rows", () => {
    expect(scoredRows.length).toBe(14);
  });

  for (const r of scoredRows) {
    it(`${r.displayId} ${r.name.slice(0, 28)} -> Priority ${r._cachedPriority}`, () => {
      const out = computeLegacyScore(legacyInputs(r), REFERENCE_TODAY);
      expect(out.priorityScore).toBeCloseTo(r._cachedPriority as number, 2);
      expect(out.priorityBand).toBe(r._cachedBand);
    });
  }
});

describe("AGTT: the two intentional fixes change specific rankings (6.3 money rescale, 6.4 urgency)", () => {
  // Money rescale: every row's money component moves off the saturated 10 unless amount is huge.
  it("Mulago (rolling/invite-only) drops from 59 (legacy urgency 10) under the urgency fix", () => {
    const mulago = rows.find((r) => r.name === "Mulago")!;
    const legacy = computeLegacyScore(legacyInputs(mulago), REFERENCE_TODAY);
    expect(legacy.priorityScore).toBeCloseTo(59, 2);
    expect(legacy.urgencyScore).toBe(10);

    const fixed = computeOpportunityScore(
      {
        fitScore: mulago.fitScore,
        strategicValue: mulago.strategicValue,
        relationshipStrength: mulago.relationshipStrength,
        reportingBurden: mulago.reportingBurden,
        competitionLevel: mulago.competitionLevel,
        timeCommitmentHours: mulago.timeCommitmentHours,
        expectedAmountUsd: toUsd(mulago.expectedAmount, mulago.currency),
        probability: mulago.probability,
        fullDeadline: coerceDate(mulago.fullDeadlineText),
      },
      REFERENCE_TODAY,
    );
    // No parseable deadline -> urgency 0 (fix 6.4), and money is no longer pinned at 10 (fix 6.3).
    expect(fixed.urgencyScore).toBe(0);
    expect(fixed.priorityScore).toBeLessThan(legacy.priorityScore);
  });

  it("money score now differentiates $10k vs $1M instead of both maxing at 10", () => {
    const base = {
      fitScore: 8, strategicValue: 8, relationshipStrength: 2, reportingBurden: 2,
      competitionLevel: 3, timeCommitmentHours: 40, probability: 0.5, fullDeadline: null as Date | null,
    };
    const small = computeOpportunityScore({ ...base, expectedAmountUsd: 10_000 }, REFERENCE_TODAY);
    const big = computeOpportunityScore({ ...base, expectedAmountUsd: 1_000_000 }, REFERENCE_TODAY);
    expect(small.moneyScore).toBeLessThan(big.moneyScore);
    expect(big.moneyScore).toBeLessThan(10); // not saturated
  });
});

describe("AGTT engine: robustness", () => {
  it("unparseable / blank deadlines never throw and yield urgency 0 in the new engine", () => {
    for (const text of ["N/A (invite-only)", "Rolling / By referral only", "20/05/2026", "", "16-19 April 2026"]) {
      const out = computeOpportunityScore(
        { fitScore: 5, strategicValue: 5, relationshipStrength: 2, reportingBurden: 2, competitionLevel: 3, timeCommitmentHours: 20, expectedAmountUsd: 50_000, probability: 0.3, fullDeadline: coerceDate(text) },
        REFERENCE_TODAY,
      );
      expect(Number.isFinite(out.priorityScore)).toBe(true);
      if (coerceDate(text) == null) expect(out.urgencyScore).toBe(0);
    }
  });

  it('coerceDate reads "20/05/2026" as 20 May and rejects "N/A (rolling)"', () => {
    expect(coerceDate("20/05/2026")?.toISOString().slice(0, 10)).toBe("2026-05-20");
    expect(coerceDate("N/A (rolling)")).toBeNull();
  });
});

