import React from 'react';
import { FinancialPlan } from '../../types/finance';
import { useFinance } from '../../context/FinanceContext';
import { AllocationDonut } from '../charts/AllocationDonut';
import { AnimatedNumber } from '../common/AnimatedNumber';
import { formatINR } from '../../lib/formatters';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PlanCardProps {
  plan: FinancialPlan;
  onOpenDetails?: (plan: FinancialPlan) => void;
  isRecommended?: boolean;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  onOpenDetails,
  isRecommended = false,
}) => {
  const { user, selectPlan, setIsFeedbackOpen } = useFinance();
  const isSelected = user.activePlanId === plan.planId || (!user.activePlanId && plan.type === 'balanced');

  // The selected (or, failing that, the recommended) plan gets the
  // off-white/mint "hero" treatment to stand out; everything else is
  // a neutral grey/black gradient so green stays reserved for accents.
  const isHighlighted = isSelected || isRecommended;

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectPlan(plan.planId);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });
    // Trigger feedback sheet after selection
    setTimeout(() => {
      setIsFeedbackOpen(true);
    }, 1200);
  };

  const riskLabel = {
    conservative: 'Low Risk',
    balanced: 'Moderate Risk',
    growth: 'High Risk',
  }[plan.type];

  const riskBadgeStyle = {
    conservative: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
    balanced: 'bg-orange-500/15 text-orange-400 border-orange-500/40',
    growth: 'bg-red-500/15 text-red-400 border-red-500/40',
  }[plan.type];

  // Concise, plain-language benefit statement
  const benefitStatement = {
    conservative: 'Steady, safer growth with minimal ups and downs.',
    balanced: 'A balanced mix of growth and safety.',
    growth: 'Stronger long-term growth for higher risk tolerance.',
  }[plan.type];

  // Text-color set flips for legibility depending on card background
  const textPrimary = isHighlighted ? 'text-[#0B2A1D]' : 'text-text-primary';
  const textSecondary = isHighlighted ? 'text-[#3F5B4E]' : 'text-text-secondary';
  const textTertiary = isHighlighted ? 'text-[#6E8579]' : 'text-text-tertiary';
  const textAccent = isHighlighted ? 'text-brand-darkGreen' : 'text-brand-lightGreen';
  const dividerBorder = isHighlighted ? 'border-black/[0.08]' : 'border-white/6';

  return (
    <div
      onClick={() => onOpenDetails?.(plan)}
      className={`group relative rounded-2xl p-5 sm:p-6 transition-all duration-200 cursor-pointer flex flex-col justify-between border ${
        isSelected
          ? 'dash-card-light ring-1 ring-brand-green/40 sm:scale-[1.02]'
          : isRecommended
          ? 'dash-card-light hover:ring-1 hover:ring-brand-green/30'
          : 'dash-card-neutral hover:border-white/20'
      }`}
      style={{ minHeight: '440px' }}
    >
      {/* Top Header & Prominent Single Badge */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-mono font-bold uppercase tracking-wider ${textPrimary}`}>
              {plan.name}
            </span>
            <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border font-bold ${riskBadgeStyle}`}>
              {riskLabel}
            </span>
          </div>

          {/* Only ONE prominent badge for either Active or Recommended */}
          {isSelected ? (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-brand-darkGreen bg-brand-green/15 px-2.5 py-0.5 rounded-full border border-brand-green/30">
              <Check className="w-3 h-3 stroke-[2.5]" /> Active Plan
            </span>
          ) : isRecommended ? (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-400/15 px-2.5 py-0.5 rounded-full border border-amber-500/30">
              <Sparkles className="w-3 h-3" /> Recommended
            </span>
          ) : null}
        </div>

        {/* Hero Metric: Monthly Investment */}
        <div className="pt-1">
          <span className={`text-[10px] uppercase font-bold tracking-wider block ${textTertiary}`}>
            Required Monthly Investment
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <AnimatedNumber
              value={plan.monthlyInvestmentRequired}
              currency="INR"
              className={`text-2xl sm:text-3xl font-mono font-extrabold tracking-tight ${textAccent}`}
            />
            <span className={`text-xs font-medium ${textTertiary}`}>/mo</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border ${
              isHighlighted ? 'text-brand-darkGreen bg-brand-green/10 border-brand-green/25' : 'text-brand-mint bg-brand-mint/10 border-brand-mint/20'
            }`}>
              {plan.expectedCagr}% Expected CAGR
            </span>
            <span className={`text-[11px] ${textTertiary}`}>
              Target: {formatINR(plan.targetGoalFutureValue, true)}
            </span>
          </div>
        </div>

        {/* Concise Benefit Statement */}
        <p className={`text-xs leading-relaxed pt-1 ${textSecondary}`}>
          {benefitStatement}
        </p>
      </div>

      {/* Center Donut Chart (Natural integration, 20-25% smaller, no heavy grey box) */}
      <div className="py-3 flex flex-col items-center justify-center">
        <AllocationDonut
          allocation={plan.allocation}
          size={115}
          innerRadius={35}
          outerRadius={49}
          showLegend={false}
        />

        {/* Clean Portfolio Allocation Bar below chart */}
        <div className="flex items-center justify-center gap-3 mt-3 text-[11px] font-mono">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-brand-green" />
            <span className={textSecondary}>Equity <strong className={textPrimary}>{plan.allocation.equity}%</strong></span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-brand-mint" />
            <span className={textSecondary}>Debt <strong className={textPrimary}>{plan.allocation.debt}%</strong></span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-slate-400" />
            <span className={textSecondary}>Cash <strong className={textPrimary}>{plan.allocation.cash}%</strong></span>
          </div>
        </div>
      </div>

      {/* Contextual Action Button */}
      <div className={`pt-3 border-t ${dividerBorder}`}>
        <button
          type="button"
          onClick={handleSelect}
          className={`w-full h-11 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 ${
            isSelected
              ? 'bg-brand-green/15 text-brand-darkGreen border border-brand-green/40 hover:bg-brand-green/20'
              : 'bg-gradient-to-r from-brand-lightGreen to-brand-darkGreen text-white shadow-glow-green hover:scale-[1.01] active:scale-[0.99]'
          }`}
        >
          {isSelected ? (
            <>
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Continue with this Plan</span>
            </>
          ) : (
            <>
              <span>Switch to this Plan</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
