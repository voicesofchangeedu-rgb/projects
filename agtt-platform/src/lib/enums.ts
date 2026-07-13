export const TYPE_LABELS: Record<string, string> = {
  GRANT: "Grant",
  AWARD: "Award",
  FELLOWSHIP: "Fellowship",
  FUND: "Fund",
  PRIZE: "Prize",
  GLOBAL_PARTICIPATION: "Global Participation",
  MENTORSHIP: "Mentorship",
  AWARD_GRANT: "Award + Grant",
  FELLOWSHIP_GRANT: "Fellowship + Grant",
  SPONSORED_INTERNS: "Sponsored Interns",
};

export const STAGE_LABELS: Record<string, string> = {
  RESEARCH: "Research",
  OUTREACH: "Outreach",
  LOI: "LOI",
  DRAFTING: "Drafting",
  SUBMITTED: "Submitted",
  INTERVIEW: "Interview",
  NEGOTIATION: "Negotiation",
  AWARDED: "Awarded",
  DECLINED: "Declined",
  PAUSED: "Paused",
  DEADLINE_MISSED: "Deadline missed",
};

export const STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  WAITING: "Waiting",
  SUBMITTED: "Submitted",
  WON: "Won",
  LOST: "Lost",
  PAUSE: "Pause",
};

export const CURRENCY_LABELS: Record<string, string> = {
  USD: "USD", INR: "INR", EUR: "EUR", GBP: "GBP", CHF: "CHF",
};

export const OUTREACH_METHODS = ["Email", "Call", "Meeting", "LinkedIn", "Intro"] as const;

export const TYPE_VALUES = Object.keys(TYPE_LABELS);
export const STAGE_VALUES = Object.keys(STAGE_LABELS);
export const STATUS_VALUES = Object.keys(STATUS_LABELS);
export const CURRENCY_VALUES = Object.keys(CURRENCY_LABELS);

