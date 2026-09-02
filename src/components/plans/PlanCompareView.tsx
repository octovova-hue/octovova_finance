import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { StrategyRecommendationBanner } from './StrategyRecommendationBanner';
import { PlanCard } from './PlanCard';
import { formatINR } from '../../lib/formatters';
import { Check, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PlanCompareViewProps {
  onSelectPlan: (planId: string) => void;
  onOpenDetails?: (plan: any) => void;
}

export const PlanCompareView: React.FC<PlanCompareViewProps> = ({ onSelectPlan, onOpenDetails }) => {
  const { plans, user, selectedGoal, activePlan } = useFinance();
  const [mobileActiveIndex, setMobileActiveIndex] = useState<number>(1); // Default to Balanced

  // Determine which plan is recommended
  const currentYear = new Date().getFullYear() || 2026;
  const horizonYears = Math.max(1, (selectedGoal?.targetYear || currentYear + 5) - currentYear);
  const recommendedType =
    horizonYears < 3
      ? 'conservative'
      : user.riskProfile.category === 'Growth' || user.riskProfile.category === 'Aggressive'
      ? 'growth'
      : user.riskProfile.category === 'Conservative'
      ? 'conservative'
      : 'balanced';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
            Investment Strategy Comparison
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Compare risk-adjusted compounding velocity targeting{' '}
            <strong className="text-brand-lightGreen">{selectedGoal?.name}</strong> ({selectedGoal?.targetYear}).
          </p>
        </div>
      </div>

      {/* Dynamic Recommendation Banner */}
      <StrategyRecommendationBanner />

      {/* Desktop Side-by-Side Cards (Grid of 3) / Mobile Swipeable Tabs */}
      <div className="space-y-3">
        {/* Mobile Tab Switcher */}
        <div className="flex sm:hidden items-center justify-center p-1 rounded-xl bg-surface-dark border border-white/8">
          {plans.map((p, idx) => (
            <button
              key={p.planId}
              type="button"
              onClick={() => setMobileActiveIndex(idx)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mobileActiveIndex === idx
                  ? 'bg-brand-green text-white font-bold shadow-glow-green'
                  : 'text-text-secondary'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Mobile View: Single Active Card */}
        <div className="block sm:hidden">
          {plans[mobileActiveIndex] && (
            <PlanCard
              plan={plans[mobileActiveIndex]}
              isRecommended={plans[mobileActiveIndex].type === recommendedType}
              onOpenDetails={onOpenDetails}
            />
          )}
        </div>

        {/* Desktop View: Grid of 3 */}
        <div className="hidden sm:grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {plans.map((plan) => (
            <PlanCard
              key={plan.planId}
              plan={plan}
              isRecommended={plan.type === recommendedType}
              onOpenDetails={onOpenDetails}
            />
          ))}
        </div>
      </div>

      {/* Detailed Side-by-Side Matrix Table */}
      <div className="space-y-3 pt-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary">
          Side-by-Side Asset Allocation & Return Matrix
        </h3>

        <div className="overflow-x-auto rounded-2xl border border-white/8 bg-[#0D1612] shadow-card">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/8 bg-black/20">
                <th className="p-4 font-bold text-text-secondary uppercase tracking-wider text-[11px]">
                  Strategic Metric
                </th>
                {plans.map((p) => {
                  const isRec = p.type === recommendedType;
                  const isAct = p.planId === activePlan?.planId;
                  return (
                    <th
                      key={p.planId}
                      className={`p-4 font-bold text-center ${
                        isAct ? 'bg-brand-green/5' : ''
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="text-sm text-text-primary">{p.name}</span>
                        {isRec && (
                          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold">
                            Rec
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-text-tertiary block font-mono mt-0.5">
                        {p.type === 'conservative'
                          ? 'Low Risk'
                          : p.type === 'balanced'
                          ? 'Moderate Risk'
                          : 'High Risk'}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/6 font-medium">
              {/* Monthly SIP Required */}
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="p-4 font-semibold text-text-primary">
                  Required Monthly SIP
                </td>
                {plans.map((p) => (
                  <td
                    key={p.planId}
                    className="p-4 text-center font-mono font-bold text-brand-lightGreen text-sm"
                  >
                    {formatINR(p.monthlyInvestmentRequired)}/mo
                  </td>
                ))}
              </tr>

              {/* Expected CAGR */}
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="p-4 font-semibold text-text-primary">
                  Expected Portfolio CAGR
                </td>
                {plans.map((p) => (
                  <td
                    key={p.planId}
                    className="p-4 text-center font-mono font-bold text-brand-mint"
                  >
                    {p.expectedCagr}%
                  </td>
                ))}
              </tr>

              {/* Equity Allocation */}
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="p-4 text-text-secondary">Equity Exposure</td>
                {plans.map((p) => (
                  <td
                    key={p.planId}
                    className="p-4 text-center font-mono font-semibold text-text-primary"
                  >
                    {p.allocation.equity}%
                  </td>
                ))}
              </tr>

              {/* Debt Allocation */}
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="p-4 text-text-secondary">Debt & Fixed Income</td>
                {plans.map((p) => (
                  <td
                    key={p.planId}
                    className="p-4 text-center font-mono font-semibold text-text-primary"
                  >
                    {p.allocation.debt}%
                  </td>
                ))}
              </tr>

              {/* Cash Cushion */}
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="p-4 text-text-secondary">Cash Cushion</td>
                {plans.map((p) => (
                  <td
                    key={p.planId}
                    className="p-4 text-center font-mono text-text-tertiary"
                  >
                    {p.allocation.cash}%
                  </td>
                ))}
              </tr>

              {/* Risk Suitability */}
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="p-4 text-text-secondary">Risk Match</td>
                {plans.map((p) => {
                  const isMatch = user.riskProfile.category.toLowerCase() === p.type;
                  return (
                    <td key={p.planId} className="p-4 text-center">
                      {isMatch ? (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-brand-lightGreen bg-brand-green/15 px-2 py-0.5 rounded-full border border-brand-green/30">
                          <Check className="w-3 h-3" /> Exact Profile Match
                        </span>
                      ) : (
                        <span className="text-[11px] text-text-tertiary font-mono">
                          {p.type === 'conservative' ? 'Conservative Anchor' : 'Alternative Horizon'}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Selection CTA */}
              <tr className="bg-black/10">
                <td className="p-4 font-semibold text-text-primary">Decision Action</td>
                {plans.map((p) => {
                  const isSelected = user.activePlanId === p.planId || (!user.activePlanId && p.type === 'balanced');
                  return (
                    <td key={p.planId} className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectPlan(p.planId);
                          confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
                        }}
                        className={`py-2 px-5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                          isSelected
                            ? 'bg-brand-green/20 text-brand-lightGreen border border-brand-green/40 cursor-default'
                            : 'bg-brand-green hover:bg-brand-darkGreen text-white shadow-glow-green hover:scale-105'
                        }`}
                      >
                        {isSelected ? '✓ Active Plan' : 'Select'}
                      </button>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
