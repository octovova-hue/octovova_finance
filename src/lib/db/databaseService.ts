import { supabase, isPostgresConfigured } from './supabaseClient';
import {
  DbCustomer,
  DbIncome,
  DbExpense,
  DbAsset,
  DbLiability,
  DbFinancialGoal,
  DbRiskAssessment,
  DbFinancialPlan,
  DbPlanAllocation,
  DbAiRecommendation,
  DbUserFeedback,
  DbWhatIfLog,
  DbMarketData,
} from './types';
import { UserProfile, GoalItem, FinancialPlan, PlanType, Assumptions } from '../../types/finance';

export const databaseService = {
  /**
   * Check connection status
   */
  isLive(): boolean {
    return isPostgresConfigured() && supabase !== null;
  },

  /**
   * 1. CUSTOMER: Authenticate or Fetch safe profile by email
   */
  async getCustomerByEmail(email: string): Promise<Omit<DbCustomer, 'password_hash'> | null> {
    if (!this.isLive() || !supabase) return null;
    try {
      const { data, error } = await supabase
        .from('customer')
        .select('customer_id, name, age, email, created_at, updated_at')
        .eq('email', email)
        .maybeSingle();

      if (error) {
        console.warn('[Postgres DB] getCustomerByEmail warning:', error.message);
        return null;
      }
      return data as any;
    } catch (err) {
      console.warn('[Postgres DB] Connection error:', err);
      return null;
    }
  },

  /**
   * 2. CUSTOMER: Create or Upsert customer with secure salted hash
   */
  async createCustomer(
    name: string,
    email: string,
    passwordHash: string,
    age: number = 30
  ): Promise<Omit<DbCustomer, 'password_hash'> | null> {
    if (!this.isLive() || !supabase) return null;
    try {
      const { data, error } = await supabase
        .from('customer')
        .upsert(
          {
            name,
            email,
            password_hash: passwordHash,
            age,
          },
          { onConflict: 'email' }
        )
        .select('customer_id, name, age, email, created_at, updated_at')
        .single();

      if (error) {
        console.error('[Postgres DB] createCustomer error:', error.message);
        return null;
      }
      return data as any;
    } catch (err) {
      console.warn('[Postgres DB] Connection error:', err);
      return null;
    }
  },

  /**
   * 3. Update customer basic info
   */
  async updateCustomerInfo(customerId: string, updates: { name?: string; age?: number; salary?: number }): Promise<void> {
    if (!this.isLive() || !supabase) return;
    try {
      if (updates.name || updates.age) {
        await supabase
          .from('customer')
          .update({
            ...(updates.name ? { name: updates.name } : {}),
            ...(updates.age ? { age: updates.age } : {}),
            updated_at: new Date().toISOString(),
          })
          .eq('customer_id', customerId);
      }

      if (updates.salary !== undefined) {
        await supabase
          .from('income')
          .upsert(
            {
              customer_id: customerId,
              source: 'Salary',
              monthly_amount: updates.salary,
            },
            { onConflict: 'customer_id, source' }
          );
      }
    } catch (err) {
      console.warn('[Postgres DB] updateCustomerInfo error:', err);
    }
  },

  /**
   * 4. Full Financial Profile Sync: Save Onboarding Data
   */
  async syncFullProfileToPostgres(
    customerId: string,
    userProfile: UserProfile,
    plans: FinancialPlan[],
    selectedGoal: GoalItem | null
  ): Promise<void> {
    if (!this.isLive() || !supabase) return;
    try {
      // 1. Incomes
      if (userProfile.income && userProfile.income.length > 0) {
        await supabase.from('income').delete().eq('customer_id', customerId);
        await supabase.from('income').insert(
          userProfile.income.map((inc) => ({
            customer_id: customerId,
            source: inc.source,
            monthly_amount: inc.monthlyAmount,
          }))
        );
      }

      // 2. Expenses
      if (userProfile.expenses && userProfile.expenses.length > 0) {
        await supabase.from('expense').delete().eq('customer_id', customerId);
        await supabase.from('expense').insert(
          userProfile.expenses.map((exp) => ({
            customer_id: customerId,
            category: exp.category,
            monthly_amount: exp.monthlyAmount,
            is_itemized: true,
          }))
        );
      }

      // 3. Assets
      if (userProfile.assets && userProfile.assets.length > 0) {
        await supabase.from('asset').delete().eq('customer_id', customerId);
        await supabase.from('asset').insert(
          userProfile.assets.map((ast) => ({
            customer_id: customerId,
            type: ast.type,
            current_value: ast.currentValue,
          }))
        );
      }

      // 4. Liabilities
      if (userProfile.liabilities && userProfile.liabilities.length > 0) {
        await supabase.from('liability').delete().eq('customer_id', customerId);
        await supabase.from('liability').insert(
          userProfile.liabilities.map((lia) => ({
            customer_id: customerId,
            type: lia.type,
            outstanding_amount: lia.outstandingAmount,
            interest_rate: lia.interestRate || 0,
          }))
        );
      }

      // 5. Goals
      if (userProfile.goals && userProfile.goals.length > 0) {
        for (const goal of userProfile.goals) {
          await supabase.from('financial_goal').upsert(
            {
              customer_id: customerId,
              name: goal.name,
              goal_type: goal.goalType,
              target_year: goal.targetYear,
              today_cost: goal.todayCost,
              priority: goal.priority,
              allocated_assets: goal.allocatedAssets || 0,
              active_plan_type: goal.activePlanType || 'balanced',
            },
            { onConflict: 'customer_id, name' }
          );
        }
      }

      // 6. Risk Assessment
      if (userProfile.riskProfile) {
        await supabase.from('risk_assessment').insert({
          customer_id: customerId,
          answers: { values: userProfile.riskProfile.answers },
          score: userProfile.riskProfile.score,
          category: userProfile.riskProfile.category as any,
        });
      }

      // 7. Plans, Allocations & AI Recommendations
      if (plans && plans.length > 0) {
        for (const plan of plans) {
          const isSelected = userProfile.activePlanId === plan.planId;
          const { data: insertedPlan } = await supabase
            .from('financial_plan')
            .upsert(
              {
                customer_id: customerId,
                plan_type: plan.type,
                name: plan.name,
                monthly_investment_required: plan.monthlyInvestmentRequired,
                expected_cagr: plan.expectedCagr,
                target_goal_future_value: plan.targetGoalFutureValue,
                monte_carlo_probability: 85.0,
                engine_version: 'v1.0.0-pure-math',
                is_selected: isSelected,
              },
              { onConflict: 'customer_id, plan_type' }
            )
            .select()
            .single();

          if (insertedPlan) {
            // Plan Allocations
            await supabase.from('plan_allocation').upsert([
              {
                plan_id: insertedPlan.plan_id,
                asset_class: 'equity',
                percentage: plan.allocation.equity,
              },
              {
                plan_id: insertedPlan.plan_id,
                asset_class: 'debt',
                percentage: plan.allocation.debt,
              },
              {
                plan_id: insertedPlan.plan_id,
                asset_class: 'cash',
                percentage: plan.allocation.cash,
              },
            ]);

            // AI Recommendation
            if (plan.narrative) {
              await supabase.from('ai_recommendation').upsert({
                plan_id: insertedPlan.plan_id,
                narrative_text: plan.narrative.explanation,
                model_version: 'gemini-1.5-flash',
                prompt_version: 'prompt-v2.0',
                validation_status: 'verified',
              });
            }
          }
        }
      }
    } catch (err) {
      console.warn('[Postgres DB] syncFullProfileToPostgres error:', err);
    }
  },

  /**
   * 5. Add a single goal to PostgreSQL
   */
  async saveGoal(customerId: string, goal: GoalItem): Promise<void> {
    if (!this.isLive() || !supabase) return;
    try {
      await supabase.from('financial_goal').insert({
        customer_id: customerId,
        name: goal.name,
        goal_type: goal.goalType,
        target_year: goal.targetYear,
        today_cost: goal.todayCost,
        priority: goal.priority,
        allocated_assets: goal.allocatedAssets || 0,
        active_plan_type: goal.activePlanType || 'balanced',
      });
    } catch (err) {
      console.warn('[Postgres DB] saveGoal error:', err);
    }
  },

  /**
   * 6. Update goal active plan type in PostgreSQL
   */
  async updateGoalPlan(goalId: string, planType: PlanType): Promise<void> {
    if (!this.isLive() || !supabase) return;
    try {
      await supabase
        .from('financial_goal')
        .update({ active_plan_type: planType })
        .eq('goal_id', goalId);
    } catch (err) {
      console.warn('[Postgres DB] updateGoalPlan error:', err);
    }
  },

  /**
   * 7. Save User Feedback to PostgreSQL
   */
  async saveFeedback(customerId: string, planId: string, rating: number, comments: string): Promise<void> {
    if (!this.isLive() || !supabase) return;
    try {
      await supabase.from('user_feedback').insert({
        customer_id: customerId,
        plan_id: planId,
        rating,
        comments,
      });
    } catch (err) {
      console.warn('[Postgres DB] saveFeedback error:', err);
    }
  },

  /**
   * 8. Log What-If Question & Simulation
   */
  async logWhatIf(
    customerId: string,
    planId: string | null,
    question: string,
    parsedIntent: Record<string, any>,
    result: Record<string, any>
  ): Promise<void> {
    if (!this.isLive() || !supabase) return;
    try {
      await supabase.from('what_if_log').insert({
        customer_id: customerId,
        plan_id: planId,
        question_text: question,
        parsed_intent: parsedIntent,
        result_json: result,
      });
    } catch (err) {
      console.warn('[Postgres DB] logWhatIf error:', err);
    }
  },

  /**
   * 9. Fetch Market Data assumptions (NIFTY/AMFI trends)
   */
  async getMarketData(): Promise<DbMarketData[] | null> {
    if (!this.isLive() || !supabase) return null;
    try {
      const { data, error } = await supabase.from('market_data').select('*');
      if (error) {
        console.warn('[Postgres DB] getMarketData error:', error.message);
        return null;
      }
      return data;
    } catch (err) {
      return null;
    }
  },
};
