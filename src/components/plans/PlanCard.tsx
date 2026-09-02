import React from 'react';
import { FinancialPlan } from '../../types/finance';
import { useFinance } from '../../context/FinanceContext';
import { AllocationDonut } from '../charts/AllocationDonut';
import { AnimatedNumber } from '../common/AnimatedNumber';
import {
  StocksGrowthColoredIcon,
  PlansNavColoredIcon,
  PiggyBankColoredIcon,
} from '../common/ColoredIcon';
import { Check, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PlanCardProps {
  plan: FinancialPlan;
  onOpenDetails: (plan: FinancialPlan) => void;
}

export const PlanCard: React.FC<PlanCardProps> = ({ plan, onOpenDetails }) => {
  const { user, selectPlan, setIsFeedbackOpen } = useFinance();
  const isSelected = user.activePlanId === plan.planId || (!user.activePlanId && plan.type === 'balanced');

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectPlan(plan.planId);
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.7 }
    });
    // Trigger feedback sheet after selection
    setTimeout(() => {
      setIsFeedbackOpen(true);
    }, 1200);
  };

  const planTheme = {
    conservative: {
      border: 'hover:border-blue-500/50',
      badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      icon: <PiggyBankColoredIcon className="w-4 h-4" />,
    },
    balanced: {
      border: 'hover:border-brand-green/60',
      badge: 'bg-brand-green/15 text-brand-lightGreen border-brand-green/30',
      icon: <PlansNavColoredIcon className="w-4 h-4" />,
    },
    growth: {
      border: 'hover:border-brand-mint/60',
      badge: 'bg-brand-mint/15 text-brand-mint border-brand-mint/30',
      icon: <StocksGrowthColoredIcon className="w-4 h-4" />,
    },
  }[plan.type];

  return (
    <div
      onClick={() => onOpenDetails(plan)}
      className={`relative rounded-card glass-card p-6 border transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-5 shadow-glass ${
        isSelected
          ? 'glass-card-raised border-brand-green ring-1 ring-brand-green/40 shadow-glow-green'
          : `border-border ${planTheme.border} hover:bg-surface-hover`
      }`}
    >
      {/* Top Tag & Selection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${planTheme.badge}`}>
            {planTheme.icon} {plan.type}
          </span>
          {user.riskProfile.category.toLowerCase() === plan.type && (
            <span className="text-[10px] uppercase font-bold text-brand-lightGreen bg-brand-green/15 px-2.5 py-0.5 rounded-full border border-brand-green/30">
              Risk Match
            </span>
          )}
        </div>

        {isSelected && (
          <span className="flex items-center gap-1 text-xs font-bold text-brand-lightGreen bg-brand-green/20 px-3 py-1 rounded-full border border-brand-green/40">
            <Check className="w-3.5 h-3.5" /> Active Plan
          </span>
        )}
      </div>

      {/* Plan Title & Narrative Excerpt */}
      <div>
        <h3 className="text-xl font-bold text-text-primary tracking-tight">{plan.name}</h3>
        <p className="text-xs text-text-secondary line-clamp-2 mt-1 leading-relaxed">
          {plan.narrative.explanation}
        </p>
      </div>

      {/* Asset Allocation Donut */}
      <div className="py-2 bg-surface/50 rounded-2xl border border-border">
        <AllocationDonut allocation={plan.allocation} size={150} innerRadius={45} outerRadius={65} />
      </div>

      {/* Key Numbers Grid */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="p-3.5 rounded-2xl glass-card border border-border">
          <span className="text-[10px] uppercase font-bold text-text-tertiary block">Required Investment</span>
          <AnimatedNumber
            value={plan.monthlyInvestmentRequired}
            currency="INR"
            className="text-lg font-bold text-brand-lightGreen block mt-0.5"
          />
          <span className="text-[10px] text-text-tertiary">/month</span>
        </div>

        <div className="p-3.5 rounded-2xl glass-card border border-border">
          <span className="text-[10px] uppercase font-bold text-text-tertiary block">Expected CAGR</span>
          <span className="text-lg font-mono font-bold text-brand-mint block mt-0.5">
            {plan.expectedCagr}%
          </span>
          <span className="text-[10px] text-text-tertiary">Weighted Annual</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-2">
        <button
          type="button"
          onClick={handleSelect}
          className={`flex-1 py-2.5 px-4 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
            isSelected
              ? 'bg-brand-green/20 text-brand-lightGreen border border-brand-green/40'
              : 'bg-brand-green hover:bg-brand-darkGreen text-white shadow-glow-green'
          }`}
        >
          {isSelected ? 'Active Plan' : 'Select Plan'}
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetails(plan);
          }}
          className="p-2.5 rounded-full bg-surface hover:bg-surface-hover border border-border text-text-secondary hover:text-text-primary transition-colors"
          title="View full narrative & breakdowns"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
