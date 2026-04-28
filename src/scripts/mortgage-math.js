/**
 * Mortgage math utilities — pure functions, zero dependencies.
 *
 * All functions assume:
 *   - rate is annual percentage (e.g., 6.5 for 6.5%)
 *   - termMonths is total remaining term in months
 *   - balance, payment, interest are in dollars (or principal currency)
 */

/**
 * Standard mortgage payment formula.
 * P&I only — does not include taxes, insurance, escrow.
 *
 * Formula: M = P * (r(1+r)^n) / ((1+r)^n - 1)
 *   where r = monthly rate, n = term in months
 */
export function monthlyPayment(balance, annualRate, termMonths) {
  if (balance <= 0 || termMonths <= 0) return 0;
  const r = annualRate / 100 / 12;
  if (r === 0) return balance / termMonths; // 0% rate edge case
  const factor = Math.pow(1 + r, termMonths);
  return (balance * (r * factor)) / (factor - 1);
}

/**
 * Total interest paid over the life of a loan.
 */
export function totalInterest(balance, annualRate, termMonths) {
  const payment = monthlyPayment(balance, annualRate, termMonths);
  return payment * termMonths - balance;
}

/**
 * Generate full amortization schedule.
 * Returns array of {month, payment, principal, interest, balance, cumulativeInterest}
 */
export function amortizationSchedule(balance, annualRate, termMonths) {
  const r = annualRate / 100 / 12;
  const payment = monthlyPayment(balance, annualRate, termMonths);
  const schedule = [];
  let remaining = balance;
  let cumulativeInterest = 0;

  for (let month = 1; month <= termMonths; month++) {
    const interest = remaining * r;
    const principal = payment - interest;
    remaining = Math.max(0, remaining - principal);
    cumulativeInterest += interest;
    schedule.push({
      month,
      payment,
      principal,
      interest,
      balance: remaining,
      cumulativeInterest,
    });
    if (remaining <= 0.01) break;
  }
  return schedule;
}

/**
 * Recast math.
 *
 * A recast applies a lump sum to principal and re-amortizes the loan
 * over the remaining term at the same rate. The term does NOT shorten;
 * the monthly payment goes down.
 *
 * Returns a complete comparison object with all 3 scenarios:
 *   1. No recast (baseline) — keep paying current payment
 *   2. Recast — apply lump sum, payment recalculated for remaining term
 *   3. Lump sum + keep paying old payment (extra-payment strategy)
 */
export function calculateRecast({
  currentBalance,
  annualRate,
  remainingTermMonths,
  lumpSum,
  recastFee = 250,
}) {
  // Validation
  if (currentBalance <= 0 || annualRate < 0 || remainingTermMonths <= 0 || lumpSum < 0) {
    return null;
  }
  if (lumpSum >= currentBalance) {
    return { error: 'Lump sum exceeds current balance — your loan would be paid off.' };
  }

  // Scenario 1: No recast (baseline)
  const baselinePayment = monthlyPayment(currentBalance, annualRate, remainingTermMonths);
  const baselineTotalInterest = baselinePayment * remainingTermMonths - currentBalance;

  // Scenario 2: Recast — new balance, same term, same rate, payment recalculates
  const newBalance = currentBalance - lumpSum;
  const recastPayment = monthlyPayment(newBalance, annualRate, remainingTermMonths);
  const recastTotalInterest = recastPayment * remainingTermMonths - newBalance;

  // Scenario 3: Extra payment strategy — apply lump sum but keep paying baseline payment
  // (i.e., loan pays off faster, no payment reduction, interest savings come from shorter term)
  const extraPaymentSchedule = simulateExtraPayment(
    newBalance,
    annualRate,
    baselinePayment // keep paying old payment
  );
  const extraPaymentTotalInterest = extraPaymentSchedule.totalInterest;
  const extraPaymentMonthsToPayoff = extraPaymentSchedule.monthsToPayoff;

  // Savings analysis
  const monthlySavings = baselinePayment - recastPayment;
  const annualSavings = monthlySavings * 12;
  const interestSavingsRecast = baselineTotalInterest - recastTotalInterest;
  const interestSavingsExtraPayment = baselineTotalInterest - extraPaymentTotalInterest;

  // Recast fee payback (months for monthly savings to recoup the fee)
  const feePaybackMonths = monthlySavings > 0 ? recastFee / monthlySavings : Infinity;

  return {
    inputs: {
      currentBalance,
      annualRate,
      remainingTermMonths,
      lumpSum,
      recastFee,
    },
    baseline: {
      payment: baselinePayment,
      totalInterest: baselineTotalInterest,
      months: remainingTermMonths,
    },
    recast: {
      newBalance,
      payment: recastPayment,
      totalInterest: recastTotalInterest,
      months: remainingTermMonths,
      monthlySavings,
      annualSavings,
      interestSavings: interestSavingsRecast,
      feePaybackMonths,
    },
    extraPayment: {
      newBalance,
      payment: baselinePayment,
      totalInterest: extraPaymentTotalInterest,
      months: extraPaymentMonthsToPayoff,
      monthsSaved: remainingTermMonths - extraPaymentMonthsToPayoff,
      interestSavings: interestSavingsExtraPayment,
    },
    // The honest comparison: which strategy saves more total interest?
    bestStrategy: interestSavingsExtraPayment > interestSavingsRecast ? 'extraPayment' : 'recast',
    interestDifference: Math.abs(interestSavingsExtraPayment - interestSavingsRecast),
  };
}

/**
 * Simulate paying a fixed monthly amount on a loan until paid off.
 * Used for the extra-payment-strategy comparison.
 */
function simulateExtraPayment(balance, annualRate, monthlyPaymentAmount) {
  const r = annualRate / 100 / 12;
  let remaining = balance;
  let totalInterest = 0;
  let months = 0;
  const maxMonths = 600; // 50-year safety cap

  while (remaining > 0.01 && months < maxMonths) {
    const interest = remaining * r;
    const principal = Math.min(monthlyPaymentAmount - interest, remaining);
    if (principal <= 0) break; // payment doesn't cover interest — error case
    remaining -= principal;
    totalInterest += interest;
    months++;
  }

  return {
    totalInterest,
    monthsToPayoff: months,
  };
}

/**
 * Format a number as USD currency.
 */
export function formatCurrency(amount, options = {}) {
  if (!isFinite(amount)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: options.decimals ?? 0,
    maximumFractionDigits: options.decimals ?? 0,
  }).format(amount);
}

/**
 * Format months as "X years, Y months".
 */
export function formatDuration(months) {
  if (!isFinite(months) || months <= 0) return '—';
  const years = Math.floor(months / 12);
  const remainingMonths = Math.round(months % 12);
  if (years === 0) return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
  if (remainingMonths === 0) return `${years} year${years !== 1 ? 's' : ''}`;
  return `${years} yr, ${remainingMonths} mo`;
}

/**
 * Format percentage.
 */
export function formatPercent(value, decimals = 2) {
  return `${value.toFixed(decimals)}%`;
}
