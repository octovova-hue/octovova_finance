import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Sparkles, Shield, Compass, TrendingUp, Info } from 'lucide-react';

export const StrategyRecommendationBanner: React.FC = () => {
  const { user, selectedGoal, plans, activePlan } = useFinance();

  const currentYear = new Date().getFullYear() || 2026;
  const targetYear = selectedGoal?.targetYear || currentYear + 5;
  const horizonYears = Math.max(1, targetYear - currentYear);
  const riskCategory = user.riskProfile.category; // 'Conservative' | 'Moderate' | 'Balanced' | 'Growth' | 'Aggressive'

  // Determine recommended plan based on risk profile and timeline
  let recommendedPlanType: 'conservative' | 'balanced' | 'growth' = 'balanced';
  let recommendationReason = '';
  let highlightIcon = Sparkles;

  if (horizonYears < 3) {
    recommendedPlanType = 'conservative';
    recommendationReason = `"${selectedGoal?.name || 'Your goal'}" is coming up in ${horizonYears} ${horizonYears === 1 ? 'year' : 'years'}, so we're keeping things safe. The Low Risk plan avoids big swings, so your money is ready when you need it.`;
    highlightIcon = Shield;
  } else if (riskCategory === 'Growth' || riskCategory === 'Aggressive') {
    recommendedPlanType = 'growth';
    recommendationReason = `Your risk profile shows you're comfortable with market ups and downs, so the High Risk plan aims for stronger long-term growth with a lower monthly investment.`;
    highlightIcon = TrendingUp;
  } else if (riskCategory === 'Conservative') {
    recommendedPlanType = 'conservative';
    recommendationReason = `This matches your Conservative risk profile — steady returns and a strong safety cushion to reach "${selectedGoal?.name}" with less stress.`;
    highlightIcon = Shield;
  } else {
    recommendedPlanType = 'balanced';
    recommendationReason = `Based on your Balanced risk profile and ${horizonYears}-year timeline, this plan balances growth and safety for a comfortable path to your goal.`;
    highlightIcon = Compass;
  }

  const recommendedPlan = plans.find((p) => p.type === recommendedPlanType) || plans[1] || plans[0];
  const isRecommendedActive = activePlan?.type === recommendedPlanType;
  const IconComponent = highlightIcon;

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#10241A] via-[#0E1A14] to-[#0A120E] border border-brand-green/30 shadow-glass">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-brand-green/15 text-brand-lightGreen border border-brand-green/30 shrink-0 mt-0.5 sm:mt-0">
            <IconComponent className="w-5 h-5" />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] uppercase font-mono font-bold tracking-wider text-brand-lightGreen">
                Algorithm Recommendation
              </span>
              <span className="text-[10px] uppercase font-bold text-white bg-brand-green px-2 py-0.5 rounded-full">
                {recommendedPlan?.name} Plan
              </span>
              {isRecommendedActive && (
                <span className="text-[10px] text-brand-mint font-medium flex items-center gap-1">
                  • Currently Selected
                </span>
              )}
            </div>

            <p className="text-xs text-text-secondary leading-relaxed max-w-3xl">
              {recommendationReason}
            </p>
          </div>
        </div>

        <div className="hidden lg:flex flex-col items-end shrink-0 pl-4 border-l border-white/6 text-right">
          <span className="text-[10px] uppercase font-mono text-text-tertiary">Horizon vs Risk</span>
          <span className="text-xs font-mono font-bold text-text-primary mt-0.5">
            {horizonYears}y Horizon · {riskCategory}
          </span>
        </div>
      </div>
    </div>
  );
};
