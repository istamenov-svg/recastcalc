# RecastCalc Guides Infrastructure — Drop-In Package

Adds the `/guides/` route, a content collection, and 6 ready-to-publish mortgage recast guides to the existing recastcalc Astro project.

## What's inside

```
src/
  content/
    config.ts                         ← NEW. Defines the guide schema.
    guides/                           ← Folder already exists in repo (empty). 6 markdown files go here.
      01-how-mortgage-recast-works.md
      02-recast-vs-refinance.md
      03-mortgage-recast-timeline.md
      04-mortgage-recast-fee.md
      05-should-i-recast-my-mortgage.md
      06-chase-mortgage-recast.md
  layouts/
    GuideLayout.astro                 ← NEW. Wraps each guide. Uses your existing BaseLayout.
  pages/
    guides/
      [slug].astro                    ← NEW. Dynamic route renders each guide.
      index.astro                     ← NEW. /guides/ listing page.
```

**Nothing in this package overwrites existing files.** Header/Footer/BaseLayout already in your repo are reused, not replaced. The Header already includes a "Guides" nav link, so no nav update needed.

## Step-by-step: how to add this to GitHub

### Easiest path: web upload

1. Open your repo: https://github.com/istamenov-svg/recastcalc
2. Click **Add file → Upload files**
3. Drag the entire `src/` folder from this package into the upload area
4. GitHub merges with your existing `src/` folder (it adds new files only, doesn't touch existing ones)
5. Commit message: `Add /guides/ infrastructure and 6 mortgage recast guides`
6. Click **Commit changes**

Cloudflare Pages auto-builds and deploys within ~90 seconds.

### Local clone path

```bash
cd recastcalc
# Copy the package's src/ over your existing src/
cp -r /path/to/this-package/src/* src/

git add src/
git commit -m "Add /guides/ infrastructure and 6 mortgage recast guides"
git push
```

## What happens after the push

1. Cloudflare Pages picks up the commit and triggers a build
2. Astro reads `src/content/config.ts`, validates frontmatter on the 6 guides
3. For each guide, generates `/guides/[slug]/`
4. Generates the `/guides/` listing page
5. Adds all new pages to the auto-generated sitemap
6. Live in 60 to 90 seconds

URLs that go live:

- https://recastcalc.com/guides/
- https://recastcalc.com/guides/how-mortgage-recast-works/
- https://recastcalc.com/guides/recast-vs-refinance/
- https://recastcalc.com/guides/mortgage-recast-timeline/
- https://recastcalc.com/guides/mortgage-recast-fee/
- https://recastcalc.com/guides/should-i-recast-my-mortgage/
- https://recastcalc.com/guides/chase-mortgage-recast/

## After live: GSC indexing

Sitemap auto-updates on next Astro build, so `https://recastcalc.com/sitemap-index.xml` will include the new pages within minutes. GSC will pick them up on its next crawl (24 to 72 hours).

For faster indexing, manually request each new URL in GSC:

1. Open Google Search Console
2. Paste the full guide URL into the top search bar
3. Click **Request indexing**

GSC limits to ~10 manual requests per day. Don't waste them on low-priority pages. The two highest-priority for first indexing pass are `/guides/recast-vs-refinance/` and `/guides/how-mortgage-recast-works/` (the highest-volume keywords).

## Adding more guides going forward

Same pattern:

1. Drop a new `.md` file into `src/content/guides/`
2. Match the frontmatter shape from the 6 existing files (slug, pubDate, etc.)
3. Set `draft: true` in frontmatter while editing
4. When ready to publish, change to `draft: false`
5. Commit and push, live in 90 seconds

The schema in `config.ts` will reject any guide with malformed frontmatter and the Cloudflare build will fail with a clear error message pointing to the file. That's a feature, not a bug — it prevents broken pages from going live.

## About the design

`GuideLayout.astro` uses your existing `BaseLayout` (which has Header/Footer/SEO meta) and adds a `.guide-prose` styled div for the markdown content. The styling matches your site's design tokens: Fraunces serif for headings, IBM Plex Sans for body, accent amber for links and the featured-snippet callout box.

No external Tailwind plugin needed — typography is hand-styled in inline CSS within the layout. This trades off ~150 lines of CSS for one less npm dependency. Worth it for a static utility site.

## Reviewer placeholder

All 6 guides have `reviewer: "TBD"` in frontmatter. The `GuideLayout` is configured to **hide** the reviewer line entirely when the value is "TBD". Once you find a contributing reviewer (mortgage broker), update the frontmatter to:

```yaml
reviewer: "Jane Smith, NMLS #123456"
```

The reviewer line will appear automatically. No code changes needed.

## Existing-bug flag (separate from this work)

While building this, I noticed your existing `src/layouts/BaseLayout.astro` references the author as **"Ivan Manov"** (lines 47 and 80). Your actual name is **Ivan Stamenov**. Worth a quick fix in a separate commit. The new guide layout uses "Ivan Stamenov" correctly.

## Troubleshooting

**Build fails with "Cannot find module 'astro:content'"** → unlikely; your package.json already has Astro 5.1+. If it does happen, run `npm install` to refresh dependencies.

**Frontmatter validation error on a guide** → the build error will name the file and the bad field. Most common cause is `pubDate` not in ISO format.

**Markdown renders without styling** → the `.guide-prose` class in GuideLayout's inline `<style is:global>` block should cover this. If it doesn't, the CSS isn't loading. Check the browser dev tools network tab.

**404 on a guide page after deployment** → Cloudflare may have cached an old build. Trigger a manual redeploy in the Cloudflare dashboard, or push an empty commit to force rebuild: `git commit --allow-empty -m "force rebuild" && git push`.

## What I deliberately didn't do

- **Did NOT install `@tailwindcss/typography`.** Hand-styled typography in CSS is faster, smaller, and has no version-bump risk. If you want it later, the inline styles can be swapped for `prose` classes.
- **Did NOT modify your existing Header.astro.** It already has a Guides link.
- **Did NOT modify your existing homepage.** The Guides nav link from Header is enough; you can add a "Recent guides" section to the homepage in a separate commit if you want.
- **Did NOT add OG images for guides.** Each guide will use the default `og-default.png` from your existing setup. Worth generating per-guide OG images later, but not blocking for launch.
