"use client";

import { useFormState, useFormStatus } from "react-dom";
import { importData } from "./actions";

const initial = { ok: false, message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary disabled:opacity-50">
      {pending ? "Importing…" : "Import JSON"}
    </button>
  );
}

export default function ImportForm() {
  const [state, formAction] = useFormState(importData, initial);
  return (
    <form action={formAction} className="space-y-3">
      <textarea
        name="json"
        rows={8}
        placeholder="Paste a previously-exported agtt-backup.json here"
        className="input font-mono text-xs"
      />
      <div className="flex items-center gap-3">
        <SubmitButton />
        {state.message && (
          <span className={`text-sm ${state.ok ? "text-emerald-700" : "text-red-600"}`}>{state.message}</span>
        )}
      </div>
      <p className="field-note">
        Import upserts by displayId (opportunities) and id (outreach), so re-importing a backup is safe and
        idempotent. It does not delete rows that are absent from the file.
      </p>
    </form>
  );
}

