# AGTT model breakdown

Plain-language walkthrough of every number the app computes. The one rule that governs everything:
nothing derived is ever stored. The database holds only raw inputs. Every score you see is
recomputed live from those inputs plus today's date, so a priority score is always current and can
never go stale in a cached column. The whole calculation lives in one place,
`src/lib/engine/priority.ts`, and is proven against the original sheet by `priority.test.ts`.

## Inputs the team fills in

Per opportunity, the raw scoring inputs are:

- Fit score, 1 to 10. How well the opportunity matches what OSG does.
- Strategic value, 1 to 10. What winning it unlocks beyond the money.
- Relationship strength, 0 to 5. How warm the existing connection is.
- Reporting burden, 1 to 5. How heavy the post-award reporting is.
- Competition level, 1 to 5. How crowded the field is.
- Time commitment hours. How long it takes to prepare and apply.
- Expected amount and currency. The headline figure.
- Probability, 0 to 1. Honest odds of winning.
- Full deadline. A real date, or blank if there is no fixed one.

## What the engine derives from those

Expected value in USD is the amount converted to USD, then multiplied by probability. A one million
rupee grant at 30 percent is worth its USD equivalent times 0.30.

Days to deadline is the full deadline minus today, in whole days. If there is no parseable deadline
it is simply blank, not zero.

Urgency score, 0 to 10, rises as the deadline gets closer. It is `10 / (1 + max(0, days))`. A
deadline today scores near 10, one far out scores near 0, and a past or missing deadline scores 0.
This last part is a deliberate fix: the old sheet accidentally scored a rolling or invite only
deadline as maximum urgency. See decisions-log 6.4.

Ease score, 0 to 10, is higher when less work is required. It is `10 * (1 - min(hours, 80) / 80)`.
Something that takes 80 hours or more scores 0, something instant scores 10. The original sheet
called this "Effort_Score", which read backwards, so it is renamed to Ease here. See
decisions-log 6.1.

Money score, 0 to 10, is a log scale on the USD amount: `log10(usd / 1000 + 1) * 3`, capped at 10.
Log scale so that the difference between a 10k and a 100k opportunity matters, but a 5M and a 10M one
do not swing the whole ranking. The `/ 1000` is a rescaling fix so the real 5k to 10M range actually
spreads across the 0 to 10 scale instead of everything pegging at the cap. See decisions-log 6.3.

Priority score is the weighted sum:

```
2.0 * fit
+ 1.2 * strategic value
+ 1.2 * relationship strength
+ 1.5 * money score
+ 1.0 * urgency score
+ 1.0 * ease score
- 0.8 * reporting burden
- 0.6 * competition level
```

Fit carries the most weight. Money, strategic value and relationship pull up. Burden and competition
pull down. The weights are the exact values from the live sheet and live as named, editable
constants in `src/lib/engine/constants.ts`, so they can be tuned without touching the logic.

Priority band is just a label on the score: 32 or above is High, 22 to 32 is Medium, below 22 is
Low. Thresholds are also in `constants.ts`.

## Currency

Amounts arrive in USD, INR, EUR, GBP or CHF. They are all converted to USD before anything is scored
or summed, using a static table in `src/lib/engine/currency.ts`. No live FX feed by design, this is
an internal tool. Update the rates in that file when they drift. The dashboard total and the
pipeline by stage totals are therefore real USD sums, not a meaningless mix of currencies.

## Dates

Every date field in the UI is a real date picker, so you cannot type free text into a date and break
the math. For the historical values imported from the sheet, a best effort parser handles the messy
cases (ISO, day-month-year, day/month/year, spreadsheet serials). Anything it cannot read is treated
as "no date", never an error, and the original text is kept alongside so nothing is silently lost.
The parser is in `src/lib/engine/dates.ts`, ported from the team's existing `AGTT_Refresh.gs`.

## Timeline

The Timeline page pulls five date columns from every opportunity (next action, full deadline, LOI
deadline, next follow-up, decision), stacks them into one list, keeps only those inside the lookahead
window, and sorts them by date. Non-date values are skipped. Each event is colour coded by the
opportunity's priority band. Logic is in `src/lib/timeline.ts`.

