import Link from "next/link";
import { createOpportunity } from "../actions";
import OpportunityForm from "../OpportunityForm";

export default function NewOpportunityPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">New opportunity</h1>
        <Link href="/opportunities" className="btn-secondary">Cancel</Link>
      </div>
      <section className="card p-6">
        <OpportunityForm action={createOpportunity} />
      </section>
    </div>
  );
}

