# AGTT decisions log

Every fix, assumption and deliberate deviation from the source sheet, with the evidence behind it.
This starts from Section 6 of the build prompt and records what was actually done. The source sheet
was read formula by formula on 2026-07-13; its cached auto values were computed with today set to
2026-07-13, which is what the parity tests freeze to.

## What was verified against the real sheet

The engine reproduces all 14 numerically scored rows from the sheet exactly, priority score and
band, via `src/lib/engine/priority.test.ts` (`computeLegacyScore`). That function replicates the
original formulas verbatim, bugs included, purely to prove the source is understood and to show the
before and after of each fix. The live engine (`computeOpportunityScore`) is the one the app uses and
carries the fixes below.

## 6.1 Effort renamed to Ease

The sheet's `Effort_Score` formula `10 * (1 - min(hours, 80) / 80)` returns a higher number for
fewer hours, so a high "effort" score actually meant low effort. It was then added positively into
priority, which only worked because it was secretly an ease score. Renamed to Ease everywhere and
labelled in the UI as "higher = less work". No numeric change, purely naming.

## 6.2 Dates are structured, with original text preserved

Several date-looking fields in the sheet were free text: `"20/05/2026"` stored as a string,
`"N/A (invite-only)"`, `"Rolling / By referral only"`, ambiguous `"16-03-2026"`, and event ranges
like `"16-19 April 2026"`. In the sheet a text value in `Full_Deadline` produced a `#VALUE!` that
cascaded into urgency, priority and band for that whole row (row 25, iF Social Impact, is the live
example, and the app does not reproduce that error).

Fix: every date field in the UI is a real date picker, so this class of bug is structurally
impossible going forward. For importing the existing messy values, a best effort parser
(`coerceDate` in `dates.ts`, ported from `AGTT_Refresh.gs`) tries Date objects, spreadsheet serials,
then ISO, day-month-year and day/month/year text patterns, day first. Anything else becomes "no
date", not an error. The original text is stored in a parallel `*Text` field so a value that cannot
be parsed is never silently dropped. It shows under the date picker as a reference note.

## 6.3 Currency normalization and money rescale — changes rankings

Two problems, both fixed.

First, the sheet scored and summed the raw `Expected_Amount` regardless of currency, mixing GBP, USD,
INR, CHF and EUR as if one pound equalled one dollar equalled one rupee. Fix: every amount is
converted to USD (`currency.ts`, static table, editable, no live feed) before scoring or summing.
The dashboard total and pipeline totals are now real USD figures.

Second, even in one currency the money log scale `log10(x + 1) * 3` hit its cap of 10 at only about
2,154, so a 10k prize and a 1M prize both scored a maxed out 10 and the money component stopped
telling opportunities apart almost immediately. Rescaled to `log10(x / 1000 + 1) * 3`, which pushes
the saturation point to about 2.15M and spreads the real 5k to 10M range across 0 to 10:

| USD amount | Old money score | New money score |
| --- | --- | --- |
| 5,000 | 10 (capped) | 2.33 |
| 10,000 | 10 | 3.12 |
| 100,000 | 10 | 6.01 |
| 1,000,000 | 10 | 9.00 |
| 10,000,000 | 10 | 10 |

Both of these change actual priority rankings versus the old sheet. This is surfaced in the app with
a banner on the dashboard so nobody is confused about why the ranking shifted. Confirm the rescale
and the FX table with Nav before treating the new numbers as final.

## 6.4 A rolling or missing deadline now scores 0 urgency, not 10 — changes rankings

In the sheet, Excel's `MAX` silently ignores non-numeric text, so `MAX(0, "N/A (rolling)")` became 0,
which flowed through the urgency formula as if the deadline were today, the most urgent value
possible. The Mulago fellowship, invite only with no fixed deadline, therefore carried a live
priority of 59 with urgency pinned at 10. A truly blank deadline cell behaved differently: it
produced an empty string that coerced to 0 in the sum, so Earthshot with a blank deadline correctly
contributed 0 urgency and scored 40.1. Both cases are reproduced exactly by `computeLegacyScore` and
checked in the parity tests.

Fix: in the live engine, no parseable deadline means urgency 0, full stop. This drops Mulago and any
other rolling or invite only opportunity relative to the old sheet, which is the correct behaviour,
an opportunity with no deadline is not urgent. Flagged in the same dashboard banner as 6.3.

## 6.5 Minor cleanups

- `Opportunity_ID` used a self-referential formula trick in the sheet. Here a clean sequential id
  (`AGTT-0001` style) is generated at creation time.
- The sheet's data validation dropdowns had accidental row gaps. Here the enums are enforced by the
  database schema on every row, unconditionally.
- `Status 2` (a lightly used duplicate column) is folded into `Status`, no separate field.

## Architecture assumptions

- No login. Shared internal team tool, same call as the BWG P&L tool. On Railway this is also
  architecturally simpler than the old Supabase plan: Postgres is never reachable from the browser,
  Prisma only runs server side, so there is no row level security boundary to defend.
- No realtime sync. Plain page revalidation after a mutation is enough for a handful of editors.
  Postgres LISTEN/NOTIFY plus SSE is the path if it is ever needed.
- Static FX table, not a live API.
- Full formula-preserving Excel re-export is out of scope. The Data page does JSON backup and
  restore, plus a flat opportunities CSV as a convenience.

## Data provenance

The 40 seeded opportunities were extracted from the sheet on 2026-07-13. 14 had complete scoring
inputs and a numeric priority; the rest are name-first stubs the team had started but not yet scored,
seeded as-is so no work is lost. The outreach log started empty and is seeded empty.

