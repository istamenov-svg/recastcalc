# Self-Host Fonts (Performance Fix)

Fixes the PageSpeed report showing 89/100 mobile performance, caused by Google Fonts blocking page render.

## What changes

| Before | After |
|---|---|
| Fonts load from `fonts.googleapis.com` (Google CDN) | Fonts served from your domain via Cloudflare edge |
| ~750ms font load time | ~50-150ms font load time |
| Render-blocking on every page load | Non-blocking with preload hints for critical fonts |
| LCP (Largest Contentful Paint): 2.9s | Expected LCP: ~1.5-1.8s |
| CLS (Layout Shift): 0.080 | Expected CLS: near zero |
| Performance score: 89 | Expected score: 96-98 |

## Files in this package

```
public/
  fonts/
    fraunces-v38-latin-regular.woff2          18 KB
    fraunces-v38-latin-600.woff2              18 KB  ← PRELOADED (H1 headings)
    ibm-plex-sans-v23-latin-regular.woff2     23 KB  ← PRELOADED (body text)
    ibm-plex-sans-v23-latin-600.woff2         24 KB
    ibm-plex-mono-v20-latin-regular.woff2     15 KB
src/
  layouts/
    BaseLayout.astro                          ← REPLACED. Removed Google Fonts <link>, added preload hints
  styles/
    global.css                                ← REPLACED. Added @font-face declarations at top
```

5 new font files in `public/fonts/`, 2 modified files in `src/`.

## What got removed

The old BaseLayout had this:
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces..." />
```

That's 3 lines and 2 cross-origin connections gone. Replaced with 2 preload hints pointing to your own domain.

## What got added

In `BaseLayout.astro`:
```html
<link rel="preload" href="/fonts/fraunces-v38-latin-600.woff2" as="font" type="font/woff2" crossorigin />
<link rel="preload" href="/fonts/ibm-plex-sans-v23-latin-regular.woff2" as="font" type="font/woff2" crossorigin />
```

In `global.css`, 5 @font-face declarations at the top of the file (before `@tailwind base`). Each uses `font-display: swap` so text renders immediately with system fallback while the custom font loads.

## Why only 2 fonts are preloaded

You have 5 font files. Preloading all 5 would force the browser to download every font before rendering anything, which is worse than letting the browser load them on demand.

The 2 preloaded fonts cover the LCP element (H1 in Fraunces 600) and the bulk of body text (IBM Plex Sans 400). Other weights (Plex Sans 600 for bold text, Plex Mono for calculator readouts, Fraunces 400) load via `@font-face` only when the browser actually encounters them in the rendered CSS. This is the right tradeoff between fast first paint and avoiding wasted bandwidth.

## Apply

Web upload to GitHub. 7 file changes:
- 5 new files in `public/fonts/`
- `src/layouts/BaseLayout.astro` modified
- `src/styles/global.css` modified

Commit message: `Self-host fonts to fix render-blocking and improve LCP`

## Verified locally

`astro build` succeeded. All 18 pages still build. All 5 fonts copy into `dist/fonts/` correctly. Both preload tags present in built HTML, no Google Fonts references remain.

## After deploy: re-run PageSpeed

Wait 2-3 minutes after Cloudflare finishes deploying (their edge cache needs to populate the new font files), then re-run PageSpeed Insights on https://recastcalc.com.

Expected results:
- Performance score: 89 → 96+ (likely green)
- LCP: 2.9s → ~1.5-1.8s
- CLS: 0.080 → near zero
- "Render blocking requests" warning: gone
- "Forced reflow" warning: still there (it's a separate issue, 31ms, ignorable)
- "Unsized image element" on logo: still there (separate fix below)

## Side issue: logo unsized image warning

PageSpeed flagged the logo image as "unsized" because Tailwind's `w-auto` class overrides the inline width. To fix, change Header.astro line:

```html
class="h-8 w-auto"
```

to:

```html
class="h-8 w-[180px]"
```

Not included in this package because it's a separate issue and the visual difference is minimal. Apply if you want a 100/100 audit; skip if you don't care.
