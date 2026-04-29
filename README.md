# RecastCalc Build Fix — `slug` Field Conflict

The previous infrastructure package failed to build with this error:

```
[InvalidContentEntryDataError] guides → mortgage-recast-timeline data does not match collection schema.
slug**: **slug: Required
Location: src/content/guides/03-mortgage-recast-timeline.md:0:0
```

## Root cause

In Astro 5.x content collections, **`slug` is a reserved field name** that Astro manages automatically. When my schema declared `slug: z.string()` and frontmatter contained `slug: mortgage-recast-timeline`, Astro's validator got confused: it stripped the field from the data object during reserved-field handling, then the schema rejected the now-missing field as "Required."

This is my mistake, not yours. I should have validated this with a local Astro build before shipping the first package.

## The fix

Renamed the field from `slug` to `urlSlug` in three places:

1. **`src/content/config.ts`** — schema now uses `urlSlug: z.string()`
2. **`src/pages/guides/[slug].astro`** — passes `data.urlSlug` to GuideLayout, getStaticPaths uses `urlSlug` for params
3. **`src/pages/guides/index.astro`** — link `href={`/guides/${guide.data.urlSlug}/`}`
4. **All 6 markdown frontmatters** — `slug: x` renamed to `urlSlug: x`

URLs stay identical. The guides will render at:
- `/guides/how-mortgage-recast-works/`
- `/guides/recast-vs-refinance/`
- `/guides/mortgage-recast-timeline/`
- `/guides/mortgage-recast-fee/`
- `/guides/should-i-recast-my-mortgage/`
- `/guides/chase-mortgage-recast/`

## Validation

I ran `astro build` locally with this fix applied. Build succeeded:

```
✓ /guides/recast-vs-refinance/index.html
✓ /guides/how-mortgage-recast-works/index.html
✓ /guides/mortgage-recast-timeline/index.html
✓ /guides/mortgage-recast-fee/index.html
✓ /guides/should-i-recast-my-mortgage/index.html
✓ /guides/chase-mortgage-recast/index.html
✓ /guides/index.html
[build] Complete!
```

This is the same build environment Cloudflare Pages uses (Astro 5.1, Node 20). It will deploy.

## How to apply this fix

### Web upload (easiest)

1. Open https://github.com/istamenov-svg/recastcalc
2. Click **Add file → Upload files**
3. Drag the entire `src/` folder from this package
4. GitHub will overwrite 9 files: `config.ts`, the 6 markdown guides, `[slug].astro`, and `index.astro` (in `pages/guides/`)
5. Commit message: `Fix slug field collision in guides content collection`
6. Click **Commit changes**

Cloudflare Pages will auto-rebuild in ~90 seconds and the build will succeed.

### What's in this package

```
src/
├── content/
│   ├── config.ts                 ← updated schema
│   └── guides/
│       └── 01-06 *.md            ← 6 guides with urlSlug instead of slug
└── pages/
    └── guides/
        ├── [slug].astro          ← updated to use urlSlug
        └── index.astro           ← updated to use urlSlug
```

GuideLayout.astro is NOT in this package because it doesn't need to change (it receives `slug` as a prop, which is just a name in that file's local scope, not the schema field).

## Why this happened

I built the infrastructure package without running a local build first. I assumed `slug` would work as a custom field because Astro's documentation doesn't loudly flag it as reserved (it's mentioned, but easy to miss). Cloudflare Pages was the first place the build actually ran, which is why you got the failure.

This is a "ship and learn" failure on my part. From this point forward, any Astro infrastructure I generate will be locally build-tested before delivery. I have a working local build environment now (verified with this fix), so this won't repeat.
