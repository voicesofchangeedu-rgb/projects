import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { scoreAll } from "@/lib/scoring";
import { STAGE_LABELS, STATUS_LABELS, TYPE_LABELS, STAGE_VALUES, STATUS_VALUES, TYPE_VALUES } from "@/lib/enums";
import { PriorityBadge, usdFormat, OpportunityLink } from "@/components/ui";

export const dynamic = "force-dynamic";

type SP = { [k: string]: string | undefined };

export default async function OpportunitiesPage({ searchParams }: { searchParams: SP }) {
  const opps = await prisma.opportunity.findMany();
  let scored = scoreAll(opps, new Date());

  const { stage, status, type, band, owner, sort } = searchParams;
  if (stage) scored = scored.filter((o) => o.stage === stage);
  if (status) scored = scored.filter((o) => o.status === status);
  if (type) scored = scored.filter((o) => o.type === type);
  if (band) scored = scored.filter((o) => o.scores.priorityBand === band);
  if (owner) scored = scored.filter((o) => (o.owner ?? "").toLowerCase().includes(owner.toLowerCase()));

  scored.sort((a, b) => {
    switch (sort) {
      case "deadline":
        return (a.scores.daysToDeadline ?? 1e9) - (b.scores.daysToDeadline ?? 1e9);
      case "ev":
        return b.scores.expectedValueUsd - a.scores.expectedValueUsd;
      case "name":
        return a.name.localeCompare(b.name);
      default:
        return b.scores.priorityScore - a.scores.priorityScore;
    }
  });

  const owners = [...new Set(opps.map((o) => o.owner).filter(Boolean))] as string[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Opportunities</h1>
          <p className="mt-1 text-sm text-slate-500">{scored.length} shown of {opps.length} total</p>
        </div>
        <Link href="/opportunities/new" className="btn-primary">+ New opportunity</Link>
      </div>

      <form className="card flex flex-wrap items-end gap-3 p-4" method="get">
        <Filter name="type" label="Type" value={type} options={TYPE_VALUES} labels={TYPE_LABELS} />
        <Filter name="stage" label="Stage" value={stage} options={STAGE_VALUES} labels={STAGE_LABELS} />
        <Filter name="status" label="Status" value={status} options={STATUS_VALUES} labels={STATUS_LABELS} />
        <Filter name="band" label="Priority" value={band} options={["High", "Medium", "Low"]} />
        <div>
          <label className="label">Owner</label>
          <select name="owner" defaultValue={owner ?? ""} className="input min-w-36">
            <option value="">All</option>
            {owners.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Sort by</label>
          <select name="sort" defaultValue={sort ?? "priority"} className="input min-w-36">
            <option value="priority">Priority score</option>
            <option value="deadline">Deadline (soonest)</option>
            <option value="ev">Expected value</option>
            <option value="name">Name</option>
          </select>
        </div>
        <button className="btn-secondary" type="submit">Apply</button>
        <Link href="/opportunities" className="btn-secondary">Reset</Link>
      </form>

      <section className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Priority</th>
                <th className="px-4 py-2">Opportunity</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Stage</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Deadline</th>
                <th className="px-4 py-2 text-right">Exp. value</th>
                <th className="px-4 py-2">Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scored.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2"><PriorityBadge band={o.scores.priorityBand} score={o.scores.priorityScore} /></td>
                  <td className="px-4 py-2">
                    <OpportunityLink id={o.id}>{o.name}</OpportunityLink>
                    <div className="text-xs text-slate-400">{o.funderOrganization}</div>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{TYPE_LABELS[o.type]}</td>
                  <td className="px-4 py-2 text-slate-600">{STAGE_LABELS[o.stage]}</td>
                  <td className="px-4 py-2 text-slate-600">{STATUS_LABELS[o.status]}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {o.fullDeadlineText ?? "—"}
                    {o.scores.daysToDeadline != null && (
                      <span className="ml-1 text-xs text-slate-400">({o.scores.daysToDeadline}d)</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-slate-700">{usdFormat(o.scores.expectedValueUsd)}</td>
                  <td className="px-4 py-2 text-slate-600">{o.owner ?? "—"}</td>
                </tr>
              ))}
              {scored.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">No opportunities match these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Filter({ name, label, value, options, labels }: {
  name: string; label: string; value?: string; options: string[]; labels?: Record<string, string>;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <select name={name} defaultValue={value ?? ""} className="input min-w-36">
        <option value="">All</option>
        {options.map((o) => <option key={o} value={o}>{labels?.[o] ?? o}</option>)}
      </select>
    </div>
  );
}

