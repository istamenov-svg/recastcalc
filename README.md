# Buy vs Rent — Chart Fixes

Three issues from the deployed buy-vs-rent calculator chart, all fixed in this patch.

## Issues found

1. **Y-axis labels truncated** — left edge of "$59,886" was cut off at viewport boundary
2. **Color names instead of color swatches** in the legend ("Green = ...", "Orange = ...") forced the eye to translate; many users would just see two colored lines and no key
3. **Y-axis labels too verbose** — "$59,886" took horizontal space that wasn't there to begin with

## Fixes

### 1. Asymmetric padding

Changed from uniform `pad = 40` to per-side padding:
- `padLeft = 68` (room for compact y-axis labels and breathing room)
- `padTop = 30`
- `padRight = 20`
- `padBottom = 40`

This gives the y-axis enough room and tightens the right side which had wasted space.

### 2. Visual swatch legend

Replaced:
> Green = wealth from buying. Orange = wealth from renting and investing. Where they cross is your break-even point.

With colored swatches inline:
- 🟩 Wealth from buying
- 🟧 Wealth from renting & investing

Each swatch is a small colored bar (`<span>` with inline-styled background) directly preceding the label. Eye reads it instantly.

### 3. Compact y-axis formatter

New `fmtY()` helper for y-axis labels only:
- $59,886 → **$60K**
- $1,250,000 → **$1.3M**
- $250 → **$250**

Body of result tables still uses full `formatCurrency()` (so the buyer's home equity still shows "$184,567" not "$185K"). Only the chart y-axis is compact.

## Files in this package

```
src/
  components/
    BuyVsRentCalculator.astro    MODIFIED (chart rendering only; calculator logic unchanged)
```

1 file change.

## Verified locally

- `astro build` succeeded
- Swatches render in built HTML (#10b981 green, #b45309 amber)
- Legend text reads "Wealth from buying" / "Wealth from renting & investing"
- All previous `pad` references migrated to the new asymmetric model

## Apply

Web upload to GitHub. 1 file change. Commit: `Fix chart truncation and add color swatch legend`

After deploy, refresh `/buy-vs-rent/` and verify the chart visually.
