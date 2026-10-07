# CLAUDE.md

Project conventions for recastcalc (Astro 5 + Tailwind, deployed on Cloudflare Pages via push to `main`).

## Writing style

- Never use em dashes in any content or copy. Use commas, semicolons, or parentheses instead.
- Spell out abbreviations on first use in guides, e.g. "private mortgage insurance (PMI)".

## Calculators

- Default rates come from `src/data/rates.json`. Never hardcode rates in components.
- `30yr_fixed` and `15yr_fixed` (Freddie Mac PMMS) and `heloc` (prime rate + 1.0, both via FRED) update automatically every Thursday at 20:00 UTC through `.github/workflows/update-rates.yml`, which commits to `main`. The job fails without committing if a value is outside 2 to 15, moves more than 1.0 point in a week, or the data is older than 14 days.
- `5_1_arm` and `pmi_typical` are manual. Review `5_1_arm` at least every 90 days and set `armReviewedAt`; the weekly job emits a warning (but still updates the other rates) when it is missing or older than 90 days.
- Never hardcode current market rates in prose. Use example framing ("assume rates are 6.5%") or point to the reference rate banner.
- Verified historical figures are not current rates and may be stated with their date (e.g. "peaked at 7.79% in October 2023"). Verify them against source data first (see Fact-checking) and keep them in the past tense.
- Use plain-English labels and inline definitions. The target audience is less financially literate users.

## Page titles

- No years in page titles (they go stale). Every rendered title, including the " | RecastCalc" suffix the layout appends, stays under 70 characters.
- For guides, `title` is also the H1, breadcrumb, and structured-data headline.

## Ads

- AdSense publisher ID: `ca-pub-1634869400564839`. `public/ads.txt` holds the matching line (`google.com, pub-1634869400564839, DIRECT, f08c47fec0942fa0`), served at `https://recastcalc.com/ads.txt`.
- The AdSense script loads in `<head>` on every page (`src/layouts/BaseLayout.astro`), independent of `ADS_ENABLED`, so Google can review the site.
- Ad units stay off until approval: `src/components/AdSlot.astro` renders nothing unless the build-time env variable `ADS_ENABLED` is `true` (default off). After approval: replace `TODO_SLOT_ID` with real slot IDs, uncomment the `<ins>` block and delete the dashed placeholder `<div>` in `AdSlot.astro`, set `ADS_ENABLED=true` in Cloudflare Pages (Settings, Environment variables, Production), then redeploy.
- Keep Auto ads off in the AdSense dashboard unless intended: with the script on every page, Auto ads would place ads without `AdSlot`.

## Analytics

- Analytics are Cloudflare Web Analytics, enabled through Cloudflare's automatic setup: Cloudflare injects the script at the edge, so it is not in this repo. Confirmed active in the Cloudflare dashboard (October 2026). It is cookieless. Do not add another analytics script without updating the privacy policy.

## Affiliate links

- The site is not enrolled in any affiliate program yet. Calculator CTAs link to plain partner URLs (currently `https://www.lendingtree.com/`) through `src/components/AffiliateCTA.astro`, which sets `rel="sponsored noopener"`.
- Swap in affiliate tracking links only after enrollment is approved; CJ tracking links will replace the plain LendingTree URLs. Name partners in the privacy policy only after enrollment.
- Revenue and affiliate copy (footer, homepage, /about/, /terms/, /privacy/) uses "may" framing ("we may earn a commission", "may be affiliate links") so it stays accurate whether or not ads and affiliates are active. Keep that framing in new copy.
- When the CJ tracking links go in, restore the partner label by passing `partner="LendingTree"` to `AffiliateCTA` (it renders "Sponsored · LendingTree").

## Guides

- Guides live in `src/content/guides/` as markdown with frontmatter:
  - `title`
  - `description`
  - `urlSlug`
  - `pubDate`
  - `updatedDate`
  - `author: Ivan Stamenov`
  - `pillar`
  - `targetKeyword`
  - `reviewer` (string; currently `TBD` on all guides)
  - `secondaryKeywords` (YAML list of strings)
  - `schema` (YAML list of structured-data types: `Article`, `HowTo`, `FAQPage`; every guide includes `Article`)
  - `tier` (number, `1` or `2`; optional in `src/content/config.ts` but set on every current guide)
- New pillars must be added to `pillarOrder` and `pillarLabels` in `src/pages/guides/index.astro`.

## Build and commit workflow

- Production deploys from `main` only. Side branches do not go live. After a change is approved, commit it, merge it into `main`, and push `main`.
- Always run `npx astro build` before committing. Never push a failing build.
- Show the diff and wait for approval before every commit and push.

## Modified dates

- Modified dates are hardcoded, never the build date (`new Date()`). Guides use `updatedDate` in frontmatter; every other page uses its entry in `src/data/page-dates.json`. These drive `article:modified_time`, the visible "Last updated" text, and the sitemap `lastmod`.
- Update a page's date by hand only when its content meaningfully changes. Meta descriptions, punctuation fixes, and the automated weekly rate updates do not count.
- When adding a page, add its path to `src/data/page-dates.json`.

## IndexNow

- `.github/workflows/indexnow.yml` submits every sitemap URL to IndexNow after each push to `main` and after each weekly rate commit. It waits until `https://recastcalc.com/version.txt` (built from Cloudflare's `CF_PAGES_COMMIT_SHA`) shows the new commit, then fails on any response other than 200 or 202.
- The key file is `public/<key>.txt`. Do not rename or delete it.

## Fact-checking

- `.github/workflows/fred-lookup.yml` (manual dispatch: series ID, start date, end date) prints FRED observations and the range's max and min to the job log. Use it to verify historical rate figures before publishing them; this container cannot reach FRED. It is read-only and never commits.

## Known gaps

- `GuideLayout.astro` ignores the frontmatter `schema` list and always emits only `Article` structured data, so no guide emits `FAQPage` even when its frontmatter lists it.

## Deferred work

- Astro 5 to 7 and Tailwind 3 to 4 migration deferred (Oct 2026). These clear the remaining critical/high `npm audit` findings (astro, @astrojs/tailwind, tailwindcss, sharp, braces/micromatch/chokidar). Revisit if SSR, Pages Functions, or user-generated content is added, or if Astro 5 stops receiving fixes.
