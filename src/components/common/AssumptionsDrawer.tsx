import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { X, Sliders, RefreshCw, AlertCircle } from 'lucide-react';
import { formatPercent } from '../../lib/formatters';

export const AssumptionsDrawer: React.FC = () => {
  const { assumptions, updateAssumptions, isAssumptionsOpen, setIsAssumptionsOpen } = useFinance();

  if (!isAssumptionsOpen) return null;

  const handleReset = () => {
    updateAssumptions({
      inflationRate: 0.06,
      equityReturn: 0.11,
      debtReturn: 0.065,
      cashReturn: 0.04,
      emergencyBufferMonths: 6,
      savingsSafetyBuffer: 0.10,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md transition-all duration-300">
      <div 
        className="w-full max-w-lg glass-card-raised rounded-t-card sm:rounded-card border border-border p-6 shadow-glass animate-in slide-in-from-bottom duration-300"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-full bg-brand-green/20 text-brand-lightGreen">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">Global Assumptions</h3>
              <p className="text-xs text-text-secondary">Changes live-recalculate all goals, SIPs & plans</p>
            </div>
          </div>
          <button
            onClick={() => setIsAssumptionsOpen(false)}
            className="p-2 text-text-secondary hover:text-text-primary rounded-full hover:bg-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Controls */}
        <div className="py-5 space-y-5">
          {/* Inflation Rate */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Expected Annual Inflation
              </label>
              <span className="font-mono font-bold text-brand-lightGreen text-sm">
                {formatPercent(assumptions.inflationRate * 100, 1)}
              </span>
            </div>
            <input
              type="range"
              min="3"
              max="12"
              step="0.5"
              value={assumptions.inflationRate * 100}
              onChange={(e) => updateAssumptions({ inflationRate: parseFloat(e.target.value) / 100 })}
              className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer accent-brand-green"
            />
            <div className="flex justify-between text-[10px] text-text-tertiary mt-1">
              <span>3.0% (Low)</span>
              <span>6.0% (Default)</span>
              <span>12.0% (High)</span>
            </div>
          </div>

          {/* Asset Returns Breakdown */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {/* Equity Return */}
            <div className="p-3 rounded-2xl glass-card border border-border">
              <span className="text-[11px] font-semibold text-text-secondary block">Equity CAGR</span>
              <div className="mt-1 flex items-center justify-between">
                <input
                  type="number"
                  step="0.5"
                  min="5"
                  max="20"
                  value={Number((assumptions.equityReturn * 100).toFixed(1))}
                  onChange={(e) => updateAssumptions({ equityReturn: parseFloat(e.target.value) / 100 })}
                  className="w-14 bg-surface font-mono font-bold text-sm text-text-primary px-1.5 py-0.5 rounded-full border border-border focus:border-brand-green outline-none"
                />
                <span className="text-xs font-mono text-text-tertiary">%</span>
              </div>
            </div>

            {/* Debt Return */}
            <div className="p-3 rounded-2xl glass-card border border-border">
              <span className="text-[11px] font-semibold text-text-secondary block">Debt Return</span>
              <div className="mt-1 flex items-center justify-between">
                <input
                  type="number"
                  step="0.5"
                  min="3"
                  max="12"
                  value={Number((assumptions.debtReturn * 100).toFixed(1))}
                  onChange={(e) => updateAssumptions({ debtReturn: parseFloat(e.target.value) / 100 })}
                  className="w-14 bg-surface font-mono font-bold text-sm text-text-primary px-1.5 py-0.5 rounded-full border border-border focus:border-brand-green outline-none"
                />
                <span className="text-xs font-mono text-text-tertiary">%</span>
              </div>
            </div>

            {/* Cash Return */}
            <div className="p-3 rounded-2xl glass-card border border-border">
              <span className="text-[11px] font-semibold text-text-secondary block">Cash Return</span>
              <div className="mt-1 flex items-center justify-between">
                <input
                  type="number"
                  step="0.5"
                  min="2"
                  max="8"
                  value={Number((assumptions.cashReturn * 100).toFixed(1))}
                  onChange={(e) => updateAssumptions({ cashReturn: parseFloat(e.target.value) / 100 })}
                  className="w-14 bg-surface font-mono font-bold text-sm text-text-primary px-1.5 py-0.5 rounded-full border border-border focus:border-brand-green outline-none"
                />
                <span className="text-xs font-mono text-text-tertiary">%</span>
              </div>
            </div>
          </div>

          {/* Emergency Fund Months */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Emergency Reserve Target
              </label>
              <span className="font-mono font-bold text-brand-mint text-sm">
                {assumptions.emergencyBufferMonths} Months Expenses
              </span>
            </div>
            <input
              type="range"
              min="3"
              max="12"
              step="1"
              value={assumptions.emergencyBufferMonths}
              onChange={(e) => updateAssumptions({ emergencyBufferMonths: parseInt(e.target.value, 10) })}
              className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer accent-brand-green"
            />
          </div>

          {/* Disclaimer Note */}
          <div className="flex items-start gap-2 p-3 rounded-2xl glass-card border border-border text-xs text-text-secondary">
            <AlertCircle className="w-4 h-4 text-brand-lightGreen shrink-0 mt-0.5" />
            <span>
              All figures are baseline financial planning assumptions, not guaranteed investment returns.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary font-medium py-2 px-3 rounded-full hover:bg-surface transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset Defaults
          </button>
          <button
            onClick={() => setIsAssumptionsOpen(false)}
            className="px-6 py-2.5 rounded-full bg-brand-green hover:bg-brand-darkGreen text-white text-xs font-bold uppercase tracking-wider transition-all shadow-glow-green"
          >
            Apply & Recalculate
          </button>
        </div>
      </div>
    </div>
  );
};
