import { prisma } from "@/lib/prisma";
import ImportForm from "./ImportForm";

export const dynamic = "force-dynamic";

export default async function DataPage() {
  const oppCount = await prisma.opportunity.count();
  const outCount = await prisma.outreachLogEntry.count();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Data</h1>
        <p className="mt-1 text-sm text-slate-500">
          {oppCount} opportunities, {outCount} outreach entries. Backup and restore the full dataset as JSON.
        </p>
      </div>

      <section className="card p-6">
        <h2 className="font-semibold text-slate-900">Export</h2>
        <p className="mt-1 text-sm text-slate-500">
          Downloads every opportunity and outreach entry as JSON (raw inputs only — computed scores are never stored).
        </p>
        <div className="mt-3 flex gap-3">
          <a href="/api/export" className="btn-primary" download>Download JSON backup</a>
          <a href="/api/export/csv" className="btn-secondary" download>Download opportunities CSV</a>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="font-semibold text-slate-900">Import / restore</h2>
        <p className="mt-1 text-sm text-slate-500">Paste a JSON backup to restore or merge it into the current dataset.</p>
        <div className="mt-3">
          <ImportForm />
        </div>
      </section>
    </div>
  );
}

