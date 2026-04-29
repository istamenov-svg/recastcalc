# PMI Calculator Bug Fix

Fixes two bugs you found by entering $1.25M home / $650K balance / $1 PMI:

## Bug 1: Stale data persisted on the error path

When loan-to-value was below 78%, the math returned an error early. The script displayed the error message but didn't clear/update any of the numeric fields. Result: the screen showed "320.0% LTV" and "$58,800 PMI" alongside an error saying you were below 78%. Stale data from mid-keystroke renders.

## Bug 2: Edge case at 78% to 80% wasn't handled cleanly

The original code lumped "below 78%" and "between 78 and 80%" into the same error message ("PMI should already be removed automatically"). Between 78 and 80% is actually a meaningful state: you can request removal but it's not automatic. The fix now distinguishes:

- **LTV ≤ 78%**: PMI should be auto-terminated; if charged, request retroactive refund
- **78% < LTV ≤ 80%**: You have legal right to request removal in writing today
- **LTV > 80%**: Normal calculator output (months to auto-removal, comparison strategies, etc.)

## Files changed

- `src/scripts/mortgage-math.js` — `calculatePMIRemoval()` now returns `currentLTV` and a context-specific message in the error case
- `src/components/PMICalculator.astro` — script now clears all numeric display fields when error occurs and shows the actual computed LTV

## Apply

Drop `src/` over your existing repo, commit, push. ~90 second deploy.

## Verified locally

`astro build` succeeded after fix. Re-tested with your exact inputs ($1.25M / $650K / 3.25% / 25 yr) and now correctly shows:

- Current loan-to-value: 52.0%
- Strategy table: all dashes (no stale data)
- Message: "Your loan-to-value ratio is 52.0%, already below the 78% auto-termination threshold..."
