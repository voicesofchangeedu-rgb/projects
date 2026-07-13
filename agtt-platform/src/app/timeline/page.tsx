import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { scoreAll } from "@/lib/scoring";
import { buildTimeline } from "@/lib/timeline";
import { PriorityBadge, BAND_BAR, Chip } from "@/components/ui";
import { STAGE_LABELS } from "@/lib/enums";

export const dynamic = "force-dynamic";

export default async function TimelinePage({ searchParams }: { searchParams: { days?: string } }) {
  const lookahead = Math.min(365, Math.max(7, parseInt(searchParams.days ?? "90", 10) || 90));
  const opps = await prisma.opportunity.findMany();
  const today = new Date();
  const events = buildTimeline(scoreAll(opps, today), today, lookahead);

  // group by ISO week-start-ish: just group by date string
  const groups = new Map<string, typeof events>();
  for (const e of events) {
    const key = e.date.toISOString().slice(0, 10);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  }

  const windows = [30, 60, 90, 180];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Timeline</h1>
          <p className="mt-1 text-sm text-slate-500">
            {events.length} events in the next {lookahead} days. Non-date values (rolling, invite-only) are skipped.
          </p>
        </div>
        <div className="flex gap-1">
          {windows.map((d) => (
            <Link
              key={d}
              href={`/timeline?days=${d}`}
              className={`btn ${d === lookahead ? "btn-primary" : "btn-secondary"}`}
            >
              {d}d
            </Link>
          ))}
        </div>
      </div>

      {events.length === 0 ? (
        <div className="card p-8 text-center text-slate-400">No dated events in this window.</div>
      ) : (
        <div className="space-y-6">
          {[...groups.entries()].map(([date, evs]) => (
            <div key={date}>
              <div className="mb-2 flex items-baseline gap-2">
                <h2 className="text-sm font-semibold text-slate-900">
                  {new Date(date + "T00:00:00Z").toLocaleDateString("en-US", {
                    weekday: "short", month: "short", day: "numeric", timeZone: "UTC",
                  })}
                </h2>
                <span className="text-xs text-slate-400">{evs.length} event{evs.length > 1 ? "s" : ""}</span>
              </div>
              <div className="space-y-2">
                {evs.map((e, i) => (
                  <div
                    key={i}
                    className={`card border-l-4 ${BAND_BAR[e.priorityBand] ?? "border-l-slate-300"} p-3`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Chip>{e.type}</Chip>
                      <Link href={`/opportunities/${e.opportunityId}`} className="font-medium text-emerald-700 hover:underline">
                        {e.opportunityName}
                      </Link>
                      <span className="text-xs text-slate-400">{e.funder}</span>
                      <PriorityBadge band={e.priorityBand} />
                      <span className="ml-auto text-xs text-slate-400">{STAGE_LABELS[e.stage]} · {e.owner ?? "no owner"}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{e.whatToDo}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

