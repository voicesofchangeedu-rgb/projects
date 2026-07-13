import { prisma } from "@/lib/prisma";
import { scoreAll } from "@/lib/scoring";
import { STAGE_LABELS, STATUS_LABELS } from "@/lib/enums";
import { PriorityBadge, StatPill, usdFormat, OpportunityLink } from "@/components/ui";
import { FX_TABLE_VERSION } from "@/lib/engine/currency";

export const dynamic = "force-dynamic"; // scores depend on today's date

const PITCH_CHECKLIST = [
  "Who is the first reader, and what are they measured on?",
  "Top 3 institutional priorities right now?",
  "Which of their own words/phrases should we mirror?",
  "What risks might they perceive, and how do we pre-empt them?",
  "What is the hero framing — how do they look smart for funding us?",
  "Who recommends internally, and who signs off?",
];

export default async function DashboardPage() {
  const opps = await prisma.opportunity.findMany();
  const today = new Date();
  const scored = scoreAll(opps, today);

  const total = scored.length;
  const inProgress = scored.filter((o) => o.status === "IN_PROGRESS").length;
  const submitted = scored.filter((o) => o.stage === "SUBMITTED").length;
  const awarded = scored.filter((o) => o.stage === "AWARDED").length;
  const totalEv = scored.reduce((s, o) => s + o.scores.expectedValueUsd, 0);
  const scoredOnly = scored.filter((o) => o.fitScore > 0);
  const avgPriority =
    scoredOnly.length > 0
      ? scoredOnly.reduce((s, o) => s + o.scores.priorityScore, 0) / scoredOnly.length
      : 0;

  const top20 = [...scored].sort((a, b) => b.scores.priorityScore - a.scores.priorityScore).slice(0, 20);

  // Pipeline by stage, USD-normalized expected value.
  const byStage = new Map<string, { count: number; ev: number }>();
  for (const o of scored) {
    const cur = byStage.get(o.stage) ?? { count: 0, ev: 0 };
    cur.count += 1;
    cur.ev += o.scores.expectedValueUsd;
    byStage.set(o.stage, cur);
  }
  const stageRows = [...byStage.entries()].sort((a, b) => b[1].ev - a[1].ev);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Live scores recomputed every load from raw inputs and today&apos;s date.
        </p>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <strong>Rankings differ from the old sheet on purpose.</strong> Two fixes are applied:
        money scores are rescaled so amounts actually differentiate (the sheet capped almost
        everything at 10), and opportunities with no fixed deadline now score 0 urgency instead of
        maximum. All amounts are normalized to USD (FX table {FX_TABLE_VERSION}) before summing.
        See docs/decisions-log.md 6.3 and 6.4.
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatPill label="Opportunities" value={String(total)} />
        <StatPill label="In progress" value={String(inProgress)} sub="by status" />
        <StatPill label="Submitted" value={String(submitted)} sub="by stage" />
        <StatPill label="Awarded" value={String(awarded)} sub="by stage" />
        <StatPill label="Total exp. value" value={usdFormat(totalEv)} sub="USD-normalized" />
        <StatPill label="Avg priority" value={avgPriority.toFixed(1)} sub="scored rows only" />
      </div>

      <section className="card overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="font-semibold text-slate-900">Top 20 by priority score</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Score</th>
                <th className="px-4 py-2">Opportunity</th>
                <th className="px-4 py-2">Funder</th>
                <th className="px-4 py-2">Deadline</th>
                <th className="px-4 py-2">Stage</th>
                <th className="px-4 py-2">Owner</th>
                <th className="px-4 py-2">Next action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {top20.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <PriorityBadge band={o.scores.priorityBand} score={o.scores.priorityScore} />
                  </td>
                  <td className="px-4 py-2">
                    <OpportunityLink id={o.id}>{o.name}</OpportunityLink>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{o.funderOrganization}</td>
                  <td className="px-4 py-2 text-slate-600">{o.fullDeadlineText ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-600">{STAGE_LABELS[o.stage]}</td>
                  <td className="px-4 py-2 text-slate-600">{o.owner ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-500">{o.nextAction ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card overflow-hidden">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="font-semibold text-slate-900">Pipeline by stage</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Stage</th>
                <th className="px-4 py-2 text-right">Count</th>
                <th className="px-4 py-2 text-right">Expected value (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stageRows.map(([stage, v]) => (
                <tr key={stage}>
                  <td className="px-4 py-2 text-slate-700">{STAGE_LABELS[stage]}</td>
                  <td className="px-4 py-2 text-right text-slate-600">{v.count}</td>
                  <td className="px-4 py-2 text-right font-mono text-slate-700">{usdFormat(v.ev)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="card p-4">
          <h2 className="font-semibold text-slate-900">How to think about any pitch</h2>
          <p className="mt-1 text-xs text-slate-500">
            Generic methodology reminder. The per-opportunity answers live on each opportunity&apos;s
            Pitch strategy section.
          </p>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {PITCH_CHECKLIST.map((q) => (
              <li key={q} className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
                {q}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

