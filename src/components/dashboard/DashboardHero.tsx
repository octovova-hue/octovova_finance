import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { AnimatedNumber } from '../common/AnimatedNumber';
import { RiskBadge } from '../common/Badge';
import { CashFlowSparkline } from '../charts/CashFlowSparkline';
import { SpeedometerGauge } from '../common/SpeedometerGauge';
import {
  AlertTriangle,
  X,
  Maximize2,
} from 'lucide-react';
import { formatINR } from '../../lib/formatters';

export const DashboardHero: React.FC = () => {
  const { user, financials, assumptions } = useFinance();
  const [showWarning, setShowWarning] = useState<boolean>(true);
  const [showFullRiskModal, setShowFullRiskModal] = useState<boolean>(false);

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Warning Banner if Emergency Fund is Inadequate */}
      {!financials.isEmergencyFundAdequate && showWarning && (
        <div className="p-4 rounded-card bg-warning/10 border border-warning/30 flex items-start justify-between gap-3 text-xs text-text-primary animate-in slide-in-from-top duration-300">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div>
              <strong className="text-warning block">Emergency Reserve Recommendation</strong>
              <span>
                Your current liquid reserves cover {financials.emergencyFundMonthsCovered} of the recommended {assumptions.emergencyBufferMonths} months of expenses.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowWarning(false)}
            className="p-1 text-text-tertiary hover:text-text-primary rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Hero Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* SECTION 1: HERO-CARD VARIANT (Brighter mint-to-white gradient glass surface, dark text on top) */}
        <div className="lg:col-span-2 rounded-card glass-hero-card p-6 sm:p-8 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-900/80">
                  Total Net Worth
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-3">
                <AnimatedNumber
                  value={financials.netWorth}
                  currency="INR"
                  className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight ${
                    financials.isNetWorthNegative ? 'text-red-600' : 'text-emerald-950'
                  }`}
                />
              </div>
              <p className="text-xs text-emerald-900/70 font-medium mt-1">
                Assets: <span className="font-mono text-emerald-800 font-bold">{formatINR(financials.totalAssets)}</span> | 
                Debts: <span className="font-mono text-red-700 font-bold">{formatINR(financials.totalLiabilities)}</span>
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <RiskBadge category={user.riskProfile.category} size="md" />
            </div>
          </div>

          {/* Cash Flow Sparkline */}
          <div className="mt-6 pt-4 border-t border-emerald-900/10">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-emerald-900/80 font-bold">Monthly Cash Flow Trajectory</span>
              <span className={`font-mono font-extrabold ${financials.isCashFlowNegative ? 'text-red-700' : 'text-emerald-900'}`}>
                {financials.monthlyCashFlow >= 0 ? '+' : ''}{formatINR(financials.monthlyCashFlow)}/mo
              </span>
            </div>
            <CashFlowSparkline cashFlow={financials.monthlyCashFlow} height={42} />
          </div>
        </div>

        {/* COMPACT SPEEDOMETER GAUGE CARD (Darker Glass style) */}
        <div className="rounded-card glass-card p-6 border border-border flex flex-col justify-between items-center text-center shadow-glass space-y-3 relative group">
          <div className="w-full flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-text-secondary tracking-wider block">
              Risk Profile & Health
            </span>
            <button
              type="button"
              onClick={() => setShowFullRiskModal(true)}
              className="p-1 text-text-tertiary hover:text-brand-lightGreen rounded-full hover:bg-surface-raised transition-colors"
              title="Expand Full Risk Gauge"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* COMPACT SPEEDOMETER GAUGE */}
          <div className="py-1">
            <SpeedometerGauge
              score={user.riskProfile.score}
              category={user.riskProfile.category}
              compact={true}
              onClickDetail={() => setShowFullRiskModal(true)}
            />
          </div>

          <div className="w-full pt-2 border-t border-border/40 text-center">
            <button
              type="button"
              onClick={() => setShowFullRiskModal(true)}
              className="text-xs text-brand-lightGreen hover:underline font-semibold"
            >
              View Risk Breakdown →
            </button>
          </div>
        </div>
      </div>

      {/* FULL-DETAIL RISK PROFILE MODAL (Reachable by tapping dashboard gauge card) */}
      {showFullRiskModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#0B1510] rounded-card border border-border/80 p-6 sm:p-8 shadow-2xl space-y-5 text-center relative z-10 animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setShowFullRiskModal(false)}
              className="absolute top-4 right-4 p-1.5 text-text-tertiary hover:text-text-primary rounded-full hover:bg-surface"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-xs uppercase font-bold text-text-secondary tracking-widest block">
              Risk Profile Architecture
            </span>

            {/* FULL-SIZE SPEEDOMETER GAUGE */}
            <div className="py-2 flex justify-center">
              <SpeedometerGauge
                score={user.riskProfile.score}
                category={user.riskProfile.category}
                compact={false}
              />
            </div>

            <p className="text-xs text-text-secondary max-w-md mx-auto leading-relaxed">
              {user.riskProfile.categoryDescription}
            </p>

            {/* Target Allocations Grid */}
            <div className="p-4 rounded-2xl glass-card border border-border grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-text-tertiary block text-[10px] uppercase font-bold">Recommended Equity</span>
                <strong className="text-brand-lightGreen font-mono text-sm">
                  {user.riskProfile.category === 'Conservative'
                    ? '25%'
                    : user.riskProfile.category === 'Balanced'
                    ? '55%'
                    : '75–85%'}
                </strong>
              </div>
              <div>
                <span className="text-text-tertiary block text-[10px] uppercase font-bold">Recommended Debt</span>
                <strong className="text-brand-mint font-mono text-sm">
                  {user.riskProfile.category === 'Conservative'
                    ? '65%'
                    : user.riskProfile.category === 'Balanced'
                    ? '40%'
                    : '15–20%'}
                </strong>
              </div>
              <div>
                <span className="text-text-tertiary block text-[10px] uppercase font-bold">Cash Cushion</span>
                <strong className="text-text-secondary font-mono text-sm">
                  {user.riskProfile.category === 'Conservative' ? '10%' : '5%'}
                </strong>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowFullRiskModal(false)}
                className="px-6 py-2.5 rounded-full bg-brand-green hover:bg-brand-darkGreen text-white text-xs font-bold uppercase tracking-wider shadow-glow-green"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
