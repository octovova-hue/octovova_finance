import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PlanCompareViewProps {
  onSelectPlan: (planId: string) => void;
}

export const PlanCompareView: React.FC<PlanCompareViewProps> = ({ onSelectPlan }) => {
  const { plans, user, selectedGoal } = useFinance();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="text-left space-y-1">
        <h2 className="text-2xl font-extrabold text-text-primary">Compare Tailored Strategies</h2>
        <p className="text-xs text-text-secondary">
          Targeting <strong className="text-brand-lightGreen">{selectedGoal?.name}</strong> ({selectedGoal?.targetYear}) — Side-by-side asset allocation and compounding metrics.
        </p>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto rounded-card border border-border glass-card shadow-glass">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border bg-surface/50">
              <th className="p-4 font-bold text-text-secondary uppercase tracking-wider text-[11px]">Feature / Metric</th>
              {plans.map((p) => (
                <th key={p.planId} className="p-4 font-bold text-text-primary text-center">
                  <span className="block text-sm">{p.name}</span>
                  <span className="text-[10px] uppercase tracking-wider text-text-tertiary font-mono font-normal">
                    {p.type}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border font-medium">
            {/* Monthly SIP Required */}
            <tr>
              <td className="p-4 font-semibold text-text-primary">Monthly SIP Required</td>
              {plans.map((p) => (
                <td key={p.planId} className="p-4 text-center font-mono font-bold text-brand-lightGreen text-sm">
                  ₹{p.monthlyInvestmentRequired.toLocaleString('en-IN')}/mo
                </td>
              ))}
            </tr>

            {/* Expected Portfolio CAGR */}
            <tr>
              <td className="p-4 font-semibold text-text-primary">Expected Portfolio CAGR</td>
              {plans.map((p) => (
                <td key={p.planId} className="p-4 text-center font-mono font-bold text-brand-mint">
                  {p.expectedCagr}%
                </td>
              ))}
            </tr>

            {/* Equity Allocation */}
            <tr>
              <td className="p-4 text-text-secondary">Equity Exposure</td>
              {plans.map((p) => (
                <td key={p.planId} className="p-4 text-center font-mono font-bold text-brand-lightGreen">
                  {p.allocation.equity}%
                </td>
              ))}
            </tr>

            {/* Debt Allocation */}
            <tr>
              <td className="p-4 text-text-secondary">Debt & Fixed Income</td>
              {plans.map((p) => (
                <td key={p.planId} className="p-4 text-center font-mono font-bold text-brand-mint">
                  {p.allocation.debt}%
                </td>
              ))}
            </tr>

            {/* Cash Allocation */}
            <tr>
              <td className="p-4 text-text-secondary">Cash / Liquid Cushion</td>
              {plans.map((p) => (
                <td key={p.planId} className="p-4 text-center font-mono font-bold text-text-secondary">
                  {p.allocation.cash}%
                </td>
              ))}
            </tr>

            {/* Risk Category Match */}
            <tr>
              <td className="p-4 text-text-secondary">Risk Profile Compatibility</td>
              {plans.map((p) => {
                const isMatch = user.riskProfile.category.toLowerCase() === p.type;
                return (
                  <td key={p.planId} className="p-4 text-center">
                    {isMatch ? (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-brand-lightGreen bg-brand-green/20 px-2.5 py-0.5 rounded-full border border-brand-green/40">
                        <Check className="w-3 h-3" /> Exact Match
                      </span>
                    ) : (
                      <span className="text-[10px] text-text-tertiary">Alternate</span>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* Action */}
            <tr>
              <td className="p-4 font-semibold text-text-primary">Action</td>
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
                      className={`py-2 px-5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                        isSelected
                          ? 'bg-brand-green/20 text-brand-lightGreen border border-brand-green/40'
                          : 'bg-brand-green hover:bg-brand-darkGreen text-white shadow-glow-green'
                      }`}
                    >
                      {isSelected ? 'Active' : 'Choose'}
                    </button>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
