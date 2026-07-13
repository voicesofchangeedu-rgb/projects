// Best-effort date coercion, ported from AGTT_Refresh.gs coerceDate_().
// Order: Date object -> Excel/Sheets serial -> YYYY-MM-DD -> DD-MM-YYYY -> DD/MM/YYYY.
// Anything else returns null ("no date"), NEVER an error. See decisions-log.md 6.2.
//
// Note DD-MM / DD/MM ordering is assumed (matches the sheet's data, e.g. "20/05/2026" = 20 May).
// Ambiguous values like "16-03-2026" are read day-first.

export function coerceDate(input: unknown): Date | null {
  if (input == null || input === "") return null;
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input;

  // Excel/Sheets serial number (days since 1899-12-30)
  if (typeof input === "number" && isFinite(input)) {
    if (input > 20000 && input < 80000) {
      const ms = (input - 25569) * 86_400_000;
      const d = new Date(ms);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  }

  const raw = String(input).trim();
  if (!raw) return null;

  // ISO YYYY-MM-DD (optionally with time)
  let m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return build(+m[1], +m[2], +m[3]);

  // DD-MM-YYYY
  m = raw.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (m) return build(+m[3], +m[2], +m[1]);

  // DD/MM/YYYY
  m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return build(+m[3], +m[2], +m[1]);

  return null; // "N/A (invite-only)", "Rolling / By referral only", "16-19 April 2026", etc.
}

function build(y: number, month1to12: number, day: number): Date | null {
  if (month1to12 < 1 || month1to12 > 12 || day < 1 || day > 31) return null;
  const d = new Date(Date.UTC(y, month1to12 - 1, day));
  return isNaN(d.getTime()) ? null : d;
}

// Whole-day difference target - today, using UTC midnights to avoid DST/tz drift.
export function daysBetween(target: Date, today: Date): number {
  const a = Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate());
  const b = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.round((a - b) / 86_400_000);
}

