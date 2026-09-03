import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { GoalItem, GoalType, PlanType } from '../../types/finance';
import { formatINR, formatYears } from '../../lib/formatters';
import { computeInflationAdjustedFV } from '../../lib/calcEngine';
import { AddGoalModal } from './AddGoalModal';
import {
  Home,
  Heart,
  Car,
  GraduationCap,
  ShieldCheck,
  Target,
  Plus,
  Layers,
  Trash2,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

export const GoalSummaryList: React.FC = () => {
  const {
    user,
    assumptions,
    selectedGoal,
    setSelectedGoal,
    updateGoalPlan,
    removeGoal,
  } = useFinance();

  const currentYear = new Date().getFullYear() || 2026;
  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState<boolean>(false);

  // Show all goals sorted newest first
  const sortedGoals = useMemo(() => {
    return [...user.goals].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [user.goals]);

  // Aggregate goal stats
  const totalTargetFV = useMemo(() => {
    return sortedGoals.reduce((sum, g) => {
      const years = Math.max(1, g.targetYear - currentYear);
      return sum + computeInflationAdjustedFV(g.todayCost, assumptions.inflationRate, years);
    }, 0);
  }, [sortedGoals, assumptions.inflationRate, currentYear]);

  const getGoalIcon = (goalType: GoalType) => {
    switch (goalType) {
      case 'House':
        return <Home className="w-4 h-4 text-brand-lightGreen" />;
      case 'Wedding':
        return <Heart className="w-4 h-4 text-pink-400" />;
      case 'Car':
        return <Car className="w-4 h-4 text-blue-400" />;
      case 'Education':
        return <GraduationCap className="w-4 h-4 text-purple-400" />;
      case 'Retirement':
        return <ShieldCheck className="w-4 h-4 text-amber-400" />;
      default:
        return <Target className="w-4 h-4 text-brand-mint" />;
    }
  };

  const getPriorityBadge = (priority: number) => {
    switch (priority) {
      case 1:
        return { label: 'P1 Critical', bg: 'bg-red-500/10 text-red-400 border-red-500/20' };
      case 2:
        return { label: 'P2 High', bg: 'bg-orange-500/10 text-orange-400 border-orange-500/20' };
      case 3:
        return { label: 'P3 Medium', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
      case 4:
        return { label: 'P4 Standard', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
      default:
        return { label: 'P5 Flexible', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
    }
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-2xl dash-card-dark">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-brand-green/10 text-brand-lightGreen">
              <Target className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-text-primary tracking-tight">
              Financial Goals & Milestones
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-text-secondary font-mono border border-white/8">
              {sortedGoals.length} {sortedGoals.length === 1 ? 'Goal' : 'Goals'}
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Total inflation-adjusted milestone target:{' '}
            <strong className="text-text-primary font-mono">{formatINR(totalTargetFV, true)}</strong>
          </p>
        </div>

        {/* Action Button to Open Portal Modal */}
        <button
          type="button"
          onClick={() => setIsAddGoalModalOpen(true)}
          className="h-10 px-4 rounded-xl bg-brand-green hover:bg-brand-darkGreen text-white text-xs font-bold uppercase tracking-wider shadow-glow-green flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Financial Goal</span>
        </button>
      </div>

      {/* Goals Grid */}
      {sortedGoals.length === 0 ? (
        <div className="p-10 rounded-2xl bg-[#0D1612] border border-dashed border-brand-green/25 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-text-tertiary">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-text-primary">No financial goals added yet</h4>
            <p className="text-xs text-text-secondary mt-1 max-w-sm mx-auto">
              Create your first target milestone to calculate personalized monthly investments and asset allocations.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddGoalModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-brand-green/20 text-brand-lightGreen border border-brand-green/40 text-xs font-bold transition-all hover:bg-brand-green/30"
          >
            + Create First Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedGoals.map((goal) => {
            const years = Math.max(1, goal.targetYear - currentYear);
            const computedFV = computeInflationAdjustedFV(goal.todayCost, assumptions.inflationRate, years);
            const isSelected = selectedGoal?.id === goal.id;
            const currentPlanType: PlanType = goal.activePlanType || 'balanced';
            const priorityInfo = getPriorityBadge(goal.priority);

            // Funding calculation
            const fundedAmount = goal.allocatedAssets || Math.round(computedFV * 0.18);
            const progressPct = Math.min(100, Math.round((fundedAmount / computedFV) * 100));

            return (
              <div
                key={goal.id}
                onClick={() => setSelectedGoal(goal)}
                className={`group relative p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-4 ${
                  isSelected
                    ? 'bg-background-surface border-brand-green/60 shadow-glow-green ring-1 ring-brand-green/30'
                    : 'dash-card-dark hover:border-brand-green/30'
                }`}
              >
                {/* Top Row: Icon, Name, Target Year, Priority */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2.5 rounded-xl border transition-colors ${
                        isSelected
                          ? 'bg-brand-green/15 border-brand-green/30'
                          : 'bg-surface border-border'
                      }`}
                    >
                      {getGoalIcon(goal.goalType)}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-text-primary tracking-tight">
                          {goal.name}
                        </h4>
                        {isSelected && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-brand-lightGreen bg-brand-green/15 px-2 py-0.5 rounded-full border border-brand-green/30">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Selected
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-text-secondary mt-1">
                        <span>
                          Target: <strong className="text-text-primary font-mono">{goal.targetYear}</strong>
                        </span>
                        <span className="text-text-tertiary">•</span>
                        <span>{formatYears(years)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md border ${priorityInfo.bg}`}
                    >
                      {priorityInfo.label}
                    </span>
                    {sortedGoals.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Remove "${goal.name}"?`)) {
                            removeGoal(goal.id);
                          }
                        }}
                        className="p-1 text-text-tertiary hover:text-danger rounded-md hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Middle Row: Financial Metrics (Cost Today vs Projected Inflation FV) */}
                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-surface border border-border text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-text-tertiary block">
                      Cost in {currentYear}
                    </span>
                    <span className="font-mono font-bold text-text-primary text-sm mt-0.5 block">
                      {formatINR(goal.todayCost, true)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-text-tertiary block flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-brand-lightGreen" /> Target FV ({(assumptions.inflationRate * 100).toFixed(0)}% inf.)
                    </span>
                    <span className="font-mono font-bold text-brand-lightGreen text-sm mt-0.5 block">
                      {formatINR(computedFV, true)}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-text-secondary">Estimated Accumulation</span>
                    <span className="font-mono font-semibold text-text-primary">
                      {formatINR(fundedAmount, true)} ({progressPct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-surface rounded-full overflow-hidden border border-border">
                    <div
                      className="h-full bg-gradient-to-r from-brand-darkGreen to-brand-lightGreen rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, progressPct)}%` }}
                    />
                  </div>
                </div>

                {/* Bottom Row: Plan Strategy Selector */}
                <div
                  className="pt-2.5 border-t border-white/6 flex items-center justify-between text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-[11px] text-text-secondary flex items-center gap-1">
                    <Layers className="w-3 h-3 text-brand-lightGreen" /> Strategy:
                  </span>

                  <div className="flex items-center gap-1 bg-surface-dark rounded-lg p-0.5 border border-white/8">
                    {[
                      { id: 'conservative', label: 'Conservative' },
                      { id: 'balanced', label: 'Balanced' },
                      { id: 'growth', label: 'Growth' },
                    ].map((pt) => {
                      const isPlanActive = currentPlanType === pt.id;
                      return (
                        <button
                          key={pt.id}
                          type="button"
                          onClick={() => updateGoalPlan(goal.id, pt.id as PlanType)}
                          className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all duration-150 ${
                            isPlanActive
                              ? 'bg-brand-green text-white shadow-glow-green font-bold'
                              : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                          }`}
                        >
                          {pt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Render AddGoalModal through Portal */}
      <AddGoalModal
        isOpen={isAddGoalModalOpen}
        onClose={() => setIsAddGoalModalOpen(false)}
      />
    </div>
  );
};
