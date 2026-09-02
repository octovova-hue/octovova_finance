/**
 * PostgreSQL Database Schema Types for Octovova Finance Engine
 */

export type PlanTypeEnum = 'conservative' | 'balanced' | 'growth';
export type RiskCategoryEnum = 'Low' | 'Moderate' | 'High' | 'Aggressive';
export type AssetClassEnum = 'equity' | 'debt' | 'cash' | 'real_estate' | 'gold';
export type ValidationStatusEnum = 'pending' | 'verified' | 'flagged';

export interface DbCustomer {
  customer_id: string;
  name: string;
  age: number;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface DbIncome {
  income_id: string;
  customer_id: string;
  source: string;
  monthly_amount: number;
  created_at: string;
}

export interface DbExpense {
  expense_id: string;
  customer_id: string;
  category: string;
  monthly_amount: number;
  is_itemized: boolean;
  created_at: string;
}

export interface DbAsset {
  asset_id: string;
  customer_id: string;
  type: string;
  current_value: number;
  created_at: string;
}

export interface DbLiability {
  liability_id: string;
  customer_id: string;
  type: string;
  outstanding_amount: number;
  interest_rate: number;
  created_at: string;
}

export interface DbFinancialGoal {
  goal_id: string;
  customer_id: string;
  name: string;
  goal_type: string;
  target_year: number;
  today_cost: number;
  priority: number;
  allocated_assets: number;
  active_plan_type: PlanTypeEnum;
  created_at: string;
}

export interface DbRiskAssessment {
  assessment_id: string;
  customer_id: string;
  answers: Record<string, any>;
  score: number;
  category: RiskCategoryEnum;
  created_at: string;
}

export interface DbMarketData {
  asset_class: AssetClassEnum;
  avg_return: number;
  volatility: number;
  as_of_year: number;
  updated_at: string;
}

export interface DbFinancialPlan {
  plan_id: string;
  customer_id: string;
  goal_id: string | null;
  plan_type: PlanTypeEnum;
  name: string;
  monthly_investment_required: number;
  expected_cagr: number;
  target_goal_future_value: number;
  monte_carlo_probability: number;
  engine_version: string;
  is_selected: boolean;
  created_at: string;
}

export interface DbPlanAllocation {
  allocation_id: string;
  plan_id: string;
  asset_class: AssetClassEnum;
  percentage: number;
}

export interface DbAiRecommendation {
  recommendation_id: string;
  plan_id: string;
  narrative_text: string;
  model_version: string;
  prompt_version: string;
  validation_status: ValidationStatusEnum;
  generated_at: string;
}

export interface DbUserFeedback {
  feedback_id: string;
  customer_id: string;
  plan_id: string;
  rating: number;
  comments: string | null;
  created_at: string;
}

export interface DbWhatIfLog {
  log_id: string;
  customer_id: string;
  plan_id: string | null;
  question_text: string;
  parsed_intent: Record<string, any>;
  result_json: Record<string, any>;
  created_at: string;
}
