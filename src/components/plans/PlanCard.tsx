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

  // Benefit statement
  const benefitStatement = {
    conservative: 'Maximum capital preservation with stable fixed-income yields.',
    balanced: 'Optimal blend of wealth compounding and downside cushion.',
    growth: 'Highest compounding velocity to minimize monthly capital requirements.',
  }[plan.type];

  return (
    <div
      onClick={() => onOpenDetails?.(plan)}
      className={`group relative rounded-2xl p-5 sm:p-6 transition-all duration-200 cursor-pointer flex flex-col justify-between border ${
        isSelected
          ? 'bg-[#101F18] border-brand-green/70 shadow-glow-green ring-1 ring-brand-green/30 sm:scale-[1.02]'
          : isRecommended
          ? 'bg-[#0E1A14] border-brand-green/40 hover:border-brand-green/60 hover:bg-[#111F19]'
          : 'bg-[#0D1612] border-white/8 hover:border-white/18 hover:bg-[#0F1A15]'
      }`}
      style={{ minHeight: '440px' }}
    >
      {/* Top Header & Prominent Single Badge */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-text-primary">
              {plan.name}
            </span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-white/5 text-text-tertiary border border-white/8">
              {riskLabel}
            </span>
          </div>

          {/* Only ONE prominent badge for either Active or Recommended */}
          {isSelected ? (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-brand-lightGreen bg-brand-green/15 px-2.5 py-0.5 rounded-full border border-brand-green/30">
              <Check className="w-3 h-3 stroke-[2.5]" /> Active Plan
            </span>
          ) : isRecommended ? (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/30">
              <Sparkles className="w-3 h-3" /> Recommended
            </span>
          ) : null}
        </div>

        {/* Hero Metric: Monthly Investment */}
        <div className="pt-1">
          <span className="text-[10px] uppercase font-bold text-text-tertiary tracking-wider block">
            Required Monthly Investment
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <AnimatedNumber
              value={plan.monthlyInvestmentRequired}
              currency="INR"
              className="text-2xl sm:text-3xl font-mono font-extrabold text-brand-lightGreen tracking-tight"
            />
            <span className="text-xs text-text-tertiary font-medium">/mo</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] font-mono font-bold text-brand-mint bg-brand-mint/10 px-2 py-0.5 rounded-md border border-brand-mint/20">
              {plan.expectedCagr}% Expected CAGR
            </span>
            <span className="text-[11px] text-text-tertiary">
              Target: {formatINR(plan.targetGoalFutureValue, true)}
            </span>
          </div>
        </div>

        {/* Concise Benefit Statement */}
        <p className="text-xs text-text-secondary leading-relaxed pt-1">
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
            <span className="text-text-secondary">Equity <strong className="text-text-primary">{plan.allocation.equity}%</strong></span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-brand-mint" />
            <span className="text-text-secondary">Debt <strong className="text-text-primary">{plan.allocation.debt}%</strong></span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-slate-400" />
            <span className="text-text-secondary">Cash <strong className="text-text-primary">{plan.allocation.cash}%</strong></span>
          </div>
        </div>
      </div>

      {/* Contextual Action Button */}
      <div className="pt-3 border-t border-white/6">
        <button
          type="button"
          onClick={handleSelect}
          className={`w-full h-11 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 ${
            isSelected
              ? 'bg-brand-green/15 text-brand-lightGreen border border-brand-green/40 hover:bg-brand-green/20'
              : 'bg-brand-green hover:bg-brand-darkGreen text-white shadow-glow-green hover:scale-[1.01] active:scale-[0.99]'
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
