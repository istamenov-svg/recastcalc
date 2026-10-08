import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateHomeEquity } from '../src/scripts/mortgage-math.js';

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const base = { homeValue: 400000, sellingCostPct: 6 };

test('healthy: cltv 70%, no other loans', () => {
  const r = calculateHomeEquity({ ...base, mortgageBalance: 280000 });
  assert.equal(r.status, 'healthy');
  assert.equal(r.totalDebt, 280000);
  close(r.ltv, 0.7);
  close(r.cltv, 0.7);
  assert.equal(r.paperEquity, 120000);
  close(r.saleCash, 400000 * 0.94 - 280000); // 96,000
  close(r.cushionUnderwater, 0.3);
  close(r.cushionSale, 1 - 280000 / 376000);
  assert.equal(r.checklist.heloc, 'likely');
  assert.equal(r.checklist.cashOutRefi, 'likely');
  assert.equal(r.checklist.sellWithoutCash, true);
});

test('thin: cltv 85% with a HELOC, sale still covers debt', () => {
  const r = calculateHomeEquity({ ...base, mortgageBalance: 300000, otherLoans: 40000 });
  close(r.ltv, 0.75);
  close(r.cltv, 0.85);
  assert.equal(r.status, 'thin');
  assert.ok(r.saleCash >= 0); // 376,000 - 340,000
  assert.equal(r.checklist.heloc, 'possible');
  assert.equal(r.checklist.cashOutRefi, 'unlikely');
});

test('sale-underwater: equity on paper, but selling costs push sale cash below zero', () => {
  const r = calculateHomeEquity({ ...base, mortgageBalance: 390000 });
  close(r.cltv, 0.975);
  assert.ok(r.paperEquity >= 0);
  assert.ok(r.saleCash < 0); // 376,000 - 390,000
  assert.equal(r.status, 'sale-underwater');
  assert.ok(r.cushionUnderwater > 0);
  assert.ok(r.cushionSale < 0);
  assert.equal(r.checklist.sellWithoutCash, false);
  assert.equal(r.checklist.heloc, 'unlikely');
});

test('underwater: cltv just over 100%', () => {
  const r = calculateHomeEquity({ ...base, mortgageBalance: 420000 });
  close(r.cltv, 1.05);
  assert.equal(r.status, 'underwater');
  assert.ok(r.paperEquity < 0);
  assert.ok(r.cushionUnderwater < 0);
});

test('seriously-underwater: cltv 125% exactly takes precedence over underwater', () => {
  const r = calculateHomeEquity({ ...base, mortgageBalance: 450000, otherLoans: 50000 });
  close(r.cltv, 1.25);
  assert.equal(r.status, 'seriously-underwater');
});

test('boundaries: cltv exactly 80% is healthy; exactly 100% with sale cash < 0 is sale-underwater', () => {
  assert.equal(calculateHomeEquity({ ...base, mortgageBalance: 320000 }).status, 'healthy');
  assert.equal(calculateHomeEquity({ ...base, mortgageBalance: 400000 }).status, 'sale-underwater');
  assert.equal(calculateHomeEquity({ ...base, mortgageBalance: 400000, sellingCostPct: 0 }).status, 'thin');
});

test('dueAtSale counts toward total debt, paper equity, and sale cash but not cltv', () => {
  const r = calculateHomeEquity({ ...base, mortgageBalance: 280000, dueAtSale: 15000 });
  assert.equal(r.totalDebt, 295000);
  assert.equal(r.paperEquity, 105000);
  close(r.saleCash, 376000 - 295000);
  close(r.cltv, 0.7);
  assert.equal(r.hasDueAtSale, true);
  assert.equal(calculateHomeEquity({ ...base, mortgageBalance: 280000 }).hasDueAtSale, false);
});

test('dueAtSale that wipes out paper equity is treated as underwater even when cltv <= 100%', () => {
  const r = calculateHomeEquity({ ...base, mortgageBalance: 380000, dueAtSale: 30000 });
  close(r.cltv, 0.95);
  assert.ok(r.paperEquity < 0);
  assert.equal(r.status, 'underwater');
});

test('stress scenario reruns everything at 90% of home value', () => {
  const r = calculateHomeEquity({ ...base, mortgageBalance: 340000 }); // cltv 85%
  assert.equal(r.status, 'thin');
  assert.equal(r.stress.homeValue, 360000);
  close(r.stress.cltv, 340000 / 360000);
  assert.equal(r.stress.paperEquity, 20000);
  close(r.stress.saleCash, 360000 * 0.94 - 340000);
  assert.equal(r.stress.status, 'sale-underwater');
});

test('PMI check: null without original price, true/false at the 80% line', () => {
  assert.equal(calculateHomeEquity({ ...base, mortgageBalance: 300000 }).checklist.dropPmi, null);
  assert.equal(calculateHomeEquity({ ...base, mortgageBalance: 300000, originalPrice: 375000 }).checklist.dropPmi, true);
  assert.equal(calculateHomeEquity({ ...base, mortgageBalance: 300001, originalPrice: 375000 }).checklist.dropPmi, false);
});

test('homeValue = 0 returns a validation message instead of dividing by zero', () => {
  const r = calculateHomeEquity({ homeValue: 0, mortgageBalance: 200000 });
  assert.ok(r.error);
  assert.equal(r.status, undefined);
});

test('other invalid inputs return validation messages', () => {
  assert.ok(calculateHomeEquity({ homeValue: -5, mortgageBalance: 1 }).error);
  assert.ok(calculateHomeEquity({ homeValue: 400000, mortgageBalance: NaN }).error);
  assert.ok(calculateHomeEquity({ homeValue: 400000, mortgageBalance: -1 }).error);
  assert.ok(calculateHomeEquity({ homeValue: 400000, mortgageBalance: 1, sellingCostPct: 100 }).error);
});

test('zero mortgage balance (paid off) is healthy with full equity', () => {
  const r = calculateHomeEquity({ ...base, mortgageBalance: 0 });
  assert.equal(r.status, 'healthy');
  assert.equal(r.paperEquity, 400000);
  close(r.cushionUnderwater, 1);
});
