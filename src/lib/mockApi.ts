import {
  Assumptions,
  FinancialPlan,
  GoalItem,
  RiskProfile,
  UserProfile,
  WhatIfDelta,
} from '../types/finance';
import {
  computeInflationAdjustedFV,
  computeRequiredSIP,
  generatePlans,
} from './calcEngine';

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  inflationRate: 0.06, // 6%
  equityReturn: 0.11,  // 11%
  debtReturn: 0.065,   // 6.5%
  cashReturn: 0.04,    // 4%
  emergencyBufferMonths: 6,
  savingsSafetyBuffer: 0.10,
};

export const SEEDED_DEMO_USER: UserProfile = {
  id: 'c0000000-0000-0000-0000-000000000001',
  name: 'Priya Sharma',
  age: 35,
  email: 'priya.sharma@octovova.com',
  income: [
    { id: 'inc_1', source: 'Salary', monthlyAmount: 150000 },
  ],
  expenses: [
    { id: 'exp_1', category: 'Housing', monthlyAmount: 30000 },
    { id: 'exp_2', category: 'Food', monthlyAmount: 20000 },
    { id: 'exp_3', category: 'Transport', monthlyAmount: 10000 },
    { id: 'exp_4', category: 'EMI', monthlyAmount: 12000 },
    { id: 'exp_5', category: 'Other', monthlyAmount: 8000 },
  ],
  assets: [
    { id: 'ast_1', type: 'Mutual Funds', currentValue: 700000 },
    { id: 'ast_2', type: 'Fixed Deposit', currentValue: 300000 },
    { id: 'ast_3', type: 'Cash', currentValue: 200000 },
  ],
  liabilities: [
    { id: 'lia_1', type: 'Personal Loan', outstandingAmount: 500000, interestRate: 11.5 },
  ],
  riskProfile: {
    answers: [4, 3, 4, 4, 2],
    score: 17,
    category: 'Balanced',
    categoryDescription: 'Balanced growth with controlled volatility exposure.',
  },
  goals: [
    {
      id: 'b0000000-0000-0000-0000-000000000001',
      name: 'Dream House',
      goalType: 'House',
      targetYear: 2031,
      todayCost: 8000000,
      priority: 5,
      computedFutureValue: 10705800,
      allocatedAssets: 200000,
    },
    {
      id: 'b0000000-0000-0000-0000-000000000002',
      name: 'Retirement Fund',
      goalType: 'Retirement',
      targetYear: 2046,
      todayCost: 20000000,
      priority: 4,
      computedFutureValue: 64142700,
      allocatedAssets: 500000,
    }
  ],
  activePlanId: 'e0000000-0000-0000-0000-000000000002',
};

/**
 * Mock API Simulation Layer
 * All calculations are 100% deterministic (no Monte Carlo).
 */
export const mockApi = {
  async getProfile(): Promise<UserProfile> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return JSON.parse(localStorage.getItem('octovova_user') || JSON.stringify(SEEDED_DEMO_USER));
  },

  async saveProfile(profile: UserProfile): Promise<UserProfile> {
    await new Promise(resolve => setTimeout(resolve, 300));
    localStorage.setItem('octovova_user', JSON.stringify(profile));
    return profile;
  },

  async generatePlans(goal: GoalItem, profile: UserProfile, assumptions: Assumptions): Promise<FinancialPlan[]> {
    await new Promise(resolve => setTimeout(resolve, 600));
    const plans = generatePlans(goal, profile.riskProfile.category, assumptions);
    return plans;
  },

  async processWhatIf(
    question: string,
    currentPlan: FinancialPlan,
    primaryGoal: GoalItem,
    assumptions: Assumptions
  ): Promise<WhatIfDelta> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const lower = question.toLowerCase();
    const currentSIP = currentPlan.monthlyInvestmentRequired;
    const years = Math.max(1, primaryGoal.targetYear - 2026);
    const months = years * 12;

    // Pattern 1: Monthly investment increase
    if (lower.includes('invest') || lower.includes('sip') || lower.includes('save') || lower.includes('more')) {
      const match = question.match(/\d+[\d,]*/);
      const deltaAdd = match ? parseInt(match[0].replace(/,/g, ''), 10) : 15000;
      const newSIP = currentSIP + deltaAdd;
      
      // Calculate future corpus from increased SIP
      const monthlyRate = (currentPlan.expectedCagr / 100) / 12.0;
      const growthFactor = Math.pow(1.0 + monthlyRate, months);
      const projectedCorpus = Math.round(newSIP * ((growthFactor - 1.0) / monthlyRate) * (1.0 + monthlyRate));
      const surplus = projectedCorpus - currentPlan.targetGoalFutureValue;

      return {
        parameterLabel: 'Monthly Investment (SIP)',
        oldValue: `₹${currentSIP.toLocaleString('en-IN')}/mo`,
        newValue: `₹${newSIP.toLocaleString('en-IN')}/mo (+₹${deltaAdd.toLocaleString('en-IN')})`,
        currentMonthlyInvestment: currentSIP,
        newMonthlyInvestment: newSIP,
        deltaInvestmentMonthly: deltaAdd,
        projectedPortfolioValue: projectedCorpus,
        targetFutureValue: currentPlan.targetGoalFutureValue,
        surplusOrDeficit: surplus,
        explanation: `Increasing your monthly investment by ₹${deltaAdd.toLocaleString('en-IN')} brings your monthly contribution to ₹${newSIP.toLocaleString('en-IN')}. At an expected ${currentPlan.expectedCagr}% CAGR, this creates a projected surplus of ₹${Math.abs(surplus).toLocaleString('en-IN')} above your ₹${(currentPlan.targetGoalFutureValue / 10000000).toFixed(2)} Cr target for ${primaryGoal.name} by ${primaryGoal.targetYear}.`
      };
    }

    // Pattern 2: Inflation rate change
    if (lower.includes('inflation')) {
      const match = question.match(/\d+(\.\d+)?/);
      const newInflation = match ? parseFloat(match[0]) / 100 : 0.07;
      const newFV = computeInflationAdjustedFV(primaryGoal.todayCost, newInflation, years);
      const newSIP = computeRequiredSIP(newFV, currentPlan.expectedCagr, months);
      const deltaSIP = newSIP - currentSIP;

      return {
        parameterLabel: 'Inflation Rate',
        oldValue: `${(assumptions.inflationRate * 100).toFixed(1)}%`,
        newValue: `${(newInflation * 100).toFixed(1)}%`,
        currentMonthlyInvestment: currentSIP,
        newMonthlyInvestment: newSIP,
        deltaInvestmentMonthly: deltaSIP,
        projectedPortfolioValue: newFV,
        targetFutureValue: newFV,
        surplusOrDeficit: 0,
        explanation: `If annual inflation shifts from ${(assumptions.inflationRate * 100).toFixed(1)}% to ${(newInflation * 100).toFixed(1)}%, your goal target value expands from ₹${(currentPlan.targetGoalFutureValue / 10000000).toFixed(2)} Cr to ₹${(newFV / 10000000).toFixed(2)} Cr. To stay strictly on track, your required monthly SIP increases by ₹${Math.abs(deltaSIP).toLocaleString('en-IN')}/month to ₹${newSIP.toLocaleString('en-IN')}/month.`
      };
    }

    // Pattern 3: Timeline extension / delay
    if (lower.includes('delay') || lower.includes('extend') || lower.includes('year') || lower.includes('later')) {
      const match = question.match(/\d+/);
      const addYears = match ? parseInt(match[0], 10) : 2;
      const newTargetYear = primaryGoal.targetYear + addYears;
      const newYears = years + addYears;
      const newMonths = newYears * 12;
      const newFV = computeInflationAdjustedFV(primaryGoal.todayCost, assumptions.inflationRate, newYears);
      const newSIP = computeRequiredSIP(newFV, currentPlan.expectedCagr, newMonths);
      const deltaSIP = newSIP - currentSIP;

      return {
        parameterLabel: 'Goal Target Year',
        oldValue: `${primaryGoal.targetYear} (${years} yrs)`,
        newValue: `${newTargetYear} (${newYears} yrs, +${addYears} yrs)`,
        currentMonthlyInvestment: currentSIP,
        newMonthlyInvestment: newSIP,
        deltaInvestmentMonthly: deltaSIP,
        projectedPortfolioValue: newFV,
        targetFutureValue: newFV,
        surplusOrDeficit: 0,
        explanation: `Extending your timeline by ${addYears} years (target ${newTargetYear}) gives compounding more time to work. Even though inflation lifts the final cost to ₹${(newFV / 10000000).toFixed(2)} Cr, your required monthly SIP drops by ₹${Math.abs(deltaSIP).toLocaleString('en-IN')} down to ₹${newSIP.toLocaleString('en-IN')}/month.`
      };
    }

    // Default fallback scenario
    const defaultDelta = 10000;
    const newSIP = currentSIP + defaultDelta;
    const monthlyRate = (currentPlan.expectedCagr / 100) / 12.0;
    const growthFactor = Math.pow(1.0 + monthlyRate, months);
    const projectedCorpus = Math.round(newSIP * ((growthFactor - 1.0) / monthlyRate) * (1.0 + monthlyRate));
    const surplus = projectedCorpus - currentPlan.targetGoalFutureValue;

    return {
      parameterLabel: 'Monthly Contribution Adjustment',
      oldValue: `₹${currentSIP.toLocaleString('en-IN')}/mo`,
      newValue: `₹${newSIP.toLocaleString('en-IN')}/mo (+₹${defaultDelta.toLocaleString('en-IN')})`,
      currentMonthlyInvestment: currentSIP,
      newMonthlyInvestment: newSIP,
      deltaInvestmentMonthly: defaultDelta,
      projectedPortfolioValue: projectedCorpus,
      targetFutureValue: currentPlan.targetGoalFutureValue,
      surplusOrDeficit: surplus,
      explanation: `Investing an additional ₹${defaultDelta.toLocaleString('en-IN')} each month elevates your projected portfolio by ₹${Math.abs(surplus).toLocaleString('en-IN')} beyond your target by ${primaryGoal.targetYear}.`
    };
  }
};
