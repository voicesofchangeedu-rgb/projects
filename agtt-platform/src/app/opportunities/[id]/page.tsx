import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { scoreOpportunity } from "@/lib/scoring";
import { updateOpportunity, deleteOpportunity } from "../actions";
import OpportunityForm from "../OpportunityForm";
import { PriorityBadge, usdFormat } from "@/components/ui";
import { TYPE_LABELS, STAGE_LABELS, STATUS_LABELS } from "@/lib/enums";

export const dynamic = "force-dynamic";

export default async function OpportunityDetail({ params }: { params: { id: string } }) {
  const o = await prisma.opportunity.findUnique({
    where: { id: params.id },
    include: { outreachLogs: { orderBy: { date: "desc" } } },
  });
  if (!o) notFound();

  const { scores } = scoreOpportunity(o, new Date());

  async function update(fd: FormData) {
    "use server";
    await updateOpportunity(params.id, fd);
  }
  async function del() {
    "use server";
    await deleteOpportunity(params.id);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-slate-400">{o.displayId}</span>
            <PriorityBadge band={scores.priorityBand} score={scores.priorityScore} />
          </div>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">{o.name}</h1>
          <p className="text-sm text-slate-500">
            {o.funderOrganization} · {TYPE_LABELS[o.type]} · {STAGE_LABELS[o.stage]} · {STATUS_LABELS[o.status]}
          </p>
        </div>
        <Link href="/opportunities" className="btn-secondary">Back to list</Link>
      </div>

      <section className="card p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Computed (live, read-only)</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          <Out label="Priority" value={scores.priorityScore.toFixed(2)} />
          <Out label="Band" value={scores.priorityBand} />
          <Out label="Expected value" value={usdFormat(scores.expectedValueUsd)} />
          <Out label="Days to deadline" value={scores.daysToDeadline == null ? "—" : String(scores.daysToDeadline)} />
          <Out label="Urgency" value={scores.urgencyScore.toFixed(2)} />
          <Out label="Ease" value={scores.easeScore.toFixed(2)} />
          <Out label="Money" value={scores.moneyScore.toFixed(2)} />
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Recomputed every load from the raw inputs below and today&apos;s date. Never stored.
          &quot;Ease&quot; is higher when less work is required (the sheet mislabeled this as &quot;Effort&quot;).
        </p>
      </section>

      <section className="card p-6">
        <OpportunityForm action={update} opportunity={o} />
      </section>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="font-semibold text-slate-900">Outreach log ({o.outreachLogs.length})</h2>
          <Link href={`/outreach?opp=${o.id}`} className="text-sm text-emerald-700 hover:underline">
            Add / view in Outreach Log
          </Link>
        </div>
        {o.outreachLogs.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-400">No outreach logged for this opportunity yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="px-4 py-2">Date</th><th className="px-4 py-2">Method</th><th className="px-4 py-2">Purpose</th><th className="px-4 py-2">Outcome</th><th className="px-4 py-2">Next step</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {o.outreachLogs.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-2 text-slate-600">{new Date(l.date).toISOString().slice(0, 10)}</td>
                  <td className="px-4 py-2 text-slate-600">{l.method}</td>
                  <td className="px-4 py-2 text-slate-600">{l.purpose ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-600">{l.outcome ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-600">{l.nextStep ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card border-red-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-red-700">Delete opportunity</h2>
            <p className="text-sm text-slate-500">This cannot be undone. Related outreach entries are kept but unlinked.</p>
          </div>
          <form action={del}>
            <button type="submit" className="btn-danger">Delete</button>
          </form>
        </div>
      </section>
    </div>
  );
}

function Out({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-0.5 font-mono text-lg font-semibold text-slate-800">{value}</div>
    </div>
  );
}

