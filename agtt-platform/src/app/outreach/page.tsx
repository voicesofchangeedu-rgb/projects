import { prisma } from "@/lib/prisma";
import { createOutreach, deleteOutreach } from "./actions";
import { OUTREACH_METHODS } from "@/lib/enums";

export const dynamic = "force-dynamic";

export default async function OutreachPage({ searchParams }: { searchParams: { opp?: string } }) {
  const opps = await prisma.opportunity.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, funderOrganization: true } });
  const where = searchParams.opp ? { relatedOpportunityId: searchParams.opp } : {};
  const entries = await prisma.outreachLogEntry.findMany({
    where,
    orderBy: { date: "desc" },
    include: { relatedOpportunity: { select: { name: true } } },
  });
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Outreach log</h1>
        <p className="mt-1 text-sm text-slate-500">
          {entries.length} entries{searchParams.opp ? " (filtered to one opportunity)" : ""}. Outreach can be logged even before a formal opportunity exists.
        </p>
      </div>

      <section className="card p-6">
        <h2 className="mb-4 font-semibold text-slate-900">Log new outreach</h2>
        <form action={createOutreach} className="grid gap-4 sm:grid-cols-3">
          <F label="Date"><input type="date" name="date" defaultValue={today} className="input" /></F>
          <F label="Organization"><input name="organization" className="input" /></F>
          <F label="Related opportunity">
            <select name="relatedOpportunityId" defaultValue={searchParams.opp ?? ""} className="input">
              <option value="">None</option>
              {opps.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </F>
          <F label="Contact name"><input name="contactName" className="input" /></F>
          <F label="Contact email"><input name="contactEmail" className="input" /></F>
          <F label="Method">
            <select name="method" className="input">{OUTREACH_METHODS.map((m) => <option key={m}>{m}</option>)}</select>
          </F>
          <F label="Purpose"><input name="purpose" className="input" /></F>
          <F label="Outcome"><input name="outcome" className="input" /></F>
          <F label="Owner"><input name="owner" className="input" /></F>
          <F label="Next step"><input name="nextStep" className="input" /></F>
          <F label="Next step date"><input type="date" name="nextStepDate" className="input" /></F>
          <F label="Relationship impact (-2..+2)"><input type="number" name="relationshipImpact" min={-2} max={2} step={1} className="input" /></F>
          <F label="Link"><input name="link" className="input" /></F>
          <F label="Notes" span><textarea name="notes" rows={2} className="input" /></F>
          <div className="sm:col-span-3"><button type="submit" className="btn-primary">Add entry</button></div>
        </form>
      </section>

      <section className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Date</th><th className="px-4 py-2">Org</th><th className="px-4 py-2">Contact</th>
                <th className="px-4 py-2">Method</th><th className="px-4 py-2">Purpose</th><th className="px-4 py-2">Outcome</th>
                <th className="px-4 py-2">Opportunity</th><th className="px-4 py-2">Next step</th><th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 text-slate-600">{new Date(e.date).toISOString().slice(0, 10)}</td>
                  <td className="px-4 py-2 text-slate-600">{e.organization}</td>
                  <td className="px-4 py-2 text-slate-600">{e.contactName ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-600">{e.method}</td>
                  <td className="px-4 py-2 text-slate-600">{e.purpose ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-600">{e.outcome ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-500">{e.relatedOpportunity?.name ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-500">{e.nextStep ?? "—"}</td>
                  <td className="px-4 py-2">
                    <form action={deleteOutreach.bind(null, e.id)}>
                      <button className="text-xs text-red-500 hover:underline">Delete</button>
                    </form>
                  </td>
                </tr>
              ))}
              {entries.length === 0 && <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-400">No outreach logged yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function F({ label, children, span }: { label: string; children: React.ReactNode; span?: boolean }) {
  return (
    <div className={span ? "sm:col-span-3" : ""}>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

