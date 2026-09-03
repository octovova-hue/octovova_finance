import React, { useState, useEffect } from 'react';
import { FinancialPlan } from '../../types/finance';
import { useFinance } from '../../context/FinanceContext';
import { AllocationDonut } from '../charts/AllocationDonut';
import { AnimatedNumber } from '../common/AnimatedNumber';
import { formatINR } from '../../lib/formatters';
import { RobotAdvisorColoredIcon } from '../common/ColoredIcon';
import { X, Check, Activity } from 'lucide-react';
import confetti from 'canvas-confetti';
import { fetchMonteCarloSimulation, MonteCarloSimulationData } from '../../lib/monteCarloService';
import { InfoTooltip } from '../common/InfoTooltip';

interface PlanDetailModalProps {
  plan: FinancialPlan | null;
  onClose: () => void;
}

export const PlanDetailModal: React.FC<PlanDetailModalProps> = ({ plan, onClose }) => {
  const { user, selectPlan, selectedGoal, setIsFeedbackOpen } = useFinance();
  const [mcData, setMcData] = useState<MonteCarloSimulationData | null>(null);
  const [mcLoading, setMcLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!plan) return;
    const horizon = Math.max(1, (selectedGoal?.targetYear || 2031) - 2026);
    setMcLoading(true);
    fetchMonteCarloSimulation(horizon, plan.expectedCagr)
      .then((data) => setMcData(data))
      .catch((err) => console.warn('Failed to load MC simulation:', err))
      .finally(() => setMcLoading(false));
  }, [plan, selectedGoal]);

  if (!plan) return null;

  const isSelected = user.activePlanId === plan.planId || (!user.activePlanId && plan.type === 'balanced');

  const handleSelect = () => {
    selectPlan(plan.planId);
    confetti({
      particleCount: 70,
      spread: 80,
      origin: { y: 0.6 },
    });
    setTimeout(() => {
      onClose();
      setIsFeedbackOpen(true);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-2xl glass-card-raised rounded-card border border-border p-6 sm:p-8 shadow-glass space-y-6 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold text-brand-lightGreen px-3 py-0.5 rounded-full bg-brand-green/15 border border-brand-green/30">
                {plan.type} Strategy
              </span>
              <span className="text-xs text-text-tertiary">
                Target: {selectedGoal?.name} ({selectedGoal?.targetYear})
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-text-primary mt-1">{plan.name}</h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary rounded-full hover:bg-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Narrative Box */}
        <div className="p-4 rounded-2xl glass-card border border-border space-y-2">
          <div className="flex items-center gap-2 text-brand-lightGreen text-xs font-bold uppercase tracking-wider">
            <RobotAdvisorColoredIcon className="w-4 h-4" /> Advisory Assessment
          </div>
          <p className="text-sm text-text-primary leading-relaxed">
            {plan.narrative.explanation}
          </p>
          <div className="pt-2 flex items-start gap-2 text-xs text-text-secondary border-t border-border/40">
            <span className="flex items-center gap-1.5 shrink-0 mt-0.5">
              <strong className="text-text-primary">Volatility Profile:</strong>
              <InfoTooltip
                align="left"
                text="Volatility just means how much an investment's value moves up and down over time. Higher volatility means bigger swings day-to-day or month-to-month — potentially stronger growth over the long run, but a bumpier ride getting there."
              />
            </span>
            <span>{plan.narrative.riskNote}</span>
          </div>
        </div>

        {/* Chart & Key Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div className="p-4 rounded-2xl glass-card border border-border flex flex-col items-center">
            <span className="text-xs font-bold text-text-secondary uppercase mb-2">Asset Allocation</span>
            <AllocationDonut allocation={plan.allocation} size={160} innerRadius={48} outerRadius={70} />
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl glass-card border border-border">
              <span className="text-[11px] font-semibold text-text-secondary block">Required Monthly SIP</span>
              <AnimatedNumber
                value={plan.monthlyInvestmentRequired}
                currency="INR"
                className="text-2xl font-bold text-brand-lightGreen block mt-0.5"
              />
              <span className="text-[10px] text-text-tertiary">To reach {formatINR(plan.targetGoalFutureValue, true)}</span>
            </div>

            <div className="p-3.5 rounded-2xl glass-card border border-border">
              <span className="text-[11px] font-semibold text-text-secondary block">Portfolio Expected Return</span>
              <span className="text-2xl font-mono font-bold text-brand-mint block mt-0.5">{plan.expectedCagr}%</span>
              <span className="text-[10px] text-text-tertiary">Weighted annual growth estimate</span>
            </div>
          </div>
        </div>

        {/* Monte Carlo 10,000 Nifty50 Simulation Card */}
        <div className="p-4 rounded-2xl glass-card border border-border/80 bg-surface/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-primary">
              <Activity className="w-4 h-4 text-brand-mint" />
              <span>Monte Carlo Goal Simulation (10,000 Nifty50 Runs)</span>
            </div>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-brand-green/10 text-brand-lightGreen border border-brand-green/20">
              {mcLoading ? 'Simulating...' : `${mcData?.source === 'hf_space' || mcData?.source === 'cached' ? 'HF Space API' : 'Empirical Model'}`}
            </span>
          </div>

          {mcData ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
              <div className="p-2.5 rounded-xl bg-surface border border-border">
                <span className="text-[10px] font-semibold text-text-secondary block">Success Probability</span>
                <span className="text-lg font-mono font-bold text-brand-lightGreen block mt-0.5">
                  {mcData.goal_success_probability}%
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface border border-border">
                <span className="text-[10px] font-semibold text-text-secondary block">Median CAGR (P50)</span>
                <span className="text-lg font-mono font-bold text-text-primary block mt-0.5">
                  {mcData.median_cagr_pct}%
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface border border-border">
                <span className="text-[10px] font-semibold text-text-secondary block">Downside (P10)</span>
                <span className="text-lg font-mono font-bold text-amber-400 block mt-0.5">
                  {mcData.percentiles.p10}%
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface border border-border">
                <span className="text-[10px] font-semibold text-text-secondary block">Bull Market (P90)</span>
                <span className="text-lg font-mono font-bold text-brand-mint block mt-0.5">
                  {mcData.percentiles.p90}%
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-text-tertiary text-center py-2">Loading Monte Carlo empirical distributions...</div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-full text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleSelect}
            className={`px-8 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              isSelected
                ? 'bg-brand-green/20 text-brand-lightGreen border border-brand-green/40'
                : 'bg-brand-green hover:bg-brand-darkGreen text-white shadow-glow-green transform hover:scale-105'
            }`}
          >
            {isSelected ? (
              <>
                <Check className="w-4 h-4" /> Active Selection
              </>
            ) : (
              'Select This Plan'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
