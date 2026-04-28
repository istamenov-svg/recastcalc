# RecastCalc

Mortgage utility calculators — recast, PMI removal, biweekly payoff, ARM reset, HELOC vs refi.

## Stack

- **Astro 5** — static site generator with islands architecture (zero JS by default)
- **Tailwind CSS** — styling with custom finance/editorial theme
- **Vanilla JS** — calculator math runs as Astro islands, no React/Vue overhead
- **Cloudflare Pages** — hosting (recommended)

## Local development

Requires Node.js 20+.

```bash
npm install
npm run dev
# Open http://localhost:4321
```

## Build

```bash
npm run build
# Output in /dist
npm run preview
# Test the production build locally
```

## Deploy to Cloudflare Pages

### Option A: Connect GitHub repo (recommended)

1. Push this repo to GitHub (`git push origin main`).
2. Go to Cloudflare Dashboard → Pages → Create application → Connect to Git.
3. Select the `recastcalc` repo.
4. Build settings:
   - **Framework preset:** Astro
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Node version:** 20 (set in environment variables: `NODE_VERSION=20`)
5. Deploy. Cloudflare will auto-deploy on every push to `main`.

### Option B: Direct upload via Wrangler

```bash
npm install -g wrangler
wrangler pages deploy dist --project-name=recastcalc
```

### Custom domain

After first deploy:
1. Cloudflare Pages → recastcalc → Custom domains → Set up custom domain
2. Enter `recastcalc.com` and `www.recastcalc.com`
3. Update nameservers at your registrar to Cloudflare's (if not already)

## Post-launch checklist (week 1)

- [ ] Submit sitemap to Google Search Console: `https://recastcalc.com/sitemap-index.xml`
- [ ] Submit to Bing Webmaster Tools
- [ ] Apply for Google AdSense (requires real traffic + 20+ indexed pages)
- [ ] Apply for LendingTree affiliate (search "LendingTree Partner Program")
- [ ] Apply for Credible affiliate (via Impact Radius)
- [ ] Replace `ca-pub-XXX` placeholders in `src/layouts/BaseLayout.astro` once AdSense approves
- [ ] Replace AdSense slot placeholders in `src/components/AdSlot.astro`
- [ ] Replace `lendingtree.com/?ref=recastcalc` with your real affiliate URL
- [ ] Set up Plausible or Cloudflare Web Analytics
- [ ] Verify Open Graph image renders correctly: create `public/og-default.png` (1200x630)

## Project structure

```
src/
├── pages/
│   ├── index.astro                 # Homepage
│   ├── recast/index.astro          # Primary calculator
│   ├── pmi-removal/index.astro     # Placeholder
│   ├── biweekly-payoff/index.astro # Placeholder
│   ├── arm-reset/index.astro       # Placeholder
│   ├── heloc-vs-refi/index.astro   # Placeholder
│   ├── about/index.astro           # E-E-A-T
│   ├── methodology/index.astro     # E-E-A-T
│   ├── privacy/index.astro
│   ├── terms/index.astro
│   ├── contact/index.astro
│   └── guides/index.astro
├── components/
│   ├── Header.astro
│   ├── Footer.astro
│   ├── RecastCalculator.astro      # The hero calculator
│   ├── AdSlot.astro                # AdSense wrapper with CLS protection
│   └── AffiliateCTA.astro
├── layouts/
│   └── BaseLayout.astro            # Full SEO + schema + meta
├── scripts/
│   └── mortgage-math.js            # Pure functions, framework-free
├── styles/
│   └── global.css
└── content/
    └── guides/                     # Markdown guides go here
```

## Adding a new calculator

1. Add math to `src/scripts/mortgage-math.js` as a pure function
2. Create `src/components/[Name]Calculator.astro` that imports the math and binds to inputs
3. Replace placeholder at `src/pages/[name]/index.astro` with full SEO content + calculator
4. Add to navigation in `src/components/Header.astro` and `src/components/Footer.astro`
5. Add to homepage tool grid in `src/pages/index.astro`

## Adding a guide

Guides live in `src/content/guides/` as Markdown files. Each guide should:

- Target one keyword cluster (KD <50)
- Internally link to the relevant calculator at least 2x
- Include FAQ schema for at least 5 questions
- Cite sources (CFPB, Freddie Mac, IRS Pub 936)
- Be 1,500-3,000 words
- Have a named author byline (currently Ivan Manov)

## Performance targets

- Lighthouse Performance: 95+ on mobile
- LCP: <1.5s
- INP: <200ms (critical — any calculator JS that blocks input kills the score)
- CLS: <0.05 (use `min-height` on all ad slots)
- Total page weight: <100KB on first calculator page (excluding fonts and ads)

## License

All rights reserved. Source available for reference; do not redistribute.
