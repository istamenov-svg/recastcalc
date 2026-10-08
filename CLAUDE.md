# CLAUDE.md

Project conventions for recastcalc (Astro 5 + Tailwind, deployed on Cloudflare Pages via push to `main`).

## Writing style

- Never use em dashes in any content or copy. Use commas, semicolons, or parentheses instead.
- Spell out abbreviations on first use in guides, e.g. "private mortgage insurance (PMI)".

## Calculators

- Default rates come from `src/data/rates.json`. Never hardcode rates in components.
- `30yr_fixed` and `15yr_fixed` (Freddie Mac PMMS) and `heloc` (prime rate + 1.0, both via FRED) update automatically every Thursday at 20:00 UTC through `.github/workflows/update-rates.yml`, which commits to `main`. The job fails without committing if a value is outside 2 to 15, moves more than 1.0 point in a week, or the data is older than 14 days.
- `5_1_arm` and `pmi_typical` are manual. Review `5_1_arm` at least every 90 days and set `armReviewedAt`; the weekly job emits a warning (but still updates the other rates) when it is missing or older than 90 days.
- Never hardcode current market rates in prose. Use example framing ("assume rates are 6.5%") or point to the reference rate banner.
- Verified historical figures are not current rates and may be stated with their date (e.g. "peaked at 7.79% in October 2023"). Verify them against source data first (see Fact-checking) and keep them in the past tense.
- Use plain-English labels and inline definitions. The target audience is less financially literate users.

## Page titles

- No years in page titles (they go stale). Every rendered title, including the " | RecastCalc" suffix the layout appends, stays under 70 characters.
- For guides, `title` is also the H1, breadcrumb, and structured-data headline.

## Ads

- AdSense publisher ID: `ca-pub-1634869400564839`. `public/ads.txt` holds the matching line (`google.com, pub-1634869400564839, DIRECT, f08c47fec0942fa0`), served at `https://recastcalc.com/ads.txt`.
- The AdSense script loads in `<head>` on every page (`src/layouts/BaseLayout.astro`), independent of `ADS_ENABLED`, so Google can review the site.
- Ad units stay off until approval: `src/components/AdSlot.astro` renders nothing unless the build-time env variable `ADS_ENABLED` is `true` (default off). After approval: replace `TODO_SLOT_ID` with real slot IDs, uncomment the `<ins>` block and delete the dashed placeholder `<div>` in `AdSlot.astro`, set `ADS_ENABLED=true` in Cloudflare Pages (Settings, Environment variables, Production), then redeploy.
- Keep Auto ads off in the AdSense dashboard unless intended: with the script on every page, Auto ads would place ads without `AdSlot`.

## Analytics

- **Cloudflare Web Analytics:** enabled through Cloudflare's automatic setup. Cloudflare injects the script at the edge, so it is not in this repo. Confirmed active in the Cloudflare dashboard (October 2026). It is cookieless.
- **Google Analytics 4:** Measurement ID `G-ED8HGD08LN`. The gtag.js tag is in `<head>` of `src/layouts/BaseLayout.astro`, so it runs once on every page, including 404.
  - **Consent mode v2:** defaults are set before the tag config and before the AdSense script. `ad_storage`, `ad_user_data`, `ad_personalization`, and `analytics_storage` are `denied` in the EEA (EU 27 plus IS, LI, NO), GB, and CH (with `wait_for_update: 500`) and `granted` elsewhere. The Google Privacy & messaging consent message (configured in AdSense, loaded by the AdSense script) updates consent for those visitors.
  - **Google signals:** not enabled in code.
  - **Query strings:** the tag sets `page_location` and same-site `page_referrer` without query strings, because shared calculator links carry entered values. Only `utm_*`, `gclid`, `gbraid`, `wbraid`, and `dclid` are kept.
  - **Events** (helpers in `src/scripts/analytics.js`):
    - `calculator_used` (`calculator_name`): once per page view, the first time results appear from the visitor's own input or submit. Default results on load and shared-link loads don't count.
    - `result_link_copied` and `result_printed` (`calculator_name`): the copy-link and print buttons.
    - `lender_link_click` (`calculator_name`, `destination` = domain only): AffiliateCTA links. Each page passes `calculatorName` to `AffiliateCTA`.
    - `calculator_name` values: `recast`, `pmi_removal`, `biweekly`, `arm_reset`, `heloc_vs_refi`, `buy_vs_rent`, `home_equity`.
  - **Enhanced measurement** covers page views, scrolls, and outbound clicks; don't add events that duplicate them.
  - **Property settings** (data retention, internal traffic filter, AI channel group, Search Console link, Google signals) live in the GA4 admin, not the repo.
- **Rule:** never send entered amounts, rates, or other form values, or any personal data, to any analytics tool.
- Don't add another analytics script without updating the privacy policy (`/privacy/`, Analytics section).

## Cloudflare configuration (not in repo)

These settings live in the Cloudflare dashboard, not in this repository.

- Redirect Rule "www to root": `https://www.recastcalc.com/*` to `https://recastcalc.com/${1}`, 301, query string preserved. Verified Oct 2026. The `check-404` job in `indexnow.yml` checks it after each deploy.
- HTTP to HTTPS: handled by Cloudflare (verified Oct 2026).
- Pages build: command `npm run build`, output `dist`, production branch `main`, `NODE_VERSION` 22.
- AI Crawl Control: all crawlers allowed; Bot Preference Sync on. WebMCP tool packs off.
- Web Analytics: automatic setup (edge-injected).

## Affiliate links

- The site is not enrolled in any affiliate program yet. Calculator CTAs link to plain partner URLs (currently `https://www.lendingtree.com/`) through `src/components/AffiliateCTA.astro`, which sets `rel="sponsored noopener"`.
- Swap in affiliate tracking links only after enrollment is approved; CJ tracking links will replace the plain LendingTree URLs. Name partners in the privacy policy only after enrollment.
- Revenue and affiliate copy (footer, homepage, /about/, /terms/, /privacy/) uses "may" framing ("we may earn a commission", "may be affiliate links") so it stays accurate whether or not ads and affiliates are active. Keep that framing in new copy.
- When the CJ tracking links go in, restore the partner label by passing `partner="LendingTree"` to `AffiliateCTA` (it renders "Sponsored · LendingTree").

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

- Production deploys from `main` only. Side branches do not go live.
- Always run `npm run build` before committing (it runs `astro build`, then `scripts/check-links.mjs`, which fails on any broken internal link or `#anchor`). Never push a failing build.
- Cloudflare Pages must use `npm run build` as its build command so a broken link fails the deploy and the previous version stays live.
- The project uses Node 22: `.nvmrc` holds `22`, `package.json` requires `"node": ">=22"`, and the workflows that run Node (`update-rates.yml`, `indexnow.yml`) use `node-version: 22`. Cloudflare Pages' `NODE_VERSION` environment variable must match (22); change all of these together.
- Committing and pushing to the working branch is allowed at any time, including when the stop hook asks. Merging into `main` (which deploys) requires approval of the diff; after approval, merge into `main` and push `main`.

## Modified dates

- Modified dates are hardcoded, never the build date (`new Date()`). Guides use `updatedDate` in frontmatter; every other page uses its entry in `src/data/page-dates.json`. These drive `article:modified_time`, the visible "Last updated" text, and the sitemap `lastmod`.
- Update a page's date by hand only when its content meaningfully changes. Meta descriptions, punctuation fixes, and the automated weekly rate updates do not count.
- When adding a page, add its path to `src/data/page-dates.json`.

## IndexNow

- `.github/workflows/indexnow.yml` submits every sitemap URL to IndexNow after each push to `main` and after each weekly rate commit. It waits until `https://recastcalc.com/version.txt` (built from Cloudflare's `CF_PAGES_COMMIT_SHA`) shows the new commit, then fails on any response other than 200 or 202.
- The key file is `public/<key>.txt`. Do not rename or delete it.

## Fact-checking

- `.github/workflows/fred-lookup.yml` (manual dispatch: series ID, start date, end date) prints FRED observations and the range's max and min to the job log. Use it to verify historical rate figures before publishing them; this container cannot reach FRED. It is read-only and never commits.

## Time-sensitive facts

Claims on published pages that depend on laws, program rules, or third-party figures that can change. Any new page that cites a law, program rule, or third-party statistic gets a row here. When a fact is rechecked, update the page if needed and the "Last checked" date.

| Page | Claim | Source | Last checked | Recheck |
|---|---|---|---|---|
| Guide 10 (`/guides/underwater-mortgage-options/`) | The main-home forgiven-debt exclusion doesn't apply to debt forgiven, or agreements made, after Dec 31, 2025 | [IRS Publication 4681](https://www.irs.gov/publications/p4681) | Oct 2026 | Each January when the new Publication 4681 is published, and whenever Congress passes housing tax legislation |
| Guide 10 | FHA Streamline Refinance can be done without an appraisal | [Archived HUD reference guide](https://archives.hud.gov/offices/hsg/sfh/ref/sfhp2-19.cfm) (current HUD Handbook 4000.1 is PDF-only) | Oct 2026 | Annually |
| `/home-equity-calculator/` | ATTOM: 3.2% of mortgaged homes seriously underwater in Q1 2026 | [ATTOM Q1 2026 Home Equity & Underwater Report](https://www.attomdata.com/news/market-trends/home-sales-prices/q1-2026-home-equity-and-underwater-report/) | Oct 2026 | When ATTOM publishes a newer quarter that states the number |
| Guide 09 (`/guides/escrow-shortage-mortgage-payment-went-up/`) | Cotality: payments up about $175/month in 2026 from taxes and insurance; Neighbors Bank: taxes and insurance 21% of the average payment | [WTOP, July 2026](https://wtop.com/news/2026/07/what-is-an-escrow-shortage-why-your-mortgage-payment-just-went-up/) (both figures) | Oct 2026 | Mid-2027 |
| `/recast/` FAQ, guides 01, 02, 05, `/methodology/` | /recast/ FAQ (visible and structured data) names the servicers in the table; guide 01 names Chase and Citizens Bank; /recast/ FAQ and guides 01, 02, and 05 cite Bankrate's fee and minimum ranges and Chase's no-minimum statement; /recast/ and guide 02 cite NerdWallet's refinance closing costs (usually 2% to 6% of the refinanced amount) | [Bankrate](https://www.bankrate.com/mortgages/what-is-mortgage-recasting-and-why-do-it), [Chase](https://www.chase.com/personal/mortgage/recast), [NerdWallet](https://www.nerdwallet.com/mortgages/learn/what-is-mortgage-recast) | Oct 2026 | Quarterly |
| Guide 04 (`/guides/mortgage-recast-fee/`) | Quick answer summarizes the servicer fees below; NerdWallet: fees generally $150 to $250; Bankrate: fees typically $150 to $500, minimums often $5,000 or $10,000 | [NerdWallet](https://www.nerdwallet.com/mortgages/learn/what-is-mortgage-recast), [Bankrate](https://www.bankrate.com/mortgages/what-is-mortgage-recasting-and-why-do-it) | Oct 2026 | Quarterly |
| `/recast/` lender table and guide 04 fee table | Bank of America: $5,000 principal curtailment in the last 6 months (or within 30 days after the request); no fee; first 6 payments made, loan current; once every rolling 12 months; per investor guidelines | [Bank of America FAQ](https://www.bankofamerica.com/mortgage/faqs/) (borrower) | Oct 2026 | Quarterly |
| `/recast/` lender table and guide 04 fee table | Chase: conventional only; no minimum; "Fees may apply"; FHA, VA, USDA not eligible | [Chase](https://www.chase.com/personal/mortgage/recast) (borrower) | Oct 2026 | Quarterly |
| `/recast/` lender table and guide 04 fee table | Citizens Bank: $5,000 minimum; $150 processing fee | [Citizens Bank](https://www.citizensbank.com/learning/mortgage-servicing-fees.aspx) (servicing fee page) | Oct 2026 | Quarterly |
| `/recast/` lender table and guide 04 fee table | Colonial Savings: conventional fixed or adjustable, at least 90 days after closing, one recast per loan; minimum $10,000 or 10% of unpaid principal balance, whichever is greater; fee $500 fixed or $650 adjustable; FHA, VA, USDA not eligible | [Colonial terms and conditions PDF](https://www.gocolonial.com/wp-content/uploads/2024/11/Loan-Recast-Request-Terms-and-Conditions_Final.pdf) (borrower) | Oct 2026 | Quarterly |
| `/recast/` lender table and guide 04 fee table | Freedom Mortgage: conventional only; FHA, VA, USDA cannot be recast; fee and minimum not stated | [Freedom Mortgage](https://www.freedommortgage.com/learn/mortgages/mortgage-recast) (borrower education page) | Oct 2026 | Quarterly |
| `/recast/` and guide 04 notes below the servicer tables (not in the tables); /recast/ FAQ (visible and structured data); guide 01 | Rocket Mortgage (formerly Mr. Cooper): mrcooper.com is retired and former Mr. Cooper loans are serviced by Rocket Mortgage with the same loan numbers; recast terms not published; call (800) 4-ROCKET | [mrcooper.com retirement notice](https://www.mrcooper.com/) (old Mr. Cooper URLs redirect here). Rocket sites (rocketmortgage.com, rocket.com, including robots.txt and sitemaps) return HTTP 403 to doc-lookup, so a Rocket recast page could not be searched; check in a browser | Oct 2026 | Quarterly |
| `/recast/` lender table and guide 04 fee table | Gateway Mortgage: conventional and jumbo loans, current, first payment made; written request within 30 days of the lump sum; minimum 10% of the current loan balance, certified funds; $350 non-refundable fee; processing typically 60 to 90 days; FHA, VA, USDA not eligible | [Gateway recast FAQ](https://www.gatewayfirst.com/loan-recast-re-amortization-faq) (borrower; answers are in the page's script data, so use doc-lookup raw mode) | Oct 2026 | Quarterly |
| `/recast/` lender table and guide 04 fee table | New American Funding: conventional first mortgages, loan current; $5,000 minimum; $300 fee; FHA, VA, USDA not eligible | [NAF guide to recast PDF](https://assets.newamericanfunding.com/media/5090/guide-to-recast.pdf) (borrower) | Oct 2026 | Quarterly |
| `/recast/` lender table and guide 04 fee table | Newrez: conventional Fannie Mae or Freddie Mac loans, current, once a year; $5,000 minimum; $250 fee subject to state rules | [Newrez correspondent exhibit, 06/01/2023](https://corr.newrezcorrespondent.com/documents/web/contenteditordocs/Exhibits/Mortgage%20Recasting%206%201%2023.pdf) (partner-lender document; no consumer-use restriction found Oct 2026; drop if a newer borrower-facing Newrez source contradicts it; newrez.com is not on the doc-lookup allowlist) | Oct 2026 | Quarterly |
| `/recast/` lender table and guide 04 fee table | Onity (formerly PHH): $5,000 minimum (some investors require more); $250 fee per state fee matrix; FHA, VA, USDA, Ginnie Mae, non-agency, commercial, HELOC, interest-only period, negatively amortizing ARM not eligible | [Onity recast policy, 03/23/2026](https://correspondent.onitymortgage.com/getmedia/f4e45e8f-512a-4ad9-a805-4f23ea016285/Onity-Recast-Policy-03232026.pdf?ext=.pdf) (partner-lender document; states only "Intended for informational purposes only", no consumer-use restriction, Oct 2026; drop the row if one is added) | Oct 2026 | Quarterly |
| `/recast/` lender table and guide 04 fee table | PennyMac: $10,000 minimum; $250 processing fee sent with the lump sum | [PennyMac fee FAQ](https://www.pennymac.com/faqs/billing-20-recast-fee), [minimum FAQ](https://www.pennymac.com/faqs/billing-22-recast-minimum) (borrower) | Oct 2026 | Quarterly |
| `/recast/` lender table and guide 04 fee table | Trustmark: conventional first mortgages, at least 60 days after first payment due date; $10,000 minimum; $700 fee (subject to change); FHA, VA, USDA not eligible | [Trustmark flyer and application PDF](https://www.trustmark.com/content/dam/trustmark/pdf/mortgage/mortgage_loan_recast_flyer_and_application.pdf) (borrower) | Oct 2026 | Quarterly |
| `/recast/` lender table and guide 04 fee table | U.S. Bank: $250 recast modification fee; minimum not stated | [U.S. Bank mortgage fee schedule PDF](https://www.usbank.com/content/dam/usbank/en/documents/pdfs/home-loans/mortgage-fee-schedule.pdf) (servicing fee schedule) | Oct 2026 | Quarterly |
| `/recast/` lender table and guide 04 fee table | Wells Fargo: recasts offered on new jumbo loans; fee and minimum not stated | [Wells Fargo jumbo loan page](https://www.wellsfargo.com/mortgage/loan-programs/jumbo-loan/) | Oct 2026 | Quarterly |
| Guide 06 (`/guides/chase-mortgage-recast/`) | Chase: conventional loans only; no minimum lump sum; fee not published; FHA, VA, and USDA not eligible; loan must be in good standing; may recast again after further principal reduction; phone 1-800-848-9136 | [Chase](https://www.chase.com/personal/mortgage/recast) | Oct 2026 | Quarterly |
| Guide 03 (`/guides/mortgage-recast-timeline/`) | No timing figures (ask-your-servicer framing); Bankrate fee and minimum ranges | [Bankrate](https://www.bankrate.com/mortgages/what-is-mortgage-recasting-and-why-do-it) | Oct 2026 | Quarterly |
| Guide 11 (`/guides/florida-condo-special-assessments/`) | Milestone inspections: condo buildings three or more habitable stories; licensed architect or engineer; by the end of the year the building turns 30 (25 if the local agency requires), then every 10 years; repairs for substantial structural deterioration must begin within 365 days of the phase two report | [s. 553.899](https://www.flsenate.gov/Laws/Statutes/2026/553.899), subsections (2), (3), (11) | Oct 2026 | After each regular legislative session (ends in spring): check the statute page's History line for new chapter laws |
| Guide 11 (`/guides/florida-condo-special-assessments/`) | Structural integrity reserve study: same buildings, at least every 10 years; lists roof, structure, fireproofing, plumbing, electrical, waterproofing, windows and exterior doors; reserves must be maintained based on the study | [s. 718.112](https://www.flsenate.gov/Laws/Statutes/2026/718.112)(2)(g)1., (g)4.a., (f)2.a. | Oct 2026 (2026 amendments reviewed; see note below the table) | After each regular legislative session (ends in spring): check the statute page's History line for new chapter laws |
| Guide 11 (`/guides/florida-condo-special-assessments/`) | Owners of SIRS buildings can't vote to provide less than required reserves for (g) items (budgets adopted on or after Dec 31, 2024; narrow exceptions); reserves may be funded by regular or special assessments, lines of credit, or loans, and a special assessment, line of credit, or loan for them needs a majority of total voting interests; this wording is from ch. 2025-175 (HB 913) | [s. 718.112](https://www.flsenate.gov/Laws/Statutes/2026/718.112)(2)(f)2.b., c.(I) | Oct 2026 (2026 amendments reviewed; see note below the table) | After each regular legislative session (ends in spring): check the statute page's History line for new chapter laws |
| Guide 11 (`/guides/florida-condo-special-assessments/`) | Nonemergency special assessment meeting notice: at least 14 days, mailed or delivered and posted; must state assessments will be considered with estimated cost and purposes | [s. 718.112](https://www.flsenate.gov/Laws/Statutes/2026/718.112)(2)(c)1., 3. | Oct 2026 (2026 amendments reviewed; see note below the table) | After each regular legislative session (ends in spring): check the statute page's History line for new chapter laws |
| Guide 11 (`/guides/florida-condo-special-assessments/`) | Special assessment purpose must be set out in a written notice; funds used only for that purpose | [s. 718.116](https://www.flsenate.gov/Laws/Statutes/2026/718.116)(10) | Oct 2026 | After each regular legislative session (ends in spring): check the statute page's History line for new chapter laws |
| Guide 11 (`/guides/florida-condo-special-assessments/`) | Owners can inspect and copy official records, including inspection reports and contracts; 10-working-day presumption; association must distribute the SIRS or a notice it is available; associations with 25 or more non-timeshare units must post key documents (inspection reports, latest SIRS, budget, financial report, contract and bid lists, meeting notices and agendas) on an owner-only website or app within 30 days and give owners a login on written request | [s. 718.111](https://www.flsenate.gov/Laws/Statutes/2026/718.111)(12)(a), (c)1.a., (g)1.-2.; [s. 718.112](https://www.flsenate.gov/Laws/Statutes/2026/718.112)(2)(g)11. | Oct 2026 (2026 amendments reviewed; see note below the table) | After each regular legislative session (ends in spring): check the statute page's History line for new chapter laws |
| Guide 11 (`/guides/florida-condo-special-assessments/`) | Association has a lien for unpaid assessments and can foreclose it like a mortgage | [s. 718.116](https://www.flsenate.gov/Laws/Statutes/2026/718.116)(5)(a), (6)(a) | Oct 2026 | After each regular legislative session (ends in spring): check the statute page's History line for new chapter laws |
| Guide 11 | Fannie Mae won't purchase loans on units in projects needing critical repairs; a special assessment for an unremediated critical repair makes the project ineligible | [Fannie Mae Selling Guide B4-2.1-03](https://selling-guide.fanniemae.com/sel/b4-2.1-03/ineligible-projects) (dated 08/05/2026 when checked) | Oct 2026 | Quarterly, and when the topic's date changes |
| Guide 12 (`/guides/texas-home-equity-rules/`) | 80% combined limit on the date the loan is made; for a HELOC, 80% of value on the date the line is established, with no advances while above it | [Tex. Const. art. XVI, s. 50](https://statutes.capitol.texas.gov/Docs/CN/htm/CN.16.htm) (a)(6)(B); HELOC notice items (5)-(6) | Oct 2026 | After each constitutional amendment election (November of odd years) and each regular legislative session |
| Guide 12 (`/guides/texas-home-equity-rules/`) | Cash-out refinance: a refinance of (a)(1)-(a)(5) debt with additional funds must be an (a)(6) loan unless the funds are only for refinance costs or (a)(2), (a)(3), (a)(5) purposes | [Tex. Const. art. XVI, s. 50](https://statutes.capitol.texas.gov/Docs/CN/htm/CN.16.htm) (e) | Oct 2026 | After each constitutional amendment election (November of odd years) and each regular legislative session |
| Guide 12 (`/guides/texas-home-equity-rules/`) | Home equity loan must be the only debt on the homestead except (a)(1)-(a)(5) or (a)(8) debt; no new (a)(6) loan before the first anniversary of the last one (state-of-emergency exception) | [Tex. Const. art. XVI, s. 50](https://statutes.capitol.texas.gov/Docs/CN/htm/CN.16.htm) (a)(6)(K), (M)(iii) | Oct 2026 | After each constitutional amendment election (November of odd years) and each regular legislative session |
| Guide 12 (`/guides/texas-home-equity-rules/`) | Closing not before the 12th day after the later of application or notice; and one business day after the final itemized fee disclosure | [Tex. Const. art. XVI, s. 50](https://statutes.capitol.texas.gov/Docs/CN/htm/CN.16.htm) (a)(6)(M)(i)-(ii) | Oct 2026 | After each constitutional amendment election (November of odd years) and each regular legislative session |
| Guide 12 (`/guides/texas-home-equity-rules/`) | Fees capped at 2% of original principal, excluding interest, bona fide discount points, third-party appraisal, licensed survey, state base premium for mortgagee title policy with endorsements, and a title exam report costing less than the base premium without endorsements | [Tex. Const. art. XVI, s. 50](https://statutes.capitol.texas.gov/Docs/CN/htm/CN.16.htm) (a)(6)(E) | Oct 2026 | After each constitutional amendment election (November of odd years) and each regular legislative session |
| Guide 12 (`/guides/texas-home-equity-rules/`) | Owner and spouse may rescind within three days after the loan is made | [Tex. Const. art. XVI, s. 50](https://statutes.capitol.texas.gov/Docs/CN/htm/CN.16.htm) (a)(6)(Q)(viii) | Oct 2026 | After each constitutional amendment election (November of odd years) and each regular legislative session |
| Guide 12 (`/guides/texas-home-equity-rules/`) | Without recourse for personal liability unless obtained by actual fraud; foreclosure only by court order | [Tex. Const. art. XVI, s. 50](https://statutes.capitol.texas.gov/Docs/CN/htm/CN.16.htm) (a)(6)(C), (D) | Oct 2026 | After each constitutional amendment election (November of odd years) and each regular legislative session |
| Guide 12 (`/guides/texas-home-equity-rules/`) | Refinance out of a home equity loan: not before first anniversary; no added funds except to refinance (a)(1)-(a)(7) debt or lender-required costs and reserves; 80% combined limit; notice by third business day after application and 12 days before closing; lien then deemed (a)(4) | [Tex. Const. art. XVI, s. 50](https://statutes.capitol.texas.gov/Docs/CN/htm/CN.16.htm) (f)(2), (f-1) | Oct 2026 | After each constitutional amendment election (November of odd years) and each regular legislative session |
| Guide 12 (`/guides/texas-home-equity-rules/`) | School district homestead exemption $140,000 (from $100,000), effective for the 2025 tax year after the Nov 4, 2025 election; additional 65-or-older/disabled exemption $60,000 | [Comptroller exemptions page](https://comptroller.texas.gov/taxes/property-tax/exemptions/) (Tax Code 11.13(b), (c)); [S.J.R. 2](https://capitol.texas.gov/BillLookup/History.aspx?LegSess=89R&Bill=SJR2); S.B. 4 and S.B. 23 (89R) enrolled text | Oct 2026 | After each constitutional amendment election (November of odd years) and each regular legislative session |
| Guide 12 (`/guides/texas-home-equity-rules/`) | Protest deadline: May 15 or 30 days after the appraisal notice is delivered, whichever is later | [Tax Code s. 41.44](https://statutes.capitol.texas.gov/Docs/TX/htm/TX.41.htm)(a)(1) | Oct 2026 | After each constitutional amendment election (November of odd years) and each regular legislative session |

Texas statute text is read from `tcss.legis.texas.gov/resources/...` (the content host behind statutes.capitol.texas.gov, which is now a JavaScript app); the register links the public statutes.capitol.texas.gov URLs.

2026 amendments to ss. 718.111 and 718.112 (checked Oct 2026 via doc-lookup on laws.flrules.org): neither changes a guide 11 claim.
- Ch. 2026-14 (SB 104, the annual reviser's bill), s. 42 amends s. 718.111(1)(d) and (12)(g), and s. 43 amends s. 718.112(2)(b) and (d). Both only correct cross-references to s. 718.112(2)(d) after ch. 2025-175 renumbered its subparagraphs (reviser's notes).
- Ch. 2026-168 (CS/CS/HB 797, nonprofit corporations), s. 189 reenacts s. 718.111(1)(d) without change to incorporate amendments to ss. 617.0830 and 617.0834 (officer and director duties and liability).

## Content backlog

Guides from the original content plan that were linked but never written. Links to them were removed or redirected (October 2026); restore them when each guide is written.

| Missing slug | Originally linked from | Current state |
|---|---|---|
| `arm-rate-reset` | /arm-reset/ related guides | Link removed |
| `5-1-arm-vs-7-1-arm` | /arm-reset/ related guides | Link removed |
| `arm-cap-rules` | /arm-reset/ related guides | Link removed |
| `biweekly-mortgage-payments` | /biweekly-payoff/ related guides | Link removed |
| `biweekly-calculator-comparison` | /biweekly-payoff/ related guides | Link removed |
| `heloc-vs-recast` | /heloc-vs-refi/ related guides | Link removed |
| `refinance-break-even` | /heloc-vs-refi/ related guides | Link removed |
| `how-to-remove-pmi` | /pmi-removal/ related guides | Link removed |
| `drop-pmi-without-refinancing` | /pmi-removal/ related guides | Link removed |
| `pmi-removal-ltv` | /pmi-removal/ related guides; guide 07 related guides | Removed from /pmi-removal/; guide 07 now links /pmi-removal/ |
| `recast-vs-extra-payment` | guides 02, 04, 06; /biweekly-payoff/ related guides | Redirected to guide 01's "Recast vs. extra principal payment" section |
| `heloc-vs-refinance` | guide 02; /heloc-vs-refi/ related guides | Guide 02 redirected to /heloc-vs-refi/; self-link on /heloc-vs-refi/ removed |
| `recast-minimum-lump-sum` | guide 01 | Redirected to the /recast/ lender table (`#lenders`) |
| `recast-fha-va-usda` | guide 04 | Redirected to guide 01's "What most articles get wrong" section |

### Sourcing sweep for non-recast figures

Unsourced figures found in the October 2026 recast sweep, outside its scope. Source or soften each.

- Guide 03: forbearance lasts 3 to 12 months
- Guide 02: refinance seasoning of 6 months; refinancing with 5 to 10% equity
- Guide 07: escrow requests processed in 30 to 60 days
- /heloc-vs-refi/: HELOCs close in 2 to 4 weeks; cash-out refinances take 30 to 60 days
- /biweekly-payoff/: biweekly service setup fees of $200 to $400 and $2 to $10 per payment

## Known gaps

- `GuideLayout.astro` ignores the frontmatter `schema` list and always emits only `Article` structured data, so no guide emits `FAQPage` even when its frontmatter lists it.

## Deferred work

- Astro 5 to 7 and Tailwind 3 to 4 migration deferred (Oct 2026). These clear the remaining critical/high `npm audit` findings (astro, @astrojs/tailwind, tailwindcss, sharp, braces/micromatch/chokidar). Revisit if SSR, Pages Functions, or user-generated content is added, or if Astro 5 stops receiving fixes.
- Move to Node 24 (active LTS) before Node 22 reaches end of life in April 2027 (Node 22 is in maintenance LTS; Cloudflare Pages builds on Node 22.22.0 as of Oct 2026). Ideally do it together with the Astro 5 to 7 and Tailwind 3 to 4 migration. Change `.nvmrc`, `package.json` engines, the workflows' `node-version`, and Cloudflare Pages' `NODE_VERSION` together.
- WebMCP (in-browser tools for AI agents) would let assistants run the calculators directly. Revisit when a major assistant (ChatGPT, Claude, Perplexity, Gemini) announces WebMCP support. The other Cloudflare Diagnostics Level 2, Level 3, and Commerce items don't apply to a static content site with no logins, APIs, or products.
  - Cloudflare now offers a beta WebMCP feature (AI Crawl Control > WebMCP) with a "Site MCP server" tool pack that proxies a site's own MCP server to in-browser agents.
  - Candidate experiment: a remote MCP server on Cloudflare Workers that exposes the calculators as tools, reusing `src/scripts/mortgage-math.js` and its tests. It could also be listed as a connector in Claude or ChatGPT.
  - Status: not started. Prerequisites: evidence of agent demand, or a decision to test MCP distribution.
  - Leave the Cloudflare WebMCP toggles off until a server exists.
