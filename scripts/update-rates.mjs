#!/usr/bin/env node
/**
 * Updates src/data/rates.json from FRED (Freddie Mac PMMS + prime rate).
 * Run by .github/workflows/update-rates.yml every Thursday; safe to run locally.
 *
 * Exit codes: 0 = updated or unchanged, 1 = sanity check failed (file untouched).
 * A missing or stale armReviewedAt only emits a ::warning:: and does not block.
 * Writes "changed=true|false" and "week=<date>" to $GITHUB_OUTPUT when set.
 */
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';

const RATES_PATH = new URL('../src/data/rates.json', import.meta.url);
const FRED_URL = 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=';
const DAY_MS = 24 * 60 * 60 * 1000;

const MIN_RATE = 2;
const MAX_RATE = 15;
const MAX_WEEKLY_CHANGE = 1.0;
const MAX_DATA_AGE_DAYS = 14;
const MAX_ARM_REVIEW_AGE_DAYS = 90;
const HELOC_PRIME_MARGIN = 1.0;

const today = new Date();
const errors = [];

// Returns [{ date: 'YYYY-MM-DD', value: number }] sorted oldest first.
// FRED_CSV_DIR (testing only) reads <dir>/<series>.csv instead of fetching.
async function fetchSeries(id) {
  let text;
  if (process.env.FRED_CSV_DIR) {
    text = readFileSync(`${process.env.FRED_CSV_DIR}/${id}.csv`, 'utf8');
  } else {
    const res = await fetch(FRED_URL + id);
    if (!res.ok) throw new Error(`FRED ${id}: HTTP ${res.status}`);
    text = await res.text();
  }
  const rows = text.trim().split(/\r?\n/).slice(1)
    .map((line) => line.split(','))
    .filter(([date, value]) => /^\d{4}-\d{2}-\d{2}$/.test(date) && value !== '.' && value !== '')
    .map(([date, value]) => ({ date, value: Number(value) }))
    .filter((row) => Number.isFinite(row.value));
  if (rows.length < 2) throw new Error(`FRED ${id}: fewer than 2 observations`);
  return rows;
}

const ageDays = (date) => Math.floor((today - new Date(date + 'T00:00:00Z')) / DAY_MS);
const round2 = (n) => Math.round(n * 100) / 100;

function checkWeekly(name, series) {
  const latest = series.at(-1);
  const prior = series.at(-2);
  if (latest.value < MIN_RATE || latest.value > MAX_RATE) {
    errors.push(`${name} latest value ${latest.value} is outside ${MIN_RATE} to ${MAX_RATE}`);
  }
  const change = Math.abs(latest.value - prior.value);
  if (change > MAX_WEEKLY_CHANGE) {
    errors.push(`${name} moved ${change.toFixed(2)} points week over week (${prior.value} to ${latest.value}); limit is ${MAX_WEEKLY_CHANGE}`);
  }
  if (ageDays(latest.date) > MAX_DATA_AGE_DAYS) {
    errors.push(`${name} latest observation ${latest.date} is ${ageDays(latest.date)} days old; limit is ${MAX_DATA_AGE_DAYS}`);
  }
  return { latest, prior };
}

// Observation closest to 52 weeks before the given date.
function yearAgo(series, date) {
  const target = new Date(date + 'T00:00:00Z').getTime() - 364 * DAY_MS;
  return series.reduce((best, row) =>
    Math.abs(new Date(row.date + 'T00:00:00Z') - target) < Math.abs(new Date(best.date + 'T00:00:00Z') - target) ? row : best,
  );
}

const current = JSON.parse(readFileSync(RATES_PATH, 'utf8'));

const [s30, s15, prime] = await Promise.all(['MORTGAGE30US', 'MORTGAGE15US', 'DPRIME'].map(fetchSeries));

const r30 = checkWeekly('30yr_fixed (MORTGAGE30US)', s30);
const r15 = checkWeekly('15yr_fixed (MORTGAGE15US)', s15);
if (r30.latest.date !== r15.latest.date) {
  errors.push(`30yr (${r30.latest.date}) and 15yr (${r15.latest.date}) latest dates do not match`);
}

const primeLatest = prime.at(-1);
if (ageDays(primeLatest.date) > MAX_DATA_AGE_DAYS) {
  errors.push(`Prime rate (DPRIME) latest observation ${primeLatest.date} is ${ageDays(primeLatest.date)} days old; limit is ${MAX_DATA_AGE_DAYS}`);
}

// ARM review is a reminder, not a blocker: warn and keep updating PMMS rates.
if (!current.armReviewedAt) {
  console.log('::warning::rates.json has no armReviewedAt date. Review rates.5_1_arm by hand and set armReviewedAt (YYYY-MM-DD) in src/data/rates.json.');
} else if (ageDays(current.armReviewedAt) > MAX_ARM_REVIEW_AGE_DAYS) {
  console.log(`::warning::5_1_arm was last reviewed ${current.armReviewedAt} (${ageDays(current.armReviewedAt)} days ago). Review rates.5_1_arm by hand and update armReviewedAt in src/data/rates.json.`);
}

if (errors.length) {
  console.error('Rate update aborted, rates.json not changed:');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

const prior30 = r30.prior.value;
const direction = r30.latest.value > prior30 ? 'up' : r30.latest.value < prior30 ? 'down' : 'flat';

const next = {
  ...current,
  asOf: r30.latest.date,
  rates: {
    ...current.rates,
    '30yr_fixed': r30.latest.value,
    '15yr_fixed': r15.latest.value,
    heloc: round2(primeLatest.value + HELOC_PRIME_MARGIN),
  },
  trend: {
    ...current.trend,
    '30yr_fixed_prior_week': prior30,
    '30yr_fixed_year_ago': yearAgo(s30, r30.latest.date).value,
    direction_weekly: direction,
  },
};

const before = JSON.stringify(current, null, 2) + '\n';
const after = JSON.stringify(next, null, 2) + '\n';
const changed = before !== after;

if (changed) writeFileSync(RATES_PATH, after);
console.log(changed
  ? `Updated rates.json: week of ${next.asOf}, 30yr ${next.rates['30yr_fixed']}, 15yr ${next.rates['15yr_fixed']}, HELOC ${next.rates.heloc} (prime ${primeLatest.value} on ${primeLatest.date})`
  : `rates.json already current (week of ${next.asOf}); nothing to do`);

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\nweek=${next.asOf}\n`);
}
