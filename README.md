# Guide #7: How to Add Escrow to Your Mortgage

New guide on converting a no-escrow mortgage to escrow for property taxes and insurance. Slots into the content plan as Guide #7.

## What's in this package

```
src/
  content/
    guides/
      07-how-to-add-escrow-to-mortgage.md    NEW
  pages/
    guides/
      index.astro                            MODIFIED (adds /escrow/ pillar support)
```

2 file changes total: 1 new guide, 1 modified pages/guides/index.astro.

## Why pages/guides/index.astro had to change

The guides index has a hardcoded `pillarOrder` array. Adding the new `/escrow/` pillar without updating the index would have made the new guide invisible from the listing page (it would build into a working URL but not appear in navigation).

Three changes to index.astro:
1. Added `"/escrow/": "Escrow Accounts"` to `pillarLabels`
2. Added `"/escrow/"` to `pillarOrder`
3. Made orphan pillar handling future-proof: any pillar not in `pillarOrder` now gets appended to the bottom of the index instead of being silently dropped (so future pillars won't have this problem)

## Guide content notes

- **Length:** 1,885 words (longer than the 1,400 target, but the topic warranted it — real procedural detail, gotchas, worked examples)
- **Style:** Zero em dashes, all abbreviations spelled out on first use (PITI, RESPA), parens for category clarification
- **Honest math angle:** Self-managing escrow saves about $100-$250/year via spread between high-yield savings rate and lender escrow rate. Real money, but the bigger question is cash flow discipline.
- **Pillar:** /escrow/ (new pillar — gives room for future escrow-cluster guides like escrow refunds, escrow shortage, escrow analysis)
- **URL:** /guides/how-to-add-escrow-to-mortgage/
- **Reviewer:** TBD (same placeholder as the other 6 guides)

## Verified locally

- `astro build` succeeds with new guide
- 19 pages built clean (was 18, now +1)
- "Escrow Accounts" pillar header appears in /guides/ index
- Guide link present under that pillar header
- Dynamic route /guides/how-to-add-escrow-to-mortgage/ works

## Apply

Web upload to GitHub:
1. `src/content/guides/07-how-to-add-escrow-to-mortgage.md` (new file)
2. `src/pages/guides/index.astro` (replaces existing)

Commit message: `Add Guide #7: escrow conversion + new /escrow/ pillar`

~90 second Cloudflare deploy. After deploy, request indexing in GSC for /guides/how-to-add-escrow-to-mortgage/ since it's a new URL.

## What's next in the content plan

The /escrow/ pillar can grow with these obvious tier-2 follow-ups:
- Escrow shortage explained: why your payment just went up
- How to dispute an escrow analysis
- Removing escrow from your mortgage (the reverse direction)
- Escrow cushion math: what your lender is actually allowed to hold

None of these are urgent. The Guide #7 stands on its own.

## Voice-edit pass

Same model as the existing 6 guides: I drafted, you voice-edit before going live. Length is longer than the others (1,885 vs 1,200-1,500), so consider whether to trim during the edit. My honest take is the length is earned, but you may disagree.
