// TypeScript definitions for Octovova Finance

export type IncomeSourceType = 'Salary' | 'Business' | 'Rental' | 'Freelance' | 'Other';

export interface IncomeItem {
  id: string;
  source: IncomeSourceType;
  monthlyAmount: number;
}

export type ExpenseCategoryType = 'Housing' | 'Food' | 'Transport' | 'EMI' | 'Lifestyle' | 'Other';

export interface ExpenseItem {
  id: string;
  category: ExpenseCategoryType;
  monthlyAmount: number;
}

export type AssetType = 'Cash' | 'Fixed Deposit' | 'Mutual Funds' | 'Stocks' | 'Real Estate' | 'Gold' | 'Other';

export interface AssetItem {
  id: string;
  type: AssetType;
  currentValue: number;
}

export type LiabilityType = 'Home Loan' | 'Personal Loan' | 'Car Loan' | 'Credit Card' | 'Education Loan' | 'EMI' | 'Other';

export interface LiabilityItem {
  id: string;
  type: LiabilityType;
  outstandingAmount: number;
  interestRate: number; // e.g. 8.5 for 8.5%
}

export type GoalType = 'House' | 'Wedding' | 'Retirement' | 'Education' | 'Emergency' | 'Custom';

export interface GoalItem {
  id: string;
  name: string;
  goalType: GoalType;
  targetYear: number;
  todayCost: number;
  priority: number; // 1 to 5
  computedFutureValue?: number;
  allocatedAssets?: number;
  activePlanType?: PlanType; // 'conservative' | 'balanced' | 'growth'
  createdAt?: number;
}

export type RiskCategory = 'Conservative' | 'Moderate' | 'Balanced' | 'Growth' | 'Aggressive';

export interface RiskQuizAnswer {
  questionId: number;
  score: number; // 1 to 5
  selectedOptionText: string;
}

export interface RiskProfile {
  answers: number[];
  score: number; // 5 to 25
  category: RiskCategory;
  categoryDescription: string;
}

export interface Assumptions {
  inflationRate: number; // e.g. 0.06 for 6%
  equityReturn: number;  // e.g. 0.11 for 11%
  debtReturn: number;    // e.g. 0.065 for 6.5%
  cashReturn: number;    // e.g. 0.04 for 4%
  emergencyBufferMonths: number; // e.g. 6
  savingsSafetyBuffer: number;   // e.g. 0.10 for 10%
}

export interface AssetAllocation {
  equity: number; // Percentage, e.g. 55
  debt: number;   // Percentage, e.g. 40
  cash: number;   // Percentage, e.g. 5
}

export type PlanType = 'conservative' | 'balanced' | 'growth';

export interface PlanNarrative {
  name: string;
  explanation: string;
  riskNote: string;
}

export interface FinancialPlan {
  planId: string;
  type: PlanType;
  name: string;
  allocation: AssetAllocation;
  expectedCagr: number; // e.g. 9.1
  monthlyInvestmentRequired: number;
  targetGoalFutureValue: number;
  timelineYears: number;
  narrative: PlanNarrative;
  isSelected?: boolean;
}

export interface WhatIfIntent {
  parameter: 'monthly_investment' | 'inflation_rate' | 'target_year' | 'today_cost' | 'income';
  changeType: 'delta_add' | 'delta_subtract' | 'absolute_set';
  value: number;
}

export interface WhatIfDelta {
  parameterLabel: string;
  oldValue: number | string;
  newValue: number | string;
  currentMonthlyInvestment: number;
  newMonthlyInvestment: number;
  deltaInvestmentMonthly: number;
  projectedPortfolioValue: number;
  targetFutureValue: number;
  surplusOrDeficit: number;
  explanation: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  whatIfDelta?: WhatIfDelta;
}

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  email: string;
  avatar?: string;
  hasCompletedOnboarding?: boolean;
  income: IncomeItem[];
  expenses: ExpenseItem[];
  assets: AssetItem[];
  liabilities: LiabilityItem[];
  riskProfile: RiskProfile;
  goals: GoalItem[];
  activePlanId?: string;
}

export interface AuthAccount {
  email: string;
  passwordHash: string;
  profile: UserProfile;
}

export interface CalculationSummary {
  totalMonthlyIncome: number;
  totalMonthlyExpenses: number;
  monthlyCashFlow: number;
  savingsCapacity: number;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  emergencyFundRequired: number;
  liquidAssetsAvailable: number;
  emergencyFundMonthsCovered: number;
  isEmergencyFundAdequate: boolean;
  isCashFlowNegative: boolean;
  isNetWorthNegative: boolean;
}
