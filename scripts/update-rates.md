# Rate updates

Rates in `src/data/rates.json` update automatically. See `.github/workflows/update-rates.yml` and `scripts/update-rates.mjs`, and the Calculators section of `CLAUDE.md`.

- 30yr and 15yr fixed (Freddie Mac PMMS) and HELOC (prime + 1.0) update every Thursday at 20:00 UTC. Run manually from the Actions tab (Update PMMS rates, Run workflow).
- 5/1 ARM and PMI are manual. Review the ARM rate at least every 90 days and update `armReviewedAt`.
