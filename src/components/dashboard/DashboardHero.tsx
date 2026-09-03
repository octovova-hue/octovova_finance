import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { AnimatedNumber } from '../common/AnimatedNumber';
import { CashFlowSparkline } from '../charts/CashFlowSparkline';
import { SpeedometerGauge } from '../common/SpeedometerGauge';
import { InfoTooltip } from '../common/InfoTooltip';
import {
  AlertTriangle,
  X,
  Maximize2,
  TrendingUp,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
} from 'lucide-react';
import { formatINR } from '../../lib/formatters';

export const DashboardHero: React.FC = () => {
  const { user, financials, assumptions } = useFinance();
  const [showWarning, setShowWarning] = useState<boolean>(true);
  const [showFullRiskModal, setShowFullRiskModal] = useState<boolean>(false);

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Emergency Fund Notice */}
      {!financials.isEmergencyFundAdequate && showWarning && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start justify-between gap-3 text-xs text-text-primary">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-300 block font-semibold">
                Emergency Reserve Recommendation
              </strong>
              <span className="text-text-secondary">
                Your liquid reserves cover {financials.emergencyFundMonthsCovered} of the recommended{' '}
                {assumptions.emergencyBufferMonths} months of expenses. Consider allocating liquid surplus before aggressive risk assets.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowWarning(false)}
            className="p-1 text-text-tertiary hover:text-text-primary rounded-lg hover:bg-surface transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hero Metrics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Net Worth & Cash Flow Card — soft off-white/mint hero treatment */}
        <div className="lg:col-span-2 dash-card-light rounded-2xl p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Ambient Sheen */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-green/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-4 relative z-10">
            {/* Top Row: Label & User Risk Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-brand-green/10 text-brand-darkGreen">
                  <Wallet className="w-4 h-4" />
                </div>
                <span className="text-xs uppercase font-bold tracking-wider text-[#3F5B4E]">
                  Total Financial Net Worth
                </span>
              </div>
              <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-brand-green/15 text-brand-darkGreen border border-brand-green/30">
                {user.riskProfile.category} Profile
              </span>
            </div>

            {/* Net Worth Large Metric */}
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
              <span className="flex items-baseline gap-1.5">
                {financials.isNetWorthNegative ? (
                  <ArrowDownRight className="w-6 h-6 sm:w-8 sm:h-8 text-danger shrink-0 self-center" strokeWidth={2.75} />
                ) : (
                  <ArrowUpRight className="w-6 h-6 sm:w-8 sm:h-8 text-brand-darkGreen shrink-0 self-center" strokeWidth={2.75} />
                )}
                <AnimatedNumber
                  value={Math.abs(financials.netWorth)}
                  currency="INR"
                  className={`text-3xl sm:text-4xl lg:text-5xl font-mono font-extrabold tracking-tight ${
                    financials.isNetWorthNegative ? 'text-danger' : 'text-[#0B2A1D]'
                  }`}
                />
              </span>
            </div>

            {/* Assets & Debts Breakdown Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-black/[0.025] border border-black/[0.06]">
                <span className="text-[10px] uppercase font-bold text-[#6E8579] flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3 text-brand-darkGreen" /> Total Assets
                </span>
                <span className="font-mono font-bold text-[#0B2A1D] text-sm sm:text-base mt-0.5 block">
                  {formatINR(financials.totalAssets)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-black/[0.025] border border-black/[0.06]">
                <span className="text-[10px] uppercase font-bold text-[#6E8579] flex items-center gap-1">
                  <ArrowDownRight className="w-3 h-3 text-danger" /> Total Liabilities
                </span>
                <span className="font-mono font-bold text-red-600 text-sm sm:text-base mt-0.5 block">
                  {formatINR(financials.totalLiabilities)}
                </span>
              </div>

              <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-black/[0.025] border border-black/[0.06]">
                <span className="text-[10px] uppercase font-bold text-[#6E8579] flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-brand-darkGreen" /> Liquid Cushion
                  <InfoTooltip
                    align="right"
                    text="The part of your money you can get to quickly — cash and investments you can sell fast, like savings or liquid mutual funds. It doesn't include things like property that take time to sell. This is what you'd actually have on hand in an emergency."
                  />
                </span>
                <span className="font-mono font-bold text-brand-darkGreen text-sm sm:text-base mt-0.5 block">
                  {formatINR(financials.liquidAssetsAvailable)}
                </span>
              </div>
            </div>
          </div>

          {/* Monthly Cash Flow Trajectory Strip */}
          <div className="mt-5 pt-4 border-t border-black/[0.08] relative z-10">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-[#3F5B4E] font-medium">Monthly Cash Flow Trajectory</span>
              <span
                className={`font-mono font-bold ${
                  financials.isCashFlowNegative ? 'text-danger' : 'text-brand-darkGreen'
                }`}
              >
                {financials.monthlyCashFlow >= 0 ? '+' : ''}
                {formatINR(financials.monthlyCashFlow)}/mo
              </span>
            </div>
            <CashFlowSparkline cashFlow={financials.monthlyCashFlow} height={36} />
          </div>
        </div>

        {/* Right Column: Risk Profile (compact) + Emergency Fund, stacked */}
        <div className="flex flex-col gap-4">
          {/* Connected Risk Profile Card — dark green-to-black gradient */}
          <div className="dash-card-dark rounded-2xl p-4 flex flex-col justify-between items-center text-center relative group">
            <div className="w-full flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-text-secondary tracking-wider">
                Risk Profile & Health
              </span>
              <button
                type="button"
                onClick={() => setShowFullRiskModal(true)}
                className="p-1 text-text-tertiary hover:text-brand-lightGreen rounded-lg hover:bg-surface transition-colors"
                title="Expand full risk architecture"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Speedometer Gauge */}
            <div className="py-1">
              <SpeedometerGauge
                score={user.riskProfile.score}
                category={user.riskProfile.category}
                compact={true}
                onClickDetail={() => setShowFullRiskModal(true)}
              />
            </div>

            <div className="w-full pt-2.5 border-t border-white/6 flex items-center justify-between text-xs">
              <span className="text-text-tertiary">Score: <strong className="text-text-primary font-mono">{user.riskProfile.score}/25</strong></span>
              <button
                type="button"
                onClick={() => setShowFullRiskModal(true)}
                className="text-brand-lightGreen hover:underline font-semibold"
              >
                Risk Breakdown →
              </button>
            </div>
          </div>

          {/* Emergency Fund Card — backend-computed savings capacity & reserve coverage */}
          <div className="dash-card-dark rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-text-secondary tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-brand-lightGreen" /> Emergency Fund
              </span>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                  financials.isEmergencyFundAdequate
                    ? 'bg-brand-green/15 text-brand-lightGreen border-brand-green/30'
                    : 'bg-amber-400/10 text-amber-300 border-amber-400/30'
                }`}
              >
                {financials.isEmergencyFundAdequate ? 'Healthy' : 'Needs Attention'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-text-tertiary">Monthly Savings Capacity</span>
              <span className="font-mono font-bold text-brand-lightGreen">
                {formatINR(financials.savingsCapacity, true)}
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-text-tertiary">
                  Target: {formatINR(financials.emergencyFundRequired, true)}
                </span>
                <span className="font-mono font-semibold text-text-primary">
                  {financials.emergencyFundMonthsCovered} / {assumptions.emergencyBufferMonths} mo
                </span>
              </div>
              <div className="h-2 w-full bg-surface rounded-full overflow-hidden border border-border">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    financials.isEmergencyFundAdequate
                      ? 'bg-gradient-to-r from-brand-darkGreen to-brand-lightGreen'
                      : 'bg-gradient-to-r from-amber-500 to-amber-300'
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(5, (financials.emergencyFundMonthsCovered / assumptions.emergencyBufferMonths) * 100)
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Detail Risk Profile Modal */}
      {showFullRiskModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setShowFullRiskModal(false)}
          />

          <div className="w-full max-w-lg dash-card-dark rounded-2xl p-6 sm:p-8 space-y-5 text-center relative z-10 animate-modal-enter">
            <button
              type="button"
              onClick={() => setShowFullRiskModal(false)}
              className="absolute top-4 right-4 p-1.5 text-text-tertiary hover:text-text-primary rounded-lg hover:bg-surface transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-xs uppercase font-mono font-bold text-brand-lightGreen tracking-widest block">
              Risk Architecture
            </span>

            <div className="flex items-center justify-center gap-1.5">
              <span className="text-[11px] text-text-tertiary font-mono">How is this calculated?</span>
              <InfoTooltip text="Your risk score comes from 5 quick questions — about things like how long you plan to stay invested and how you'd react if the market dropped. Each answer is worth 1 to 5 points, so your total score can range from 5 to 25. That total decides your risk category (Conservative through Aggressive), which shapes how much of your plan goes into stocks vs. safer options." />
            </div>

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
            <div className="p-4 rounded-xl bg-surface border border-border grid grid-cols-3 gap-2 text-center text-xs">
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
                className="px-6 py-2.5 rounded-xl bg-brand-green hover:bg-brand-darkGreen text-white text-xs font-bold uppercase tracking-wider shadow-glow-green"
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
