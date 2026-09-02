import {
  Assumptions,
  CalculationSummary,
  FinancialPlan,
  GoalItem,
  UserProfile,
} from '../types/finance';
import { formatINR } from './formatters';
import { fetchMonteCarloSimulation } from './monteCarloService';

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  timestamp: string;
  text: string;
  category?: 'advisory' | 'plan_explanation' | 'tax' | 'risk' | 'general';
  quickActions?: { label: string; action: string }[];
}

export const AI_SUGGESTED_PROMPTS = [
  'Why did you recommend this specific asset allocation for me?',
  'How can I optimize my monthly expenses to increase savings?',
  'Is my emergency reserve sufficient for unexpected job loss?',
  'Should I prepay my loans or invest more in mutual funds?',
  'Explain how inflation impacts my long-term house goal.',
  'What is the difference between my Conservative and Growth plans?',
];

/**
 * Builds the strict context payload for the LLM based on user's live financials.
 */
export function buildFinancialContextPrompt(
  user: UserProfile,
  financials: CalculationSummary,
  activePlan: FinancialPlan | null,
  assumptions: Assumptions,
  primaryGoal: GoalItem | null
): string {
  return `
SYSTEM CONTEXT FOR OCTOVOVA AI FINANCIAL ADVISOR:
Customer Profile:
- Name: ${user.name || 'Priya Sharma'}, Age: ${user.age || 35}
- Monthly Income: ${formatINR(financials.totalMonthlyIncome)}
- Monthly Expenses: ${formatINR(financials.totalMonthlyExpenses)}
- Monthly Net Cash Flow: ${formatINR(financials.monthlyCashFlow)} (${financials.isCashFlowNegative ? 'NEGATIVE - ALERT' : 'Positive'})
- Savings Capacity: ${formatINR(financials.savingsCapacity)}/month
- Total Assets: ${formatINR(financials.totalAssets)}
- Total Liabilities: ${formatINR(financials.totalLiabilities)}
- Net Worth: ${formatINR(financials.netWorth)}
- Emergency Reserve: ${financials.emergencyFundMonthsCovered} months covered (${financials.isEmergencyFundAdequate ? 'Adequate' : 'Shortfall vs 6-month goal of ' + formatINR(financials.emergencyFundRequired)})
- Risk Profile: ${user.riskProfile.category} (Score: ${user.riskProfile.score}/25)
- Stated Primary Goal: ${primaryGoal ? `${primaryGoal.name} in year ${primaryGoal.targetYear} (Today cost: ${formatINR(primaryGoal.todayCost)}, Inflation FV: ${formatINR(primaryGoal.computedFutureValue || primaryGoal.todayCost)})` : 'None'}

Active Financial Plan:
- Selected Plan: ${activePlan ? `${activePlan.name} (${activePlan.type})` : 'None'}
- Asset Allocation: ${activePlan ? `${activePlan.allocation.equity}% Equity, ${activePlan.allocation.debt}% Debt, ${activePlan.allocation.cash}% Cash` : 'N/A'}
- Expected Portfolio CAGR: ${activePlan ? `${activePlan.expectedCagr}%` : 'N/A'}
- Required Monthly SIP: ${activePlan ? formatINR(activePlan.monthlyInvestmentRequired) + '/mo' : 'N/A'}

Macro Assumptions:
- Annual Inflation Rate: ${(assumptions.inflationRate * 100).toFixed(1)}%
- Equity Expected Return: ${(assumptions.equityReturn * 100).toFixed(1)}%
- Debt Expected Return: ${(assumptions.debtReturn * 100).toFixed(1)}%
- Cash Return: ${(assumptions.cashReturn * 100).toFixed(1)}%

GUARDRAIL RULES:
1. You are Octovova AI, a numbers-literate, empathetic, calm, and highly knowledgeable personal wealth planner.
2. NEVER invent different financial numbers than the verified numbers above.
3. NEVER promise guaranteed returns or risk-free equity.
4. Frame all projections as illustrative estimates based on static macro assumptions.
5. Provide actionable, concise, structured, and easy-to-read advice (use bullet points and bold highlights).
`;
}

/**
 * Intelligent Conversational AI Engine
 * If user provides an API Key (Gemini or OpenAI), calls live LLM API.
 * Otherwise, uses a rich context-aware knowledge engine that accurately references the user's data.
 */
export async function sendAIMessage(
  userQuery: string,
  chatHistory: AIChatMessage[],
  user: UserProfile,
  financials: CalculationSummary,
  activePlan: FinancialPlan | null,
  assumptions: Assumptions,
  primaryGoal: GoalItem | null,
  apiKey?: string,
  apiProvider: 'openrouter' | 'gemini' | 'openai' = 'openrouter'
): Promise<string> {
  const query = userQuery.trim().toLowerCase();
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
  const openrouterKey = apiKey || import.meta.env.VITE_OPENROUTER_API_KEY;
  const llmModel = import.meta.env.VITE_LLM_MODEL || 'google/gemini-2.5-flash';
  const systemPrompt = buildFinancialContextPrompt(user, financials, activePlan, assumptions, primaryGoal);

  // 1. Try backend FastAPI endpoint first (carries guardrails & audit trail)
  try {
    const backendEndpoint = `${backendUrl.replace(/\/$/, '')}/ai/chat`;
    const formattedHistory = chatHistory.slice(-8).map((m) => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text,
    }));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const backendRes = await fetch(backendEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: formattedHistory,
        financial_context: systemPrompt,
        user_query: userQuery,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (backendRes.ok) {
      const data = await backendRes.json();
      if (data?.reply) {
        return data.reply;
      }
    }
  } catch (backendErr) {
    console.warn('[AI Service] Backend chat proxy unavailable, checking direct OpenRouter/Gemini connection:', backendErr);
  }

  // 2. Direct OpenRouter LLM Call (OpenAI-compatible)
  if (openrouterKey && openrouterKey.trim().length > 10) {
    try {
      const historyTurns = chatHistory.slice(-8).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      const endpoint = 'https://openrouter.ai/api/v1/chat/completions';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openrouterKey.trim()}`,
          'HTTP-Referer': 'https://octovova.finance',
          'X-Title': 'Octovova Finance Planning Engine',
        },
        body: JSON.stringify({
          model: llmModel,
          messages: [
            { role: 'system', content: systemPrompt },
            ...historyTurns,
            { role: 'user', content: userQuery },
          ],
          max_tokens: 650,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const reply = data?.choices?.[0]?.message?.content;
        if (reply && reply.trim()) {
          return reply.trim();
        }
      }
    } catch (err) {
      console.warn('[AI Service] Direct OpenRouter call failed, falling back to local financial engine:', err);
    }
  }

  // 3. Fallback to Google Gemini direct API if user provided Gemini Studio Key
  if (apiKey && apiKey.trim().length > 10 && apiProvider === 'gemini') {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;
      const contents = [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nUser Question: ${userQuery}` }],
        },
      ];

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents }),
      });

      if (response.ok) {
        const data = await response.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) return reply;
      }
    } catch (err) {
      console.warn('[AI Service] Live Gemini API call failed:', err);
    }
  }

  // Built-in Contextual Financial Intelligence Engine (Zero latency, 100% reliable)
  await new Promise(resolve => setTimeout(resolve, 600));

  const planName = activePlan?.name || 'Moderate Risk Plan';
  const equityPct = activePlan?.allocation.equity || 55;
  const debtPct = activePlan?.allocation.debt || 40;
  const cashPct = activePlan?.allocation.cash || 5;
  const sipAmt = activePlan ? formatINR(activePlan.monthlyInvestmentRequired) : '₹1,32,000';
  const cagr = activePlan ? `${activePlan.expectedCagr}%` : '9.1%';
  const goalName = primaryGoal?.name || 'your primary goal';
  const goalYear = primaryGoal?.targetYear || 2031;
  const goalCost = primaryGoal ? formatINR(primaryGoal.computedFutureValue || primaryGoal.todayCost, true) : '₹1.07 Cr';

  // Topic 1: Asset Allocation & Why this plan
  if (query.includes('allocation') || query.includes('why') || query.includes('recommend') || query.includes('portfolio')) {
    return `Based on your **${user.riskProfile.category}** risk profile (score: ${user.riskProfile.score}/25) and your target timeline for **${goalName}** (${goalYear}), here is why your **${planName}** is structured this way:

• **${equityPct}% Equity Allocation**: Provides the primary engine for inflation-beating capital compounding at an expected ${(assumptions.equityReturn * 100).toFixed(1)}% p.a.
• **${debtPct}% Debt Anchor**: Cushions against market corrections and gives predictable fixed-income accrual (assumed ${(assumptions.debtReturn * 100).toFixed(1)}% p.a.).
• **${cashPct}% Liquid Buffer**: Keeps emergency friction low without dragging down overall portfolio CAGR (${cagr}).

Investing **${sipAmt}/month** under this strategy keeps you strictly aligned to accumulate **${goalCost}** by **${goalYear}**.`;
  }

  // Topic 2: Emergency Reserve & Liquidity
  if (query.includes('emergency') || query.includes('reserve') || query.includes('safety') || query.includes('job')) {
    const months = financials.emergencyFundMonthsCovered;
    const req = formatINR(financials.emergencyFundRequired);
    const avail = formatINR(financials.liquidAssetsAvailable);

    if (financials.isEmergencyFundAdequate) {
      return `✅ **Your emergency reserves are healthy!**

• **Current Liquid Buffer**: ${avail} covering **${months} months** of your ${formatINR(financials.totalMonthlyExpenses)} monthly expenses.
• **Recommended Benchmark**: 6 months (${req}).

You have sufficient liquidity to absorb unforeseen medical or career disruptions without breaking your equity SIPs or selling assets in a market downturn.`;
    } else {
      return `⚠️ **Emergency Fund Action Needed:**

• **Current Coverage**: You have ${avail} in liquid assets, which covers only **${months} of the recommended ${assumptions.emergencyBufferMonths} months** (${req}).
• **Recommended Strategy**: Allocate **₹15,000–₹20,000/month** of your cash flow into high-yield liquid funds or bank auto-sweep FDs until you reach your **${req}** buffer, before expanding high-risk equity bets.`;
    }
  }

  // Topic 3: Debt Prepayment vs Investment
  if (query.includes('debt') || query.includes('loan') || query.includes('prepay') || query.includes('emi')) {
    const totalLiab = formatINR(financials.totalLiabilities);
    return `Here is a mathematical approach to optimizing your **${totalLiab}** outstanding debt:

1. **High-Interest Debts (>12% like Credit Cards / Personal Loans)**: Prepay these aggressively! Paying off a 12% loan guarantees an immediate 12% post-tax return.
2. **Low-Interest Tax-Deductible Debts (e.g. Home Loans @ ~8.5%)**: Keep regular EMIs. Since your equity portfolio CAGR is projected at **${cagr}**, continuing your monthly SIP generates higher long-term compounding than rushing to close low-cost debt.
3. **Action Rule**: Ensure your monthly EMI burden remains under 35-40% of your gross monthly income of ${formatINR(financials.totalMonthlyIncome)}.`;
  }

  // Topic 4: Expenses & Savings Optimization
  if (query.includes('expense') || query.includes('budget') || query.includes('save') || query.includes('cash flow')) {
    return `Looking at your cash flow breakdown:

• **Monthly Income**: ${formatINR(financials.totalMonthlyIncome)}
• **Monthly Expenses**: ${formatINR(financials.totalMonthlyExpenses)}
• **Net Savings Capacity**: ${formatINR(financials.savingsCapacity)}/month (with a 10% safety buffer)

**Tactical Recommendations**:
• Follow the **50/30/20 Rule**: Keep essential needs (Housing/Food/EMI) under 50% (${formatINR(financials.totalMonthlyIncome * 0.5)}), lifestyle/wants at 30%, and channel 20%+ (${formatINR(financials.totalMonthlyIncome * 0.2)}) straight into your automated SIPs on salary day.
• Review discretionary spending in dining and lifestyle to unlock an extra ₹10,000/month for faster goal completion.`;
  }

  // Topic 5: Inflation Impact
  if (query.includes('inflation') || query.includes('cost') || query.includes('future value')) {
    return `At our assumed **${(assumptions.inflationRate * 100).toFixed(1)}% annual inflation**:

• Money loses roughly half its purchasing power every **12 years** (Rule of 72: 72 / 6 = 12).
• For example, your **${goalName}** costing ${formatINR(primaryGoal?.todayCost || 8000000, true)} today expands to **${goalCost}** in ${Math.max(1, (primaryGoal?.targetYear || 2031) - 2026)} years.
• **Why pure Fixed Deposits fail**: A 6.5% FD after 30% income tax yields only ~4.55% net, causing real negative wealth erosion (-1.45%/yr). This is why your plan includes **${equityPct}% equity** to generate positive real returns above inflation.`;
  }

  // Topic 6: Comparing Plan Types (Low Risk vs High Risk)
  if (query.includes('compare') || query.includes('conservative') || query.includes('growth') || query.includes('risk')) {
    return `Here is how the three strategies compare for your profile:

1. **Low Risk Plan (25% Equity / 65% Debt)**:
   • Lower volatility, maximum capital preservation.
   • Requires a higher monthly contribution because expected CAGR is lower (~7.2%).

2. **Moderate Risk Plan (55% Equity / 40% Debt - Recommended)**:
   • Optimal blend matching your ${user.riskProfile.category} risk score.
   • Balances growth with downside protection at **${sipAmt}/month**.

3. **High Risk Plan (80% Equity / 17% Debt)**:
   • Lowers the required monthly contribution through aggressive equity compounding (~10.2% CAGR).
   • Expect short-term portfolio drawdowns of 15–20% during market corrections.`;
  }

  // Topic 7: Monte Carlo Simulation & Goal Probability
  if (query.includes('monte') || query.includes('carlo') || query.includes('probability') || query.includes('odds') || query.includes('chance') || query.includes('simulation')) {
    const horizonYears = Math.max(1, (primaryGoal?.targetYear || 2031) - 2026);
    const planCagr = activePlan?.expectedCagr || 9.1;
    const mc = await fetchMonteCarloSimulation(horizonYears, planCagr);

    return `🎲 **Empirical Nifty50 Monte Carlo Analysis (${mc.n_simulations.toLocaleString()} Runs)**:
    
Over your **${mc.horizonYears}-year investment horizon** targeting **${goalName}**:

• **Goal Success Probability**: **${mc.goal_success_probability}%** (chance of meeting or exceeding your target CAGR of ${cagr}).
• **Median Portfolio Outcome (P50)**: **${mc.median_cagr_pct}% p.a.**
• **Conservative Market Scenario (P10)**: **${mc.percentiles.p10}% p.a.**
• **Optimistic Bull Market (P90)**: **${mc.percentiles.p90}% p.a.**
• **Risk of Negative CAGR**: **${mc.prob_negative_cagr_pct}%** over ${mc.horizonYears} years.

*Source: ${mc.source === 'hf_space' || mc.source === 'cached' ? 'Live Hugging Face Nifty50 Engine' : 'Historical Empirical Fallback Model'}*

Your ${equityPct}% equity allocation has a high statistical likelihood of delivering positive real compounding over this timeline.`;
  }

  // General Financial Advisory Response
  return `I have analyzed your request against your financial profile (${user.name || 'Investor'}, Age ${user.age || 35}, Net Worth ${formatINR(financials.netWorth)}):

• **Active Target**: ${goalName} in ${goalYear} with an inflation-adjusted target of ${goalCost}.
• **Current Strategy**: ${planName} (${equityPct}% Equity, ${debtPct}% Debt) requiring **${sipAmt}/month**.
• **Monthly Cash Flow**: ${formatINR(financials.monthlyCashFlow)}/month available.

Would you like me to analyze how a change in your monthly contribution, a shift in risk category, or an expense reduction would optimize this plan?`;
}
