import { test } from 'node:test';
import assert from 'node:assert/strict';
import { armRatePath, calculateARMReset, monthlyPayment } from '../src/scripts/mortgage-math.js';

const close = (a, b, eps = 0.01) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);
const caps215 = { initialCap: 2, periodicCap: 1, lifetimeCap: 5 };

test('first reset limited by the initial cap, then steps by the periodic cap to the fully indexed rate', () => {
  const r = armRatePath({ startRate: 2.75, index: 3.9, margin: 2.75, ...caps215 });
  assert.equal(r.fullyIndexed, 6.65);
  assert.deepEqual(r.path, [4.75, 5.75, 6.65]);
});

test('first reset limited by the fully indexed rate when it is within the initial cap', () => {
  const r = armRatePath({ startRate: 5.5, index: 3.9, margin: 2.75, ...caps215 });
  assert.deepEqual(r.path, [6.65]);
});

test('lifetime cap binds below the fully indexed rate', () => {
  const r = armRatePath({ startRate: 2.0, index: 6.0, margin: 3.0, initialCap: 5, periodicCap: 2, lifetimeCap: 5 });
  assert.equal(r.maxRate, 7);
  assert.equal(r.target, 7);
  assert.deepEqual(r.path, [7]);
});

test('index drop: rate falls, limited by the per-adjustment caps and floored at the margin', () => {
  const r = armRatePath({ startRate: 7.0, index: 0.5, margin: 2.75, ...caps215 });
  assert.equal(r.target, 3.25);
  assert.deepEqual(r.path, [5, 4, 3.25]);
  const floored = armRatePath({ startRate: 4.0, index: 0, margin: 2.75, ...caps215 });
  assert.deepEqual(floored.path, [2.75]);
});

test('a stated first rate replaces the computed one and the path continues toward the target', () => {
  const r = armRatePath({ startRate: 2.75, index: 3.9, margin: 2.75, ...caps215, firstRate: 5.25 });
  assert.deepEqual(r.path, [5.25, 6.25, 6.65]);
});

test('payment is recalculated on the remaining balance and term at each reset', () => {
  const balance = 353983.59;
  const r = calculateARMReset({
    currentBalance: balance, startRate: 2.75, index: 3.9, margin: 2.75, ...caps215,
    adjustmentMonths: 6, remainingTermMonths: 300, refiRate: 6.5, refiClosingCosts: 5000, holdYears: 5,
  });
  close(r.ratePath[0].payment, monthlyPayment(balance, 4.75, 300));
  close(r.ratePath[0].payment, 2018.12);
  assert.equal(r.ratePath[1].month, 7);
  assert.equal(r.ratePath[2].month, 13);
  // The third payment is the 6.65% payment on the balance left after 12 months, over 288 months.
  assert.ok(r.ratePath[2].payment > r.ratePath[1].payment);
  close(r.holdArm.worstCaseMonthlyPayment, monthlyPayment(balance, 7.75, 300));
  assert.equal(r.firstResetRate, 4.75);
  assert.equal(r.lifetimeMaxRate, 7.75);
});

test('invalid input returns null', () => {
  const base = {
    currentBalance: 300000, startRate: 3, index: 4, margin: 2.75, ...caps215,
    adjustmentMonths: 6, remainingTermMonths: 300, refiRate: 6.5, holdYears: 5,
  };
  assert.equal(calculateARMReset({ ...base, currentBalance: 0 }), null);
  assert.equal(calculateARMReset({ ...base, remainingTermMonths: 0 }), null);
  assert.equal(calculateARMReset({ ...base, index: NaN }), null);
  assert.equal(calculateARMReset({ ...base, adjustmentMonths: 0 }), null);
});
