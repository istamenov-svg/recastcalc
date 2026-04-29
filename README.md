# RecastCalc Logo Deployment

Deploys the horizontal SVG logo to the site header and replaces the placeholder favicon.

## Files in this package

```
public/
  favicon.svg            ← REPLACES existing placeholder. The amber square + R/C mark.
  logo.svg               ← NEW. Horizontal lockup with bar chart + wordmark.
src/
  components/
    Header.astro         ← REPLACES existing. Swaps inline text wordmark for <img src="/logo.svg">.
```

3 file changes total: 2 in `public/`, 1 in `src/components/`.

## What changes on the site

- **Header**: text "RecastCalc" replaced by the horizontal SVG logo. Sized to 32px tall (`h-8`) which matches the existing 16-unit header height with appropriate padding. Width auto-scales.
- **Favicon**: browser tabs, bookmarks, and mobile home-screen icons now show the amber-square + R/C mark instead of the placeholder.

## What stays identical

- All nav links, hover states, mobile menu, sticky positioning behavior. None of that touched.
- BaseLayout already references `/favicon.svg` (line 83), no change needed there.

## Apply

Web upload to GitHub, drag the `public/` and `src/` folders. 3 files modified. Commit, push, ~90 second deploy.

## Verified locally

`astro build` succeeded with these changes. All 18 pages still build clean. Logo and favicon both copy correctly into `dist/`.

## After deploy: 30-second verification

1. Hard refresh recastcalc.com (Ctrl+Shift+R / Cmd+Shift+R) to clear cached assets
2. Confirm the header shows the SVG logo instead of plain text
3. Look at the browser tab — should show the amber square favicon
4. On a mobile device or narrow window, confirm the logo doesn't get cut off

If the favicon still shows the old one in the tab, browsers cache favicons aggressively. Close all recastcalc.com tabs, reopen, sometimes need a full browser restart. Cloudflare's edge cache also takes 5-10 minutes to fully purge favicons.

## Honest caveat on the favicon

Per our prior conversation, I still think the R/C inside the amber square will be hard to read at 16x16 in the tab bar. The amber square will be unmistakable; the letters less so. Once it's live, look at it actually rendering in your browser tab. If the letters look like noise, you have two options:

1. Live with it. The amber square alone is recognizable and on-brand.
2. Iterate to a simplified version (just "C" alone, larger, no "R") — I can write that fix in 5 minutes if needed.

Either way, ship this version first and decide based on what you see in the wild.
