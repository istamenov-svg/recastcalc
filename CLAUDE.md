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
- Use plain-English labels and inline definitions. The target audience is less financially literate users.

## Page titles

- No years in page titles (they go stale). Every rendered title, including the " | RecastCalc" suffix the layout appends, stays under 70 characters.
- For guides, `title` is also the H1, breadcrumb, and structured-data headline.

## Ads

- `src/components/AdSlot.astro` renders nothing unless the build-time env variable `ADS_ENABLED` is `true` (default off). To turn ads on: set `ADS_ENABLED=true` in Cloudflare Pages (Settings, Environment variables, Production), in `AdSlot.astro` uncomment the AdSense `<ins>` block and delete the dashed placeholder `<div>`, uncomment the AdSense script in `src/layouts/BaseLayout.astro` with the real publisher and slot IDs, then redeploy.

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

## Deferred work

- Astro 5 to 7 and Tailwind 3 to 4 migration deferred (Oct 2026). These clear the remaining critical/high `npm audit` findings (astro, @astrojs/tailwind, tailwindcss, sharp, braces/micromatch/chokidar). Revisit if SSR, Pages Functions, or user-generated content is added, or if Astro 5 stops receiving fixes.
