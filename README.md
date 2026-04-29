# Reference Rate Banner — Weekly PMMS Updates

Adds a "reference rate" strip to the top of every calculator page, showing the current Freddie Mac PMMS rate. Calculator default rate inputs now also pull from this same data file, so when 30-year goes to 8%, defaults reflect that automatically.

## What this does

1. **Visible rate banner** at the top of each calculator page showing the current rate, source (Freddie Mac PMMS), date of survey, and trend direction
2. **Dynamic default rate values** in calculator forms — no more hardcoded 6.5% when actual rates are different
3. **Single source of truth** in `src/data/rates.json` for all rate references across the site

## Tolerance commitment

Rates are accurate to within **±50 basis points** (0.50%) of the true market rate, assuming weekly Thursday updates following the procedure in `scripts/update-rates.md`. Rate movement week-to-week is rarely more than 25 bps, so even a missed week stays within tolerance.

## Files in this package

```
src/
  data/
    rates.json                          ← NEW. Single source of truth for all rates.
  components/
    RateBanner.astro                    ← NEW. The visible rate strip component.
    RecastCalculator.astro              ← MODIFIED. Default rate now pulls from rates.json.
    PMICalculator.astro                 ← MODIFIED. Same.
    BiweeklyCalculator.astro            ← MODIFIED. Same.
    ARMResetCalculator.astro            ← MODIFIED. Same.
    HELOCvsRefiCalculator.astro         ← MODIFIED. Same.
  pages/
    recast/index.astro                  ← MODIFIED. Imports + uses RateBanner.
    pmi-removal/index.astro             ← MODIFIED. Same.
    biweekly-payoff/index.astro         ← MODIFIED. Same.
    arm-reset/index.astro               ← MODIFIED. Same.
    heloc-vs-refi/index.astro           ← MODIFIED. Same.
scripts/
  update-rates.md                       ← NEW. Weekly Thursday update procedure.
```

12 files: 1 new data file, 1 new component, 5 modified components, 5 modified pages, 1 new docs file.

## Initial rate values (April 23, 2026 PMMS)

- 30-year fixed: 6.23%
- 15-year fixed: 5.58%
- 5/1 ARM: 6.50% (estimated; PMMS no longer regularly publishes ARMs)
- HELOC: 8.50% (industry estimate)
- PMI typical: 0.75%

## Variant logic per calculator

Each rate banner shows the rate most relevant to that calculator:

| Calculator | Banner shows | Why |
|---|---|---|
| Recast | 30-year fixed | The rate users would compare recasting against (refinance) |
| PMI Removal | PMI typical (0.75%) | The rate that affects the user's PMI cost |
| Biweekly Payoff | 30-year fixed | Most users running this have a 30-year loan |
| ARM Reset | 5/1 ARM | The expected new rate at reset |
| HELOC vs Refi | HELOC | The newer/changing rate; refi rate is implied by the calculation |

## Weekly update workflow (2 minutes)

Every Thursday after 12pm ET, edit `src/data/rates.json` directly in GitHub. Update 5 fields, commit, Cloudflare deploys in ~90 seconds. Full instructions in `scripts/update-rates.md`.

If you skip a week, no big deal — rate movement rarely exceeds 25 bps weekly. You stay within ±50 bps tolerance even with sporadic updates.

## Verified locally

- `astro build` succeeds
- All 18 pages built clean
- RateBanner renders correctly with all 5 variants on all 5 calculator pages
- Calculator default inputs show **6.23%** (current 30-year) instead of hardcoded **6.5%**
- HELOC page shows 8.50%, ARM page shows 6.50%, etc.

## Apply

Web upload the `src/` and `scripts/` folders to GitHub. 12 file changes (most are modifications, not new files). Commit: `Add reference rate banner from Freddie Mac PMMS, dynamic calculator defaults`.

## Set a recurring calendar reminder

Recommended: Google Calendar Thursday 1:00 PM ET, "Update RecastCalc PMMS rates", linked to https://www.freddiemac.com/pmms. The 2-minute task fits in any week.
