# Weekly Rate Update Procedure

The reference rates shown on every calculator page come from `src/data/rates.json`. They need to be updated every Thursday after Freddie Mac publishes the PMMS.

## Schedule

- **Source publishes:** Every Thursday at 12:00 PM Eastern Time
- **Your update window:** Thursday afternoon or Friday morning
- **If you miss a week:** No big deal. Rate movement week-to-week is usually under 25 bps. The data stays within your 50 bps tolerance even if you skip occasionally.

## Steps (~2 minutes)

1. Open https://www.freddiemac.com/pmms in a browser
2. Note these four numbers from the current week:
   - 30-year fixed-rate mortgage (the headline number)
   - 15-year fixed-rate mortgage
   - Last week's 30-year fixed (shown next to current rate)
   - Direction (up or down vs. prior week)
3. Open `src/data/rates.json` in GitHub
4. Click the pencil icon to edit
5. Update these fields:
   - `asOf` — today's PMMS publish date (YYYY-MM-DD format)
   - `rates.30yr_fixed` — current 30-year rate
   - `rates.15yr_fixed` — current 15-year rate
   - `trend.30yr_fixed_prior_week` — prior week's rate
   - `trend.direction_weekly` — `"up"` or `"down"`
6. Commit with message: `Update PMMS rates: week of [date]`
7. Cloudflare auto-deploys in ~90 seconds

## Rates that don't update from PMMS

- **5/1 ARM:** PMMS no longer publishes this regularly. Use a sensible estimate based on 30-year fixed (typically 30-year fixed minus 0.50% to plus 0.30%). Update less frequently — monthly is fine.
- **HELOC:** Usually prime rate plus 1-2%. Check Bankrate or Mortgage News Daily monthly. Currently around 8.50%.
- **PMI typical rate:** Industry average, very stable. Roughly 0.75% annually. Update if you see meaningful market shift (rare).

## When to break the schedule

If 30-year fixed moves more than 50 bps in a single week (rare; happens during major Fed announcements), update immediately. This keeps you within the ±50 bps tolerance you committed to.

## Setting a calendar reminder

Recommended: a Google Calendar recurring event for Thursdays at 1:00 PM ET, "Update RecastCalc PMMS rates", linked to https://www.freddiemac.com/pmms.

## Future automation (later)

A GitHub Action could scrape PMMS weekly and submit a PR automatically. Not needed at v1 — the manual process takes 2 minutes and lets you sanity-check the numbers before they go live. Consider automation if rate updates become a chore (probably never; they're already trivial).
