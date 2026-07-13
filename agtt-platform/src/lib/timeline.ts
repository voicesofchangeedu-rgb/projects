// Timeline builder (mirrors AGTT_Timeline). Pulls 5 date columns from every opportunity, stacks
// them into one event list, filters to [today, today + lookahead], sorts ascending. Skips any
// non-parseable date (never errors). See prompt §2.2.

import type { ScoredOpportunity } from "./scoring";

export type TimelineEventType =
  | "Next action"
  | "Full deadline"
  | "LOI deadline"
  | "Follow-up"
  | "Decision expected";

export interface TimelineEvent {
  date: Date;
  type: TimelineEventType;
  opportunityId: string;
  opportunityName: string;
  funder: string;
  stage: string;
  owner: string | null;
  priorityBand: string;
  whatToDo: string;
  docLink: string | null;
}

interface Source {
  field: keyof ScoredOpportunity;
  type: TimelineEventType;
  fallback: (o: ScoredOpportunity) => string;
}

const SOURCES: Source[] = [
  { field: "nextActionDate", type: "Next action", fallback: (o) => o.nextAction ?? "Move next action forward" },
  { field: "fullDeadline", type: "Full deadline", fallback: () => "Submit / finalize" },
  { field: "loiDeadline", type: "LOI deadline", fallback: () => "Submit LOI" },
  { field: "nextFollowupDate", type: "Follow-up", fallback: () => "Send follow-up touch" },
  { field: "decisionDate", type: "Decision expected", fallback: () => "Watch for decision / follow up" },
];

export function buildTimeline(
  opps: ScoredOpportunity[],
  today: Date = new Date(),
  lookaheadDays = 90,
): TimelineEvent[] {
  const start = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const end = start + lookaheadDays * 86_400_000;

  const events: TimelineEvent[] = [];
  for (const o of opps) {
    for (const src of SOURCES) {
      const raw = o[src.field] as unknown;
      if (!(raw instanceof Date) || isNaN(raw.getTime())) continue;
      const t = Date.UTC(raw.getUTCFullYear(), raw.getUTCMonth(), raw.getUTCDate());
      if (t < start || t > end) continue;
      events.push({
        date: raw,
        type: src.type,
        opportunityId: o.id,
        opportunityName: o.name,
        funder: o.funderOrganization,
        stage: o.stage,
        owner: o.owner,
        priorityBand: o.scores.priorityBand,
        whatToDo: src.fallback(o),
        docLink: o.docLink,
      });
    }
  }
  events.sort((a, b) => a.date.getTime() - b.date.getTime());
  return events;
}

