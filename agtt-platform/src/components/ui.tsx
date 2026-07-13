import Link from "next/link";

const BAND_STYLE: Record<string, string> = {
  High: "bg-red-50 text-red-700 border-red-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Low: "bg-blue-50 text-blue-700 border-blue-200",
};

export function PriorityBadge({ band, score }: { band: string; score?: number }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${
        BAND_STYLE[band] ?? "bg-slate-100 text-slate-600 border-slate-200"
      }`}
    >
      {band}
      {score != null && <span className="font-mono opacity-70">{score.toFixed(1)}</span>}
    </span>
  );
}

export const BAND_BAR: Record<string, string> = {
  High: "border-l-red-400",
  Medium: "border-l-amber-400",
  Low: "border-l-blue-400",
};

export function StatPill({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

export function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
      {children}
    </span>
  );
}

export function usdFormat(n: number): string {
  if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return "$" + (n / 1_000).toFixed(1) + "k";
  return "$" + n.toFixed(0);
}

export function OpportunityLink({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <Link href={`/opportunities/${id}`} className="font-medium text-emerald-700 hover:underline">
      {children}
    </Link>
  );
}

