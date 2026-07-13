"use client";

import { useState } from "react";
import type { Opportunity } from "@prisma/client";
import {
  TYPE_LABELS, STAGE_LABELS, STATUS_LABELS, CURRENCY_VALUES,
  TYPE_VALUES, STAGE_VALUES, STATUS_VALUES,
} from "@/lib/enums";

type Props = {
  action: (fd: FormData) => void | Promise<void>;
  opportunity?: Opportunity | null;
};

function iso(d: Date | null | undefined): string {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export default function OpportunityForm({ action, opportunity: o }: Props) {
  const [sec, setSec] = useState("overview");
  const tabs = [
    ["overview", "Overview"],
    ["dates", "Dates"],
    ["scoring", "Scoring inputs"],
    ["contacts", "Contacts"],
    ["pitch", "Pitch strategy"],
    ["notes", "Notes"],
  ];

  return (
    <form action={action} className="space-y-6">
      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {tabs.map(([k, label]) => (
          <button
            type="button"
            key={k}
            onClick={() => setSec(k)}
            className={`rounded-t-md px-3 py-2 text-sm font-medium ${
              sec === k ? "border-b-2 border-emerald-600 text-emerald-700" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <Section show={sec === "overview"}>
        <Select name="type" label="Type" defaultValue={o?.type ?? "GRANT"} options={TYPE_VALUES} labels={TYPE_LABELS} />
        <Text name="name" label="Opportunity name" defaultValue={o?.name} required span2 />
        <Text name="funderOrganization" label="Funder organization" defaultValue={o?.funderOrganization} required />
        <Text name="programInitiative" label="Program / initiative" defaultValue={o?.programInitiative} />
        <Text name="website" label="Website" defaultValue={o?.website} />
        <Text name="geographyEligibility" label="Geography / eligibility" defaultValue={o?.geographyEligibility} />
        <Text name="thematicAreas" label="Thematic areas" defaultValue={o?.thematicAreas} span2 />
        <Select name="stage" label="Stage" defaultValue={o?.stage ?? "RESEARCH"} options={STAGE_VALUES} labels={STAGE_LABELS} />
        <Select name="status" label="Status" defaultValue={o?.status ?? "NOT_STARTED"} options={STATUS_VALUES} labels={STATUS_LABELS} />
        <Text name="owner" label="Owner" defaultValue={o?.owner} />
      </Section>

      <Section show={sec === "dates"}>
        <DateField name="openDate" label="Open date" value={iso(o?.openDate)} text={o?.openDateText} />
        <div>
          <label className="label">LOI required</label>
          <label className="mt-2 flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="loiRequired" defaultChecked={o?.loiRequired ?? false} className="h-4 w-4" />
            Yes
          </label>
        </div>
        <DateField name="loiDeadline" label="LOI deadline" value={iso(o?.loiDeadline)} text={o?.loiDeadlineText} />
        <DateField name="fullDeadline" label="Full deadline" value={iso(o?.fullDeadline)} text={o?.fullDeadlineText} />
        <DateField name="decisionDate" label="Decision date (expected)" value={iso(o?.decisionDate)} text={o?.decisionDateText} />
        <DateField name="nextActionDate" label="Next action date" value={iso(o?.nextActionDate)} text={o?.nextActionDateText} />
        <DateField name="lastContactDate" label="Last contact date" value="" text={o?.lastContactDateText} />
        <DateField name="nextFollowupDate" label="Next follow-up date" value={iso(o?.nextFollowupDate)} text={o?.nextFollowupDateText} />
      </Section>

      <Section show={sec === "scoring"}>
        <NumberField name="fitScore" label="Fit score (1-10)" defaultValue={o?.fitScore} min={0} max={10} step={0.5} />
        <NumberField name="strategicValue" label="Strategic value (1-10)" defaultValue={o?.strategicValue} min={0} max={10} step={0.5} />
        <NumberField name="relationshipStrength" label="Relationship strength (0-5)" defaultValue={o?.relationshipStrength} min={0} max={5} step={0.5} />
        <NumberField name="reportingBurden" label="Reporting burden (1-5)" defaultValue={o?.reportingBurden} min={0} max={5} step={0.5} />
        <NumberField name="competitionLevel" label="Competition level (1-5)" defaultValue={o?.competitionLevel} min={0} max={5} step={0.5} />
        <NumberField name="timeCommitmentHours" label="Time commitment (hours)" defaultValue={o?.timeCommitmentHours} min={0} step={1} note="Higher hours -> lower ease score" />
        <NumberField name="expectedAmount" label="Expected amount" defaultValue={o?.expectedAmount} min={0} step={1} />
        <Select name="currency" label="Currency" defaultValue={o?.currency ?? "USD"} options={CURRENCY_VALUES} />
        <NumberField name="probability" label="Probability (0-1)" defaultValue={o?.probability} min={0} max={1} step={0.01} />
      </Section>

      <Section show={sec === "contacts"}>
        <Text name="primaryContactName" label="Primary contact name" defaultValue={o?.primaryContactName} />
        <Text name="primaryContactEmail" label="Primary contact email" defaultValue={o?.primaryContactEmail} />
        <Text name="primaryContactPhone" label="Primary contact phone" defaultValue={o?.primaryContactPhone} />
      </Section>

      <Section show={sec === "pitch"}>
        <Text name="reader" label="Reader (name / role)" defaultValue={o?.reader} note="Who reads the application first" />
        <Text name="recommender" label="Recommender (name / role)" defaultValue={o?.recommender} />
        <Text name="signer" label="Signer (name / role)" defaultValue={o?.signer} />
        <TextArea name="kpis" label="KPIs / what they're optimizing for" defaultValue={o?.kpis} />
        <TextArea name="institutionalPriorities" label="Institutional priorities right now" defaultValue={o?.institutionalPriorities} />
        <TextArea name="languageToMirror" label="Language to mirror" defaultValue={o?.languageToMirror} />
        <TextArea name="keyRisks" label="Key risks they might perceive" defaultValue={o?.keyRisks} />
        <TextArea name="heroFraming" label="Hero framing (how they look smart)" defaultValue={o?.heroFraming} />
      </Section>

      <Section show={sec === "notes"}>
        <Text name="nextAction" label="Next action" defaultValue={o?.nextAction} span2 />
        <Text name="docLink" label="Doc link" defaultValue={o?.docLink} span2 />
        <TextArea name="notes" label="Notes" defaultValue={o?.notes} span2 rows={6} />
      </Section>

      <div className="flex gap-3 border-t border-slate-200 pt-4">
        <button type="submit" className="btn-primary">Save</button>
      </div>
    </form>
  );
}

function Section({ show, children }: { show: boolean; children: React.ReactNode }) {
  return <div className={`grid gap-4 sm:grid-cols-2 ${show ? "" : "hidden"}`}>{children}</div>;
}
function Text({ name, label, defaultValue, required, span2, note }: any) {
  return (
    <div className={span2 ? "sm:col-span-2" : ""}>
      <label className="label">{label}{required && " *"}</label>
      <input name={name} defaultValue={defaultValue ?? ""} required={required} className="input" />
      {note && <p className="field-note">{note}</p>}
    </div>
  );
}
function TextArea({ name, label, defaultValue, span2, rows = 3 }: any) {
  return (
    <div className={span2 ? "sm:col-span-2" : ""}>
      <label className="label">{label}</label>
      <textarea name={name} defaultValue={defaultValue ?? ""} rows={rows} className="input" />
    </div>
  );
}
function NumberField({ name, label, defaultValue, min, max, step, note }: any) {
  return (
    <div>
      <label className="label">{label}</label>
      <input type="number" name={name} defaultValue={defaultValue ?? 0} min={min} max={max} step={step} className="input" />
      {note && <p className="field-note">{note}</p>}
    </div>
  );
}
function Select({ name, label, defaultValue, options, labels }: any) {
  return (
    <div>
      <label className="label">{label}</label>
      <select name={name} defaultValue={defaultValue} className="input">
        {options.map((v: string) => <option key={v} value={v}>{labels?.[v] ?? v}</option>)}
      </select>
    </div>
  );
}
function DateField({ name, label, value, text }: { name: string; label: string; value: string; text?: string | null }) {
  const showText = text && text !== value;
  return (
    <div>
      <label className="label">{label}</label>
      <input type="date" name={name} defaultValue={value} className="input" />
      <input type="hidden" name={`${name}__origtext`} defaultValue={text ?? ""} />
      {showText && <p className="field-note">Original text: &quot;{text}&quot; (not a parseable date; kept for reference)</p>}
    </div>
  );
}

