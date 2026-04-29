# RecastCalc Calculators Batch — Drop-In Package

Adds 4 production calculators (PMI Removal, Biweekly Payoff, ARM Reset, HELOC vs Refi) to the existing recastcalc Astro project. Each replaces an existing 15-line placeholder page.

## What's inside

```
src/
  scripts/
    mortgage-math.js            ← REPLACE existing file (extends with 4 new calculators)
  components/
    PMICalculator.astro         ← NEW
    BiweeklyCalculator.astro    ← NEW
    ARMResetCalculator.astro    ← NEW
    HELOCvsRefiCalculator.astro ← NEW
  pages/
    pmi-removal/index.astro     ← REPLACE existing 15-line placeholder
    biweekly-payoff/index.astro ← REPLACE existing placeholder
    arm-reset/index.astro       ← REPLACE existing placeholder
    heloc-vs-refi/index.astro   ← REPLACE existing placeholder
```

**This package replaces 5 existing files and adds 4 new ones.** Specifically:

- `src/scripts/mortgage-math.js` is replaced with an extended version (original ~210 lines, new ~640 lines). The original `calculateRecast` function is unchanged; new functions are appended below.
- The four `pages/[slug]/index.astro` files replace the 15-line placeholders that currently live there.
- The four component files in `src/components/` are entirely new.

## Step-by-step: how to add this to GitHub

### Web upload path

1. Open repo: https://github.com/istamenov-svg/recastcalc
2. Click **Add file → Upload files**
3. Drag the entire `src/` folder from this package
4. GitHub will show 5 modified files and 4 new files
5. **Verify** the modified files list shows: `mortgage-math.js`, and the 4 `index.astro` files. If anything else shows as modified, stop and review (something unexpected is happening)
6. Commit message: `Add 4 calculators (PMI, biweekly, ARM, HELOC) and extend math library`
7. Click **Commit changes**

Cloudflare Pages auto-builds and deploys within ~90 seconds.

### Local clone path

```bash
cd recastcalc
cp -r /path/to/this-package/src/* src/

git status  # verify only expected files changed
git add src/
git commit -m "Add 4 calculators (PMI, biweekly, ARM, HELOC) and extend math library"
git push
```

## Verification after deploy

After Cloudflare finishes deploying, visit each URL and confirm the calculator loads and computes:

1. https://recastcalc.com/pmi-removal/
2. https://recastcalc.com/biweekly-payoff/
3. https://recastcalc.com/arm-reset/
4. https://recastcalc.com/heloc-vs-refi/

Each should show a calculator with default inputs that produces a real result (not "$0" or "Loading..."). If any shows the placeholder version still, Cloudflare cached an old build; trigger a manual redeploy.

## Math validation

Each calculator's math was sanity-tested before delivery. Key sample results:

| Calculator | Test inputs | Expected result |
|---|---|---|
| PMI Removal | $400K balance on $450K home, $200/mo PMI, 6.5% rate, 28 yr remaining | Requesting at 80% saves $2,600 vs waiting for auto removal at 78% |
| Biweekly | $400K balance, 6.5%, 30 yr, $3,500 program fee | DIY 1/12 method saves identical $116K interest, but $3,500 fee is pure waste |
| ARM Reset | $400K balance, 4.5% original, 7.5% expected new, 5pp lifetime cap, 6.5% refi available, 5 yr hold | Refinance wins by $14,990 in this scenario |
| HELOC vs Refi | $300K at 4%, need $50K, HELOC 8.5%, refi 6.5%, 7 yr hold | HELOC wins by $47,653 (because keeping the 4% mortgage is huge) |

## Honest math callouts (the contrarian angles)

Each calculator surfaces a real insight most other sites bury:

- **PMI Removal**: "Most homeowners pay PMI longer than legally required because they don't request removal at 80% loan-to-value."
- **Biweekly**: "The biweekly program and free DIY method save identical interest. The program just charges you a fee for the privilege."
- **ARM Reset**: "The cap structure means worst-case payment is bounded. Many homeowners panic-refinance when math says hold."
- **HELOC vs Refi**: Genuine "it depends" with the dominant factor surfaced (existing rate vs market rate spread).

These callouts are dynamic; they update based on inputs. Some show contrarian advice ("hold the ARM"); others confirm conventional ("refinance wins"). The point is showing the real math, not forcing a contrarian narrative.

## What works

- All 4 calculators have:
  - Real-time recalculation as inputs change
  - Shareable URL (copy-link button encodes inputs as query params)
  - URL hydration (loading a URL with params pre-fills the form)
  - Print-friendly mode
  - Proper schema.org markup (WebApplication + BreadcrumbList + FAQPage)
  - 5-FAQ section per page (all schema-marked for rich snippets)
  - Related guides links (currently pointing to guides not yet drafted; see "future work")

## Existing-bug carryover

The existing `BaseLayout.astro` lines 47 and 80 reference "Ivan Manov" instead of "Ivan Stamenov". This package does not fix that bug (out of scope), but the new calculator pages use "Ivan Stamenov" correctly in their schema author fields. Fix the BaseLayout bug in a separate commit when convenient.

## Future work (not in this package)

The four calculator pages link to guides like `/guides/how-to-remove-pmi/` and `/guides/biweekly-mortgage-payments/`. Those guides don't exist yet. They're in the 24-guide content plan (Batches 2-4) and will get drafted in upcoming sessions.

The "related guides" links will return 404 until those guides are published. This is acceptable for now (the calculators stand on their own), but it's worth knowing. If 404 links bother you for SEO/UX reasons, you can either:

1. Comment out the related-guides section in each page until the guides exist
2. Replace the dead links with links to the 6 existing guides (where topically relevant)
3. Live with the 404s for ~2-3 weeks until the guides catch up

I'd recommend option 3. Internal 404s in the short term are not a meaningful SEO penalty; they get rediscovered automatically when the linked guide goes live.

## Troubleshooting

**Build fails after push** → most likely cause is mismatch between mortgage-math.js exports and component imports. Run `node -e "import('./src/scripts/mortgage-math.js').then(m => console.log(Object.keys(m)))"` locally to verify exports include: `calculatePMIRemoval`, `calculateBiweekly`, `calculateARMReset`, `calculateHelocVsRefi`, plus the originals.

**Calculator loads but shows blank values** → JavaScript is being blocked or failing silently. Check browser console; usually a missing input ID or a typo in `data-result` attribute name.

**Calculator math is wrong** → the math has been tested but not exhaustively. If you find a wrong number, capture the exact inputs and report back; I can fix the formula.

**Page renders but calculator doesn't update on input** → the vanilla JS event listeners may have failed to attach. Hard refresh (Ctrl+Shift+R / Cmd+Shift+R) and check browser console for errors.

## Total session output

- 4 calculator components (~1,130 lines total)
- 4 page wrappers (~1,030 lines total)
- 4 new math functions added to library (~430 lines)
- ~2,600 lines of new code total
