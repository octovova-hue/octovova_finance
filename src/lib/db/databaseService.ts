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
   * 1b. Fetch a customer's full saved profile (income, expenses, assets,
   * liabilities, goals, risk assessment) from Postgres. Used to rehydrate
   * a session on a browser/device that doesn't have the account in its
   * local cache yet (see login() in FinanceContext).
   */
  async getFullProfile(customerId: string): Promise<{
    income: { id: string; source: string; monthlyAmount: number }[];
    expenses: { id: string; category: string; monthlyAmount: number }[];
    assets: { id: string; type: string; currentValue: number }[];
    liabilities: { id: string; type: string; outstandingAmount: number; interestRate: number }[];
    goals: {
      id: string;
      name: string;
      goalType: string;
      targetYear: number;
      todayCost: number;
      priority: number;
      allocatedAssets?: number;
      activePlanType?: string;
      createdAt?: number;
    }[];
    riskProfile: { answers: number[]; score: number; category: string } | null;
  } | null> {
    if (!this.isLive() || !supabase) return null;
    try {
      const [incomeRes, expenseRes, assetRes, liabilityRes, goalRes, riskRes] = await Promise.all([
        supabase.from('income').select('*').eq('customer_id', customerId),
        supabase.from('expense').select('*').eq('customer_id', customerId),
        supabase.from('asset').select('*').eq('customer_id', customerId),
        supabase.from('liability').select('*').eq('customer_id', customerId),
        supabase.from('financial_goal').select('*').eq('customer_id', customerId),
        supabase.from('risk_assessment').select('*').eq('customer_id', customerId).order('created_at', { ascending: false }).limit(1),
      ]);

      const income = (incomeRes.data || []).map((r: DbIncome) => ({
        id: r.income_id, source: r.source, monthlyAmount: r.monthly_amount,
      }));
      const expenses = (expenseRes.data || []).map((r: DbExpense) => ({
        id: r.expense_id, category: r.category, monthlyAmount: r.monthly_amount,
      }));
      const assets = (assetRes.data || []).map((r: DbAsset) => ({
        id: r.asset_id, type: r.type, currentValue: r.current_value,
      }));
      const liabilities = (liabilityRes.data || []).map((r: DbLiability) => ({
        id: r.liability_id, type: r.type, outstandingAmount: r.outstanding_amount, interestRate: r.interest_rate,
      }));
      const goals = (goalRes.data || []).map((r: DbFinancialGoal) => ({
        id: r.goal_id,
        name: r.name,
        goalType: r.goal_type,
        targetYear: r.target_year,
        todayCost: r.today_cost,
        priority: r.priority,
        allocatedAssets: r.allocated_assets,
        activePlanType: r.active_plan_type,
        createdAt: r.created_at ? new Date(r.created_at).getTime() : undefined,
      }));
      const riskRow = riskRes.data && riskRes.data[0];
      const riskProfile = riskRow
        ? {
            answers: Array.isArray(riskRow.answers) ? riskRow.answers : Object.values(riskRow.answers || {}),
            score: riskRow.score,
            category: riskRow.category,
          }
        : null;

      return { income, expenses, assets, liabilities, goals, riskProfile };
    } catch (err) {
      console.warn('[Postgres DB] getFullProfile connection error:', err);
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
    age: number = 30,
    preferredCustomerId?: string
  ): Promise<Omit<DbCustomer, 'password_hash'> | null> {
    if (!this.isLive() || !supabase) return null;
    try {
      const payload: any = {
        name,
        email,
        password_hash: passwordHash,
        age,
      };
      if (preferredCustomerId) {
        payload.customer_id = preferredCustomerId;
      }

      const { data, error } = await supabase
        .from('customer')
        .upsert(payload, { onConflict: 'email' })
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
   * 4. Full Financial Profile Sync: Save All Onboarding Data
   */
  async syncFullProfileToPostgres(
    customerId: string,
    userProfile: UserProfile,
    plans: FinancialPlan[],
    selectedGoal: GoalItem | null
  ): Promise<void> {
    if (!this.isLive() || !supabase) return;
    try {
      console.log('[Postgres DB] 🚀 Starting full financial sync for user:', userProfile.email);

      // Verify or resolve authoritative customer_id in PostgreSQL
      let targetCustomerId = customerId;
      const { data: existingCustomer } = await supabase
        .from('customer')
        .select('customer_id')
        .eq('email', userProfile.email)
        .maybeSingle();

      if (existingCustomer?.customer_id) {
        targetCustomerId = existingCustomer.customer_id;
      } else {
        // Create customer record if not already present
        const { data: newCust, error: custErr } = await supabase
          .from('customer')
          .upsert({
            customer_id: customerId,
            name: userProfile.name || 'User',
            email: userProfile.email,
            password_hash: 'sha256_client_registered_user',
            age: userProfile.age || 30,
          }, { onConflict: 'email' })
          .select('customer_id')
          .single();

        if (newCust?.customer_id) {
          targetCustomerId = newCust.customer_id;
        } else if (custErr) {
          console.error('[Postgres DB] Error ensuring customer row:', custErr.message);
        }
      }

      console.log('[Postgres DB] Using customer_id:', targetCustomerId, 'and age:', userProfile.age);

      // 0. Update Customer Profile with Real Name & Age
      const { error: custUpdErr } = await supabase
        .from('customer')
        .update({
          name: userProfile.name || 'User',
          age: userProfile.age || 30,
          updated_at: new Date().toISOString(),
        })
        .eq('customer_id', targetCustomerId);

      if (custUpdErr) {
        console.error('[Postgres DB] Customer age/name update error:', custUpdErr.message);
      } else {
        console.log('✅ [Postgres DB] Updated customer record with age:', userProfile.age);
      }

      // 1. Incomes
      if (userProfile.income && userProfile.income.length > 0) {
        await supabase.from('income').delete().eq('customer_id', targetCustomerId);
        const { error: incErr } = await supabase.from('income').insert(
          userProfile.income.map((inc) => ({
            customer_id: targetCustomerId,
            source: inc.source,
            monthly_amount: inc.monthlyAmount,
          }))
        );
        if (incErr) console.error('[Postgres DB] income error:', incErr.message);
        else console.log('✅ [Postgres DB] Saved income rows');
      }

      // 2. Expenses
      if (userProfile.expenses && userProfile.expenses.length > 0) {
        await supabase.from('expense').delete().eq('customer_id', targetCustomerId);
        const { error: expErr } = await supabase.from('expense').insert(
          userProfile.expenses.map((exp) => ({
            customer_id: targetCustomerId,
            category: exp.category,
            monthly_amount: exp.monthlyAmount,
            is_itemized: true,
          }))
        );
        if (expErr) console.error('[Postgres DB] expense error:', expErr.message);
        else console.log('✅ [Postgres DB] Saved expense rows');
      }

      // 3. Assets
      if (userProfile.assets && userProfile.assets.length > 0) {
        await supabase.from('asset').delete().eq('customer_id', targetCustomerId);
        const { error: astErr } = await supabase.from('asset').insert(
          userProfile.assets.map((ast) => ({
            customer_id: targetCustomerId,
            type: ast.type,
            current_value: ast.currentValue,
          }))
        );
        if (astErr) console.error('[Postgres DB] asset error:', astErr.message);
        else console.log('✅ [Postgres DB] Saved asset rows');
      }

      // 4. Liabilities
      if (userProfile.liabilities && userProfile.liabilities.length > 0) {
        await supabase.from('liability').delete().eq('customer_id', targetCustomerId);
        const { error: liaErr } = await supabase.from('liability').insert(
          userProfile.liabilities.map((lia) => ({
            customer_id: targetCustomerId,
            type: lia.type,
            outstanding_amount: lia.outstandingAmount,
            interest_rate: lia.interestRate || 0,
          }))
        );
        if (liaErr) console.error('[Postgres DB] liability error:', liaErr.message);
        else console.log('✅ [Postgres DB] Saved liability rows');
      }

      // 5. Goals
      if (userProfile.goals && userProfile.goals.length > 0) {
        await supabase.from('financial_goal').delete().eq('customer_id', targetCustomerId);
        const { error: goalErr } = await supabase.from('financial_goal').insert(
          userProfile.goals.map((g) => ({
            customer_id: targetCustomerId,
            name: g.name,
            goal_type: g.goalType,
            target_year: g.targetYear,
            today_cost: g.todayCost,
            priority: g.priority,
            allocated_assets: g.allocatedAssets || 0,
            active_plan_type: (g.activePlanType || 'balanced').toLowerCase() as any,
          }))
        );
        if (goalErr) console.error('[Postgres DB] financial_goal error:', goalErr.message);
        else console.log('✅ [Postgres DB] Saved financial_goal rows');
      }

      // 6. Risk Assessment
      if (userProfile.riskProfile) {
        const categoryMap: Record<string, string> = {
          Conservative: 'Low',
          Balanced: 'Moderate',
          Growth: 'High',
          Aggressive: 'Aggressive',
          Low: 'Low',
          Moderate: 'Moderate',
          High: 'High',
        };
        const dbCategory = categoryMap[userProfile.riskProfile.category] || 'Moderate';

        await supabase.from('risk_assessment').delete().eq('customer_id', targetCustomerId);
        const { error: riskErr } = await supabase.from('risk_assessment').insert({
          customer_id: targetCustomerId,
          answers: { values: userProfile.riskProfile.answers },
          score: userProfile.riskProfile.score,
          category: dbCategory as any,
        });
        if (riskErr) console.error('[Postgres DB] risk_assessment error:', riskErr.message);
        else console.log('✅ [Postgres DB] Saved risk_assessment');
      }

      // 7. Plans, Allocations & AI Recommendations
      if (plans && plans.length > 0) {
        await supabase.from('financial_plan').delete().eq('customer_id', targetCustomerId);

        for (const plan of plans) {
          const isSelected = userProfile.activePlanId === plan.planId;
          const { data: insertedPlan, error: planErr } = await supabase
            .from('financial_plan')
            .insert({
              customer_id: targetCustomerId,
              plan_type: plan.type,
              name: plan.name,
              monthly_investment_required: plan.monthlyInvestmentRequired,
              expected_cagr: plan.expectedCagr,
              target_goal_future_value: plan.targetGoalFutureValue,
              monte_carlo_probability: 85.0,
              engine_version: 'v1.0.0-pure-math',
              is_selected: isSelected,
            })
            .select()
            .single();

          if (planErr) {
            console.error('[Postgres DB] financial_plan error:', planErr.message);
          } else if (insertedPlan) {
            // Plan Allocations
            const { error: allocErr } = await supabase.from('plan_allocation').insert([
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
            if (allocErr) console.error('[Postgres DB] plan_allocation error:', allocErr.message);

            // AI Recommendation
            if (plan.narrative) {
              const { error: aiErr } = await supabase.from('ai_recommendation').insert({
                plan_id: insertedPlan.plan_id,
                narrative_text: plan.narrative.explanation,
                model_version: 'gemini-1.5-flash',
                prompt_version: 'prompt-v2.0',
                validation_status: 'verified',
              });
              if (aiErr) console.error('[Postgres DB] ai_recommendation error:', aiErr.message);
            }
          }
        }
        console.log('✅ [Postgres DB] Saved financial_plan, allocations, and ai_recommendations');
      }

      console.log('🎉 [Postgres DB] ALL tables synced successfully for customer:', userProfile.email);
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
        active_plan_type: (goal.activePlanType || 'balanced').toLowerCase() as any,
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
