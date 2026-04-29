# Name Fix: Manov → Stamenov

Replaces "Ivan Manov" (typo) with "Ivan Stamenov" (correct) across all source files.

## Files changed

- `src/layouts/BaseLayout.astro` — schema.org founder name + article:author meta tag
- `src/pages/about/index.astro` — Person schema + page description + body H1
- `src/pages/recast/index.astro` — author schema + visible byline
- `src/pages/terms/index.astro` — legal operator changed to **"Marcon Groupe LLC"** instead of personal name (cleaner liability framing; LLC holds the shield)

4 files, 9 references replaced. All `dist/` files regenerate from these on next build.

## Why this matters

1. **Reddit credibility.** Pattern 1 posts are built on transparent self-disclosure. The first commenter who looks at the site will see the byline. If your Reddit account says "Ivan Stamenov" but the site author is "Ivan Manov," the post collapses.

2. **Schema.org structured data.** The wrong name is in JSON-LD that Google indexes. Once those pages get crawled, your name in search results = wrong name. Reversing this later means asking Google to reindex 13 pages, which takes weeks.

3. **Legal cleanliness.** The terms page now correctly names the LLC as the operator (instead of an individual), which is the actual entity holding the liability shield.

## Verified locally

- `astro build` succeeded after fix
- Zero "Manov" references in any built output
- All 18 pages rebuild correctly

## Apply

Web upload to GitHub. 4 file changes. Commit: `Fix author name (Manov → Stamenov) and use LLC in terms`. ~90 second Cloudflare deploy.

After deploy, the schema/byline name will be correct on every page.
