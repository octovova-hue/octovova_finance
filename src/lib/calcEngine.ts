import {
  Assumptions,
  AssetAllocation,
  CalculationSummary,
  FinancialPlan,
  GoalItem,
  RiskCategory,
  RiskProfile,
  UserProfile,
} from '../types/finance';

/**
 * PURE DETERMINISTIC FINANCIAL CALCULATION ENGINE
 * Zero LLM, Zero Randomness, Zero Monte Carlo.
 * Strict mathematical determinism as specified in Section 8 & 9 of the Blueprint.
 */

// 1. Net Worth Calculation
export function computeNetWorth(assets: number[], liabilities: number[]): number {
  const totalAssets = assets.reduce((sum, val) => sum + (val || 0), 0);
  const totalLiabilities = liabilities.reduce((sum, val) => sum + (val || 0), 0);
  return Math.round(totalAssets - totalLiabilities);
}

// 2. Monthly Cash Flow
export function computeCashFlow(monthlyIncome: number, monthlyExpenses: number): number {
  return Math.round(monthlyIncome - monthlyExpenses);
}

// 3. Savings Capacity (with buffer)
export function computeSavingsCapacity(cashFlow: number, bufferPct: number = 0.10): number {
  if (cashFlow <= 0) return 0;
  return Math.round(cashFlow * (1.0 - bufferPct));
}

// 4. Emergency Fund Requirement
export function computeEmergencyFund(monthlyExpenses: number, months: number = 6): number {
  return Math.round(monthlyExpenses * months);
}

// 5. Inflation-Adjusted Goal Future Value (FV)
export function computeInflationAdjustedFV(presentCost: number, inflationRate: number, years: number): number {
  if (years <= 0 || presentCost <= 0) {
    return Math.round(presentCost || 0);
  }
  const fv = presentCost * Math.pow(1.0 + inflationRate, years);
  return Math.round(fv);
}

// 6. Retirement Corpus (4% rule / 25x multiplier)
export function computeRetirementCorpus(annualExpenses: number, multiplier: number = 25.0): number {
  return Math.round(annualExpenses * multiplier);
}

// 7. Monthly SIP Required for Goal Target
export function computeRequiredSIP(targetFV: number, annualCagrPercent: number, months: number): number {
  if (months <= 0 || targetFV <= 0) return 0;
  
  const monthlyRate = (annualCagrPercent / 100) / 12.0;
  if (monthlyRate === 0) {
    return Math.round(targetFV / months);
  }

  // Annuity Formula: FV = P * [((1 + r)^n - 1) / r] * (1 + r)
  // => P = (FV * r) / [((1 + r)^n - 1) * (1 + r)]
  const growthFactor = Math.pow(1.0 + monthlyRate, months);
  const numerator = targetFV * monthlyRate;
  const denominator = (growthFactor - 1.0) * (1.0 + monthlyRate);

  if (denominator <= 0) return Math.round(targetFV / months);

  return Math.round(numerator / denominator);
}

// 8. Compound Growth Projection
export function computeCompoundGrowth(principal: number, annualRatePercent: number, years: number): number {
  if (years <= 0 || principal <= 0) return Math.round(principal);
  const r = annualRatePercent / 100;
  return Math.round(principal * Math.pow(1.0 + r, years));
}

// 9. Risk Scoring & Category Assignment
export function calculateRiskScoreAndCategory(answers: number[]): RiskProfile {
  const rawSum = answers.reduce((sum, val) => sum + (val || 0), 0);
  const maxRaw = answers.length * 5;
  // Normalize score to 25 if fewer than 5 questions
  const score = answers.length === 5 ? rawSum : Math.max(5, Math.min(25, Math.round((rawSum / (maxRaw || 15)) * 25)));
  
  let category: RiskCategory = 'Balanced';
  let categoryDescription = 'Balanced growth with controlled volatility exposure.';

  if (score <= 9) {
    category = 'Conservative';
    categoryDescription = 'Preservation of capital with steady debt & fixed income priority.';
  } else if (score <= 14) {
    category = 'Moderate';
    categoryDescription = 'Cautious growth with dominant debt cushions and measured equity exposure.';
  } else if (score <= 19) {
    category = 'Balanced';
    categoryDescription = 'Equally balanced wealth creation with a solid defensive anchor.';
  } else if (score <= 23) {
    category = 'Growth';
    categoryDescription = 'High equity focus designed for long-term aggressive compounding.';
  } else {
    category = 'Aggressive';
    categoryDescription = 'Maximum equity compounding orientation for resilient long horizons.';
  }

  return {
    answers,
    score,
    category,
    categoryDescription,
  };
}

// 10. Allocation Rule Matrix (Section 9)
export function getAllocationForCategory(category: RiskCategory): AssetAllocation {
  switch (category) {
    case 'Conservative':
      return { equity: 25, debt: 65, cash: 10 };
    case 'Moderate':
      return { equity: 40, debt: 52, cash: 8 };
    case 'Balanced':
      return { equity: 55, debt: 40, cash: 5 };
    case 'Growth':
      return { equity: 75, debt: 21, cash: 4 };
    case 'Aggressive':
      return { equity: 85, debt: 12, cash: 3 };
  }
}

// 11. Weighted Portfolio Expected CAGR
export function computeWeightedCAGR(allocation: AssetAllocation, assumptions: Assumptions): number {
  const eqReturn = assumptions.equityReturn * 100; // e.g. 11
  const debtReturn = assumptions.debtReturn * 100; // e.g. 6.5
  const cashReturn = assumptions.cashReturn * 100; // e.g. 4.0

  const cagr = (allocation.equity * eqReturn + allocation.debt * debtReturn + allocation.cash * cashReturn) / 100;
  return Number(cagr.toFixed(1));
}

// 12. Complete User Financial Summary Aggregation
export function aggregateUserFinancials(profile: UserProfile, assumptions: Assumptions): CalculationSummary {
  const totalMonthlyIncome = profile.income.reduce((sum, i) => sum + (i.monthlyAmount || 0), 0);
  const totalMonthlyExpenses = profile.expenses.reduce((sum, e) => sum + (e.monthlyAmount || 0), 0);
  const monthlyCashFlow = computeCashFlow(totalMonthlyIncome, totalMonthlyExpenses);
  const savingsCapacity = computeSavingsCapacity(monthlyCashFlow, assumptions.savingsSafetyBuffer);

  const assetValues = profile.assets.map(a => a.currentValue || 0);
  const liabilityValues = profile.liabilities.map(l => l.outstandingAmount || 0);
  
  const totalAssets = assetValues.reduce((s, v) => s + v, 0);
  const totalLiabilities = liabilityValues.reduce((s, v) => s + v, 0);
  const netWorth = computeNetWorth(assetValues, liabilityValues);

  const emergencyFundRequired = computeEmergencyFund(totalMonthlyExpenses, assumptions.emergencyBufferMonths);
  
  // Liquid assets = Cash + Fixed Deposits + Mutual Funds
  const liquidAssetsAvailable = profile.assets
    .filter(a => ['Cash', 'Fixed Deposit', 'Mutual Funds'].includes(a.type))
    .reduce((s, a) => s + (a.currentValue || 0), 0);

  const emergencyFundMonthsCovered = totalMonthlyExpenses > 0 
    ? Number((liquidAssetsAvailable / totalMonthlyExpenses).toFixed(1))
    : 12;

  return {
    totalMonthlyIncome,
    totalMonthlyExpenses,
    monthlyCashFlow,
    savingsCapacity,
    totalAssets,
    totalLiabilities,
    netWorth,
    emergencyFundRequired,
    liquidAssetsAvailable,
    emergencyFundMonthsCovered,
    isEmergencyFundAdequate: emergencyFundMonthsCovered >= assumptions.emergencyBufferMonths,
    isCashFlowNegative: monthlyCashFlow < 0,
    isNetWorthNegative: netWorth < 0,
  };
}

// 13. Deterministic 3-Plan Generation Engine
export function generatePlans(
  primaryGoal: GoalItem,
  userRiskCategory: RiskCategory,
  assumptions: Assumptions,
  currentYear: number = 2026
): FinancialPlan[] {
  const years = Math.max(1, primaryGoal.targetYear - currentYear);
  const months = years * 12;
  const targetFV = computeInflationAdjustedFV(primaryGoal.todayCost, assumptions.inflationRate, years);

  // Short Goal Horizon Rule Override:
  const isShortHorizon = years < 3;

  // Plan 1: Conservative
  const allocConservative: AssetAllocation = isShortHorizon
    ? { equity: 20, debt: 70, cash: 10 }
    : { equity: 25, debt: 65, cash: 10 };
  const cagrConservative = computeWeightedCAGR(allocConservative, assumptions);
  const sipConservative = computeRequiredSIP(targetFV, cagrConservative, months);

  // Plan 2: Balanced
  const allocBalanced: AssetAllocation = isShortHorizon
    ? { equity: 25, debt: 65, cash: 10 }
    : { equity: 55, debt: 40, cash: 5 };
  const cagrBalanced = computeWeightedCAGR(allocBalanced, assumptions);
  const sipBalanced = computeRequiredSIP(targetFV, cagrBalanced, months);

  // Plan 3: Growth
  const allocGrowth: AssetAllocation = isShortHorizon
    ? { equity: 30, debt: 60, cash: 10 }
    : { equity: 80, debt: 17, cash: 3 };
  const cagrGrowth = computeWeightedCAGR(allocGrowth, assumptions);
  const sipGrowth = computeRequiredSIP(targetFV, cagrGrowth, months);

  return [
    {
      planId: 'plan_conservative',
      type: 'conservative',
      name: 'Low Risk Plan',
      allocation: allocConservative,
      expectedCagr: cagrConservative,
      monthlyInvestmentRequired: sipConservative,
      targetGoalFutureValue: targetFV,
      timelineYears: years,
      narrative: {
        name: 'Low Risk Plan',
        explanation: `Prioritizes capital safety with a ${allocConservative.debt}% debt cushion. Requires ₹${sipConservative.toLocaleString('en-IN')}/month to target your ${primaryGoal.name} goal by ${primaryGoal.targetYear}.`,
        riskNote: isShortHorizon 
          ? 'Short timeline (<3 yrs) keeps equity capped to prevent downside drawdowns before withdrawal.'
          : 'Low drawdown risk; yields steady, predictable accumulation over time.'
      }
    },
    {
      planId: 'plan_balanced',
      type: 'balanced',
      name: 'Moderate Risk Plan',
      allocation: allocBalanced,
      expectedCagr: cagrBalanced,
      monthlyInvestmentRequired: sipBalanced,
      targetGoalFutureValue: targetFV,
      timelineYears: years,
      narrative: {
        name: 'Moderate Risk Plan',
        explanation: `Matches a balanced wealth-building profile. With ${allocBalanced.equity}% equity and ${allocBalanced.debt}% debt, a monthly investment of ₹${sipBalanced.toLocaleString('en-IN')} stays on course for your target.`,
        riskNote: 'Moderate market sensitivity; built to comfortably ride out standard economic cycles.'
      }
    },
    {
      planId: 'plan_growth',
      type: 'growth',
      name: 'High Risk Plan',
      allocation: allocGrowth,
      expectedCagr: cagrGrowth,
      monthlyInvestmentRequired: sipGrowth,
      targetGoalFutureValue: targetFV,
      timelineYears: years,
      narrative: {
        name: 'High Risk Plan',
        explanation: `Maximizes long-range equity compounding (${allocGrowth.equity}% equity). Lowers the required monthly contribution to ₹${sipGrowth.toLocaleString('en-IN')}/month.`,
        riskNote: 'High equity exposure with potential 15-20% corrections; best suited for disciplined long-term horizons.'
      }
    }
  ];
}
