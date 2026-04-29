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

/* ============================================================================
 * PMI Removal math
 * ============================================================================
 *
 * Private mortgage insurance (PMI) is required when loan-to-value ratio is
 * above 80% on conventional loans. The Homeowners Protection Act gives borrowers
 * two paths to remove it:
 *
 *   1. Automatic termination at 78% loan-to-value (lender required by law)
 *   2. Borrower-requested cancellation at 80% loan-to-value (lender required to honor)
 *
 * The honest math: most homeowners don't realize they can request removal at 80%
 * and instead wait for automatic 78% termination, paying months of unnecessary PMI.
 *
 * This calculator shows three scenarios:
 *   1. Do nothing: wait for automatic 78% loan-to-value termination
 *   2. Request removal at 80% loan-to-value (saves months of PMI)
 *   3. Accelerate principal to hit 80% faster (shortest PMI exposure)
 */
export function calculatePMIRemoval({
  homeValue,
  currentBalance,
  monthlyPMI,
  annualRate,
  remainingTermMonths,
  extraMonthlyPrincipal = 0,
}) {
  if (homeValue <= 0 || currentBalance <= 0 || monthlyPMI < 0 || annualRate < 0 || remainingTermMonths <= 0) {
    return null;
  }

  const currentLTV = (currentBalance / homeValue) * 100;

  /* If already at or below 80%, PMI is no longer required (or shouldn't be).
   * Below 78%, lender must auto-terminate. Between 78 and 80%, borrower can request removal. */
  if (currentLTV <= 80) {
    let message;
    if (currentLTV <= 78) {
      message = `Your loan-to-value ratio is ${currentLTV.toFixed(1)}%, already below the 78% auto-termination threshold. PMI should already be removed; if you are still being charged, contact your servicer in writing immediately to request retroactive refund of premiums paid below 78%.`;
    } else {
      message = `Your loan-to-value ratio is ${currentLTV.toFixed(1)}%, already at or below 80%. You have the legal right to request PMI removal in writing today under the Homeowners Protection Act. Send your servicer a written request; they must honor it if you are current on payments.`;
    }
    return {
      error: message,
      currentLTV,
      monthlyPMI,
    };
  }

  const target80Balance = homeValue * 0.80;
  const target78Balance = homeValue * 0.78;

  // Standard payment, no extra
  const baselinePayment = monthlyPayment(currentBalance, annualRate, remainingTermMonths);

  // Scenario 1: Do nothing, wait for auto 78% termination
  const monthsTo78 = monthsToReachBalance(currentBalance, annualRate, baselinePayment, target78Balance);
  const pmiPaidWaiting = monthsTo78 * monthlyPMI;

  // Scenario 2: Request removal at 80% loan-to-value
  const monthsTo80 = monthsToReachBalance(currentBalance, annualRate, baselinePayment, target80Balance);
  const pmiPaidRequesting = monthsTo80 * monthlyPMI;
  const monthsSavedRequesting = monthsTo78 - monthsTo80;
  const pmiSavingsRequesting = pmiPaidWaiting - pmiPaidRequesting;

  // Scenario 3: Accelerate principal payments to hit 80% faster
  let monthsTo80Accelerated = monthsTo80;
  let pmiPaidAccelerated = pmiPaidRequesting;
  let extraPrincipalPaid = 0;

  if (extraMonthlyPrincipal > 0) {
    const acceleratedResult = monthsToReachBalanceWithExtra(
      currentBalance,
      annualRate,
      baselinePayment,
      extraMonthlyPrincipal,
      target80Balance
    );
    monthsTo80Accelerated = acceleratedResult.months;
    pmiPaidAccelerated = monthsTo80Accelerated * monthlyPMI;
    extraPrincipalPaid = monthsTo80Accelerated * extraMonthlyPrincipal;
  }

  const monthsSavedAccelerated = monthsTo78 - monthsTo80Accelerated;
  const pmiSavingsAccelerated = pmiPaidWaiting - pmiPaidAccelerated;
  // Net benefit accounts for the extra principal paid (which is not "lost" but is committed early)
  const netBenefitAccelerated = pmiSavingsAccelerated;

  return {
    inputs: {
      homeValue,
      currentBalance,
      monthlyPMI,
      annualRate,
      remainingTermMonths,
      extraMonthlyPrincipal,
    },
    currentLTV,
    monthlyPayment: baselinePayment,
    waiting: {
      months: monthsTo78,
      pmiPaid: pmiPaidWaiting,
      strategyName: 'Do nothing (wait for auto removal)',
      description: 'PMI auto-terminates at 78% loan-to-value',
    },
    requesting: {
      months: monthsTo80,
      pmiPaid: pmiPaidRequesting,
      monthsSaved: monthsSavedRequesting,
      pmiSaved: pmiSavingsRequesting,
      strategyName: 'Request removal at 80% loan-to-value',
      description: 'Send written request as soon as you hit 80%',
    },
    accelerated: {
      months: monthsTo80Accelerated,
      pmiPaid: pmiPaidAccelerated,
      extraPrincipalPaid,
      monthsSaved: monthsSavedAccelerated,
      pmiSaved: pmiSavingsAccelerated,
      netBenefit: netBenefitAccelerated,
      strategyName: 'Accelerated principal + request',
      description: 'Pay extra principal to hit 80% faster',
    },
    bestStrategy: extraMonthlyPrincipal > 0 && pmiSavingsAccelerated > pmiSavingsRequesting
      ? 'accelerated'
      : 'requesting',
  };
}

/* Helper: months to reach a target balance with fixed monthly payment */
function monthsToReachBalance(startBalance, annualRate, monthlyAmount, targetBalance) {
  if (startBalance <= targetBalance) return 0;
  const r = annualRate / 100 / 12;
  let remaining = startBalance;
  let months = 0;
  const maxMonths = 600;
  while (remaining > targetBalance && months < maxMonths) {
    const interest = remaining * r;
    const principal = monthlyAmount - interest;
    if (principal <= 0) return Infinity;
    remaining -= principal;
    months++;
  }
  return months;
}

/* Helper: months to reach target balance with extra principal payment each month */
function monthsToReachBalanceWithExtra(startBalance, annualRate, baselinePayment, extraPrincipal, targetBalance) {
  if (startBalance <= targetBalance) return { months: 0 };
  const r = annualRate / 100 / 12;
  let remaining = startBalance;
  let months = 0;
  const maxMonths = 600;
  while (remaining > targetBalance && months < maxMonths) {
    const interest = remaining * r;
    const principal = baselinePayment - interest + extraPrincipal;
    if (principal <= 0) return { months: Infinity };
    remaining -= principal;
    months++;
  }
  return { months };
}

/* ============================================================================
 * Biweekly Payoff math
 * ============================================================================
 *
 * Biweekly mortgage programs charge customers a setup or per-payment fee for
 * the "convenience" of splitting their monthly payment in half and paying every
 * two weeks. The math: 26 half-payments per year = 13 full monthly payments
 * (one extra per year), which shortens the loan and saves interest.
 *
 * The honest math: you can replicate this savings for free by adding 1/12th
 * of your monthly payment to each monthly payment. Same interest savings,
 * zero fee.
 *
 * Three scenarios:
 *   1. Standard monthly payments (do nothing)
 *   2. Biweekly via paid program (with fee)
 *   3. Monthly + 1/12 (free DIY equivalent)
 */
export function calculateBiweekly({
  currentBalance,
  annualRate,
  remainingTermMonths,
  programFee = 0,
}) {
  if (currentBalance <= 0 || annualRate < 0 || remainingTermMonths <= 0 || programFee < 0) {
    return null;
  }

  const monthlyPmt = monthlyPayment(currentBalance, annualRate, remainingTermMonths);
  const baselineTotalInterest = monthlyPmt * remainingTermMonths - currentBalance;

  // Biweekly: 26 half-payments per year, simulated month-by-month with extra payment
  // Effectively pays 13 monthly payments per year instead of 12
  // We model this as: every 12th payment, pay an extra full payment
  // Practical equivalent: extra principal of monthlyPmt/12 per month (slightly different timing,
  // but functionally identical over loan life)
  const oneTwelfthExtra = monthlyPmt / 12;

  // Scenario 2: biweekly via program — same math as monthly + 1/12 in terms of payoff,
  // but with program fee added to total cost
  const biweeklyResult = simulateExtraPayment(
    currentBalance,
    annualRate,
    monthlyPmt + oneTwelfthExtra
  );

  // Scenario 3: monthly + 1/12 DIY (same payoff math, no fee)
  const diyResult = biweeklyResult; // identical math

  return {
    inputs: {
      currentBalance,
      annualRate,
      remainingTermMonths,
      programFee,
    },
    monthlyPayment: monthlyPmt,
    oneTwelfthExtra,
    standard: {
      monthlyAmount: monthlyPmt,
      months: remainingTermMonths,
      totalInterest: baselineTotalInterest,
      totalCost: baselineTotalInterest,
      strategyName: 'Standard monthly payments',
    },
    biweeklyProgram: {
      effectiveMonthlyAmount: monthlyPmt + oneTwelfthExtra,
      months: biweeklyResult.monthsToPayoff,
      monthsSaved: remainingTermMonths - biweeklyResult.monthsToPayoff,
      totalInterest: biweeklyResult.totalInterest,
      programFee,
      totalCost: biweeklyResult.totalInterest + programFee,
      interestSavingsVsStandard: baselineTotalInterest - biweeklyResult.totalInterest,
      netSavingsVsStandard: (baselineTotalInterest - biweeklyResult.totalInterest) - programFee,
      strategyName: 'Biweekly via paid program',
    },
    diyMonthlyExtra: {
      effectiveMonthlyAmount: monthlyPmt + oneTwelfthExtra,
      months: diyResult.monthsToPayoff,
      monthsSaved: remainingTermMonths - diyResult.monthsToPayoff,
      totalInterest: diyResult.totalInterest,
      totalCost: diyResult.totalInterest,
      interestSavingsVsStandard: baselineTotalInterest - diyResult.totalInterest,
      netSavingsVsStandard: baselineTotalInterest - diyResult.totalInterest,
      strategyName: 'Monthly + 1/12 extra (free DIY)',
    },
    /* The honest finding: monthly + 1/12 always equals or beats biweekly program (program loses by program fee) */
    bestStrategy: 'diyMonthlyExtra',
    feeWaste: programFee,
  };
}

/* ============================================================================
 * ARM Reset math
 * ============================================================================
 *
 * Adjustable-rate mortgages (ARMs) reset to a new rate after their initial
 * fixed period (typically 5, 7, or 10 years). The new rate is bounded by:
 *   - Initial cap: max change at first reset (typical 2 percentage points)
 *   - Periodic cap: max change at each subsequent reset (typical 2 points)
 *   - Lifetime cap: max change ever from original rate (typical 5 points)
 *
 * The honest math: the worst case is bounded. Many homeowners panic-refinance
 * to a higher fixed rate when the math says hold the ARM (because the cap
 * structure caps their downside more cheaply than refinancing eliminates it).
 *
 * Three scenarios:
 *   1. Hold the ARM at the expected new rate
 *   2. Refinance to fixed at current market rate
 *   3. Recast with a lump sum (if available) — keeps the ARM but lowers payment
 */
export function calculateARMReset({
  currentBalance,
  originalRate,
  expectedNewRate,
  lifetimeCap,
  remainingTermMonths,
  refiRate,
  refiClosingCosts = 5000,
  holdYears = 5,
}) {
  if (currentBalance <= 0 || expectedNewRate < 0 || refiRate < 0 || remainingTermMonths <= 0 || holdYears <= 0) {
    return null;
  }

  const lifetimeMaxRate = originalRate + lifetimeCap;
  const holdMonths = Math.min(holdYears * 12, remainingTermMonths);

  /* Scenario 1: Hold the ARM at expected new rate */
  const armPayment = monthlyPayment(currentBalance, expectedNewRate, remainingTermMonths);
  const armSchedule = amortizationSchedule(currentBalance, expectedNewRate, remainingTermMonths);
  const armCostOverHold = armPayment * holdMonths;
  const armBalanceAtEnd = armSchedule[holdMonths - 1]?.balance ?? 0;
  const armInterestOverHold = armSchedule[holdMonths - 1]?.cumulativeInterest ?? 0;

  /* Scenario 1b: Worst case ARM payment if rates hit lifetime cap */
  const armWorstCasePayment = monthlyPayment(currentBalance, lifetimeMaxRate, remainingTermMonths);

  /* Scenario 2: Refinance to fixed */
  const refiPayment = monthlyPayment(currentBalance, refiRate, remainingTermMonths);
  const refiSchedule = amortizationSchedule(currentBalance, refiRate, remainingTermMonths);
  const refiCostOverHold = refiPayment * holdMonths + refiClosingCosts;
  const refiBalanceAtEnd = refiSchedule[holdMonths - 1]?.balance ?? 0;
  const refiInterestOverHold = refiSchedule[holdMonths - 1]?.cumulativeInterest ?? 0;

  /* Comparison: net cost over hold period (interest paid + closing costs - balance reduction) */
  const armNetCost = armInterestOverHold;
  const refiNetCost = refiInterestOverHold + refiClosingCosts;
  const holdSavingsVsRefi = refiNetCost - armNetCost;

  return {
    inputs: {
      currentBalance,
      originalRate,
      expectedNewRate,
      lifetimeCap,
      remainingTermMonths,
      refiRate,
      refiClosingCosts,
      holdYears,
    },
    lifetimeMaxRate,
    holdMonths,
    holdArm: {
      monthlyPayment: armPayment,
      worstCaseMonthlyPayment: armWorstCasePayment,
      interestOverHold: armInterestOverHold,
      balanceAtEnd: armBalanceAtEnd,
      netCostOverHold: armNetCost,
      strategyName: 'Hold the ARM',
    },
    refinance: {
      monthlyPayment: refiPayment,
      interestOverHold: refiInterestOverHold,
      closingCosts: refiClosingCosts,
      balanceAtEnd: refiBalanceAtEnd,
      netCostOverHold: refiNetCost,
      strategyName: 'Refinance to fixed',
    },
    /* Honest comparison */
    bestStrategy: armNetCost <= refiNetCost ? 'holdArm' : 'refinance',
    differenceOverHold: Math.abs(armNetCost - refiNetCost),
  };
}

/* ============================================================================
 * HELOC vs Cash-Out Refinance math
 * ============================================================================
 *
 * Two ways to access home equity:
 *   - HELOC: keep your existing mortgage, take a separate variable-rate line of credit
 *   - Cash-out refinance: replace mortgage with a new larger loan at current rates
 *
 * The honest math: depends entirely on the spread between your existing mortgage
 * rate, the HELOC rate, and the refinance rate, plus how long you'll keep the debt.
 * No forced contrarian angle. Show fair math.
 */
export function calculateHelocVsRefi({
  currentBalance,
  currentRate,
  remainingTermMonths,
  cashNeeded,
  helocRate,
  refiRate,
  refiClosingCosts = 5000,
  holdYears = 7,
}) {
  if (currentBalance <= 0 || cashNeeded <= 0 || holdYears <= 0) {
    return null;
  }

  const holdMonths = Math.min(holdYears * 12, remainingTermMonths);

  /* Scenario 1: HELOC (keep mortgage at current rate, add HELOC at HELOC rate) */
  const mortgagePayment = monthlyPayment(currentBalance, currentRate, remainingTermMonths);
  const mortgageSchedule = amortizationSchedule(currentBalance, currentRate, remainingTermMonths);
  const mortgageInterestOverHold = mortgageSchedule[holdMonths - 1]?.cumulativeInterest ?? 0;

  /* HELOC: simplified as interest-only on full balance for hold period
   * (real HELOCs have a draw period and then amortize, but for comparison this is a
   * conservative estimate that's actually slightly favorable to HELOC) */
  const helocMonthlyInterest = (cashNeeded * (helocRate / 100)) / 12;
  const helocInterestOverHold = helocMonthlyInterest * holdMonths;

  const helocTotalCost = mortgageInterestOverHold + helocInterestOverHold;
  const helocTotalMonthlyPayment = mortgagePayment + helocMonthlyInterest;

  /* Scenario 2: Cash-out refinance — new loan at refi rate, balance = current + cash needed */
  const refiBalance = currentBalance + cashNeeded;
  const refiPayment = monthlyPayment(refiBalance, refiRate, remainingTermMonths);
  const refiSchedule = amortizationSchedule(refiBalance, refiRate, remainingTermMonths);
  const refiInterestOverHold = refiSchedule[holdMonths - 1]?.cumulativeInterest ?? 0;
  const refiTotalCost = refiInterestOverHold + refiClosingCosts;

  /* Net comparison */
  const helocNetCost = helocTotalCost;
  const refiNetCost = refiTotalCost;
  const difference = Math.abs(helocNetCost - refiNetCost);

  return {
    inputs: {
      currentBalance,
      currentRate,
      remainingTermMonths,
      cashNeeded,
      helocRate,
      refiRate,
      refiClosingCosts,
      holdYears,
    },
    holdMonths,
    heloc: {
      mortgagePayment,
      helocMonthlyInterest,
      totalMonthlyPayment: helocTotalMonthlyPayment,
      mortgageInterestOverHold,
      helocInterestOverHold,
      totalCost: helocTotalCost,
      strategyName: 'HELOC + keep mortgage',
    },
    refinance: {
      newBalance: refiBalance,
      monthlyPayment: refiPayment,
      interestOverHold: refiInterestOverHold,
      closingCosts: refiClosingCosts,
      totalCost: refiTotalCost,
      strategyName: 'Cash-out refinance',
    },
    bestStrategy: helocNetCost <= refiNetCost ? 'heloc' : 'refinance',
    difference,
  };
}

/* ============================================================================
 * Buy vs. Rent math (corrected wealth framing)
 * ============================================================================
 *
 * The right way to compare buying vs. renting is to compare wealth (assets you'd
 * have at end of hold period) on each side, where housing costs themselves are
 * consumption (you'd pay them either way for shelter).
 *
 * BUYER'S WEALTH AT END = Home equity at sale - cumulative tax savings already
 *   captured (added back as wealth) - any investment portfolio if buying was
 *   cheaper monthly than renting (rare but happens when buyer's monthly is below
 *   the rent the renter would have paid).
 *
 * RENTER'S WEALTH AT END = (Down payment + closing costs the buyer would have
 *   paid) compounded at investment return + (monthly housing cost difference)
 *   compounded if renting is cheaper than buying monthly.
 *
 * The honest comparison surfaces the contrarian truth:
 *   - In high rate environments, the renter usually wins for short holds (<7yr)
 *     because the down payment compounds in the market while the buyer's equity
 *     grows slowly (most of the mortgage payment is interest in early years).
 *   - In low rate environments or long holds (10+yr), buying usually wins.
 *
 * Defaults reflect honest assumptions:
 *   - 1.5% maintenance (BLS data; calculators using 0.5% understate this)
 *   - 4% rent inflation (recent reality)
 *   - 6% selling costs (realtor + transfer + staging)
 *   - 7% investment return (S&P 500 long-term nominal)
 */

export function calculateBuyVsRent({
  homePrice,
  downPaymentPct = 20,
  mortgageRate,
  loanTermYears = 30,
  propertyTaxPct = 1.2,
  insuranceAnnual = 1800,
  hoaMonthly = 0,
  maintenancePct = 1.5,
  appreciationPct = 3.0,
  closingCostsPct = 3.0,
  monthlyRent,
  rentInflationPct = 4.0,
  rentersInsuranceAnnual = 200,
  holdYears = 7,
  marginalTaxRate = 24,
  investmentReturnPct = 7.0,
}) {
  if (homePrice <= 0 || mortgageRate < 0 || loanTermYears <= 0 || holdYears <= 0 || monthlyRent <= 0) {
    return null;
  }

  /* Loan setup */
  const downPayment = homePrice * (downPaymentPct / 100);
  const loanAmount = homePrice - downPayment;
  const closingCosts = homePrice * (closingCostsPct / 100);
  const initialCashOut = downPayment + closingCosts;
  const monthsTotal = loanTermYears * 12;
  const monthlyMortgagePayment = monthlyPayment(loanAmount, mortgageRate, monthsTotal);
  const monthlyRate = mortgageRate / 100 / 12;
  const taxDeductionLimit = 750000;

  /* Year-by-year simulation */
  const buyingByYear = [];
  const rentingByYear = [];

  let remainingLoanBalance = loanAmount;
  let currentHomeValue = homePrice;
  let currentMonthlyRent = monthlyRent;
  let buyerSideInvestment = 0; /* if buying is cheaper than renting in some year, buyer banks the difference */
  let renterSideInvestment = initialCashOut; /* renter starts with the down payment + closing costs invested */
  let cumulativeTaxSavings = 0;

  for (let year = 1; year <= 15; year++) {
    /* === Compute this year's mortgage interest and remaining balance === */
    let interestPaidThisYear = 0;
    for (let m = 0; m < 12; m++) {
      const interestThisMonth = remainingLoanBalance * monthlyRate;
      const principalThisMonth = monthlyMortgagePayment - interestThisMonth;
      interestPaidThisYear += interestThisMonth;
      remainingLoanBalance = Math.max(0, remainingLoanBalance - principalThisMonth);
    }

    /* Tax savings from mortgage interest deduction (capped at $750K loan balance) */
    const deductibleInterest = loanAmount > taxDeductionLimit
      ? interestPaidThisYear * (taxDeductionLimit / loanAmount)
      : interestPaidThisYear;
    const taxSavingsThisYear = deductibleInterest * (marginalTaxRate / 100);
    cumulativeTaxSavings += taxSavingsThisYear;

    /* Buying costs this year (excluding tax savings) */
    const propertyTaxThisYear = currentHomeValue * (propertyTaxPct / 100);
    const insuranceThisYear = insuranceAnnual;
    const hoaThisYear = hoaMonthly * 12;
    const maintenanceThisYear = currentHomeValue * (maintenancePct / 100);
    const mortgagePaymentsThisYear = monthlyMortgagePayment * 12;
    const totalBuyingCostsThisYear = mortgagePaymentsThisYear + propertyTaxThisYear
      + insuranceThisYear + hoaThisYear + maintenanceThisYear - taxSavingsThisYear;

    /* Renting costs this year */
    const rentThisYear = currentMonthlyRent * 12;
    const totalRentingCostsThisYear = rentThisYear + rentersInsuranceAnnual;

    /* Cash flow difference: positive means buying costs MORE per year than renting,
     * so the renter has surplus to invest. Negative means buying is cheaper, so the
     * buyer can invest the surplus. */
    const cashFlowDiff = totalBuyingCostsThisYear - totalRentingCostsThisYear;
    if (cashFlowDiff > 0) {
      /* Buying is more expensive — renter invests the difference */
      renterSideInvestment += cashFlowDiff;
    } else if (cashFlowDiff < 0) {
      /* Buying is cheaper — buyer can invest the difference */
      buyerSideInvestment += Math.abs(cashFlowDiff);
    }

    /* Both sides' investments grow at market rate */
    renterSideInvestment = renterSideInvestment * (1 + investmentReturnPct / 100);
    buyerSideInvestment = buyerSideInvestment * (1 + investmentReturnPct / 100);

    /* Home value appreciates */
    currentHomeValue = currentHomeValue * (1 + appreciationPct / 100);

    /* Wealth at end of this year if we sold/exited now */
    const sellingCosts = currentHomeValue * 0.06;
    const homeEquity = Math.max(0, currentHomeValue - sellingCosts - remainingLoanBalance);

    /* Buyer's total wealth = home equity + any investments accumulated from cheaper monthly costs */
    const buyingWealthThisYear = homeEquity + buyerSideInvestment;

    /* Renter's total wealth = investment portfolio (rent is consumption, not subtracted) */
    const rentingWealthThisYear = renterSideInvestment;

    buyingByYear.push({
      year,
      homeValue: currentHomeValue,
      remainingLoan: remainingLoanBalance,
      homeEquity,
      buyerSideInvestment,
      cumulativeTaxSavings,
      monthlyCost: totalBuyingCostsThisYear / 12,
      wealth: buyingWealthThisYear,
    });

    rentingByYear.push({
      year,
      rentThisMonth: currentMonthlyRent,
      investmentBalance: renterSideInvestment,
      monthlyCost: totalRentingCostsThisYear / 12,
      wealth: rentingWealthThisYear,
    });

    /* Rent inflates for next year */
    currentMonthlyRent = currentMonthlyRent * (1 + rentInflationPct / 100);
  }

  /* Pull out values at the requested hold period (clamped to series length) */
  const idx = Math.min(holdYears - 1, buyingByYear.length - 1);
  const buyingAtHold = buyingByYear[idx];
  const rentingAtHold = rentingByYear[idx];
  const wealthDifference = buyingAtHold.wealth - rentingAtHold.wealth;
  const winner = wealthDifference > 0 ? 'buy' : 'rent';

  /* Break-even: first year buying overtakes renting */
  let breakEvenYear = null;
  for (let i = 0; i < buyingByYear.length; i++) {
    if (buyingByYear[i].wealth > rentingByYear[i].wealth) {
      breakEvenYear = buyingByYear[i].year;
      break;
    }
  }

  return {
    inputs: {
      homePrice, downPaymentPct, mortgageRate, loanTermYears, propertyTaxPct,
      insuranceAnnual, hoaMonthly, maintenancePct, appreciationPct, closingCostsPct,
      monthlyRent, rentInflationPct, rentersInsuranceAnnual, holdYears,
      marginalTaxRate, investmentReturnPct,
    },
    setup: {
      downPayment, loanAmount, closingCosts, monthlyMortgagePayment,
    },
    buying: {
      monthlyCost: buyingAtHold.monthlyCost,
      cumulativeTaxSavings: buyingAtHold.cumulativeTaxSavings,
      homeValueAtEnd: buyingAtHold.homeValue,
      remainingLoanAtEnd: buyingAtHold.remainingLoan,
      homeEquityAtEnd: buyingAtHold.homeEquity,
      buyerSideInvestment: buyingAtHold.buyerSideInvestment,
      wealth: buyingAtHold.wealth,
    },
    renting: {
      monthlyCost: rentingAtHold.monthlyCost,
      investmentBalance: rentingAtHold.investmentBalance,
      wealth: rentingAtHold.wealth,
    },
    comparison: {
      winner,
      wealthDifference: Math.abs(wealthDifference),
      breakEvenYear,
    },
    series: {
      buying: buyingByYear.map(y => ({ year: y.year, wealth: y.wealth })),
      renting: rentingByYear.map(y => ({ year: y.year, wealth: y.wealth })),
    },
  };
}
