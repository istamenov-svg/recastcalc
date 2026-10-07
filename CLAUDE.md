# CLAUDE.md

Project conventions for recastcalc (Astro 5 + Tailwind, deployed on Cloudflare Pages via push to `main`).

## Writing style

- Never use em dashes in any content or copy. Use commas, semicolons, or parentheses instead.
- Spell out abbreviations on first use in guides, e.g. "private mortgage insurance (PMI)".

## Calculators

- Default rates come from `src/data/rates.json` (Freddie Mac PMMS, updated Thursdays). Never hardcode rates in components.
- Use plain-English labels and inline definitions. The target audience is less financially literate users.

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

## Deferred work

- Astro 5 to 7 and Tailwind 3 to 4 migration deferred (Oct 2026). These clear the remaining critical/high `npm audit` findings (astro, @astrojs/tailwind, tailwindcss, sharp, braces/micromatch/chokidar). Revisit if SSR, Pages Functions, or user-generated content is added, or if Astro 5 stops receiving fixes.
