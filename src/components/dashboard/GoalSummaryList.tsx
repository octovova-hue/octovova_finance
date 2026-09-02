import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { GoalItem, GoalType, PlanType } from '../../types/finance';
import { GoalProgressRing } from '../charts/GoalProgressRing';
import { formatINR, formatYears } from '../../lib/formatters';
import { computeInflationAdjustedFV } from '../../lib/calcEngine';
import {
  HouseColoredIcon,
  WeddingRingsColoredIcon,
  CarColoredIcon,
  BullseyeTargetColoredIcon,
} from '../common/ColoredIcon';
import { Plus, X, Calendar, Layers } from 'lucide-react';

const GOAL_TEMPLATES: {
  type: GoalType;
  label: string;
  icon: React.ReactNode;
  defaultCost: number;
  defaultYears: number;
}[] = [
  { type: 'House', label: 'Dream Home', icon: <HouseColoredIcon className="w-5 h-5" />, defaultCost: 8000000, defaultYears: 5 },
  { type: 'Wedding', label: 'Wedding', icon: <WeddingRingsColoredIcon className="w-5 h-5" />, defaultCost: 2500000, defaultYears: 3 },
  { type: 'Car', label: 'Car', icon: <CarColoredIcon className="w-5 h-5" />, defaultCost: 1500000, defaultYears: 3 },
  { type: 'Other', label: 'Other', icon: <BullseyeTargetColoredIcon className="w-5 h-5" />, defaultCost: 1000000, defaultYears: 3 },
];

const getGoalIcon = (goalType: GoalType) => {
  switch (goalType) {
    case 'House':
      return <HouseColoredIcon className="w-5 h-5" />;
    case 'Wedding':
      return <WeddingRingsColoredIcon className="w-5 h-5" />;
    case 'Car':
      return <CarColoredIcon className="w-5 h-5" />;
    case 'Other':
      return <BullseyeTargetColoredIcon className="w-5 h-5" />;
    default:
      return <BullseyeTargetColoredIcon className="w-5 h-5" />;
  }
};

export const GoalSummaryList: React.FC = () => {
  const { user, assumptions, selectedGoal, setSelectedGoal, addGoal, updateGoalPlan } = useFinance();
  const currentYear = 2026;
  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState<boolean>(false);

  // New goal state in modal
  const [newGoalType, setNewGoalType] = useState<GoalType>('House');
  const [newGoalName, setNewGoalName] = useState<string>('Dream Home');
  const [newGoalCost, setNewGoalCost] = useState<number>(8000000);
  const [newGoalYear, setNewGoalYear] = useState<number>(currentYear + 5);
  const [newGoalPriority, setNewGoalPriority] = useState<number>(4);

  // SECTION 9: Show ALL goals (no truncation or collapsing) sorted newest-first
  const sortedGoals = useMemo(() => {
    return [...user.goals].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [user.goals]);

  const handleOpenAddModal = (template?: typeof GOAL_TEMPLATES[0]) => {
    const t = template || GOAL_TEMPLATES[0];
    setNewGoalType(t.type);
    setNewGoalName(t.label);
    setNewGoalCost(t.defaultCost);
    setNewGoalYear(currentYear + t.defaultYears);
    setNewGoalPriority(4);
    setIsAddGoalModalOpen(true);
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalName.trim()) return;

    addGoal({
      name: newGoalName.trim(),
      goalType: newGoalType,
      targetYear: newGoalYear,
      todayCost: newGoalCost,
      priority: newGoalPriority,
      allocatedAssets: 0,
      activePlanType: 'balanced',
      computedFutureValue: computeInflationAdjustedFV(
        newGoalCost,
        assumptions.inflationRate,
        Math.max(1, newGoalYear - currentYear)
      ),
    });

    setIsAddGoalModalOpen(false);
  };

  return (
    <div className="rounded-card glass-card p-6 border border-border space-y-4 shadow-glass">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-2xl bg-surface">
            <BullseyeTargetColoredIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-text-primary">Your Financial Goals</h3>
            <p className="text-xs text-text-secondary">Track milestones & inflation-adjusted targets</p>
          </div>
        </div>

        {/* SECTION 9: "+ Add Another Goal" button replacing "Compare Plans →" */}
        <button
          onClick={() => handleOpenAddModal()}
          className="px-4 py-2 rounded-full bg-brand-green/20 hover:bg-brand-green/30 text-brand-lightGreen border border-brand-green/40 text-xs font-bold transition-all shadow-glow-green flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Add Another Goal
        </button>
      </div>

      {/* Full Goal Grid (No truncation or collapsing) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {sortedGoals.map((goal) => {
          const years = Math.max(1, goal.targetYear - currentYear);
          const computedFV = computeInflationAdjustedFV(goal.todayCost, assumptions.inflationRate, years);
          const isSelected = selectedGoal?.id === goal.id;
          const currentPlanType: PlanType = goal.activePlanType || 'balanced';

          // Estimate funded progress based on liquid assets vs FV
          const fundedPercent = Math.min(100, Math.round(((goal.allocatedAssets || 0) / computedFV) * 100));

          return (
            <div
              key={goal.id}
              onClick={() => setSelectedGoal(goal)}
              className={`p-4 rounded-card border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                isSelected
                  ? 'glass-card-raised border-brand-green shadow-glow-green'
                  : 'glass-card border-border hover:border-brand-green/40 hover:bg-surface-hover'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <GoalProgressRing
                    progressPercent={fundedPercent || 15}
                    size={48}
                    strokeWidth={5}
                    color="#10B981"
                    icon={getGoalIcon(goal.goalType)}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-text-primary">{goal.name}</h4>
                      {isSelected && (
                        <span className="text-[9px] uppercase px-2 py-0.5 rounded-full bg-brand-green text-white font-bold">
                          Selected
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      Target: <span className="font-mono text-text-secondary">{goal.targetYear}</span> ({formatYears(years)})
                    </p>
                    <p className="text-xs font-mono font-semibold text-brand-lightGreen mt-0.5">
                      {formatINR(computedFV, true)} <span className="text-[10px] text-text-tertiary font-sans font-normal">(FV @ {(assumptions.inflationRate * 100).toFixed(0)}% inf.)</span>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-tertiary block">Priority</span>
                  <span className="text-xs font-mono font-bold text-text-primary">P{goal.priority}</span>
                </div>
              </div>

              {/* SECTION 4: Active Plan Badge & Selector per goal */}
              <div
                className="pt-2 border-t border-border/40 flex items-center justify-between text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-[11px] text-text-secondary flex items-center gap-1">
                  <Layers className="w-3 h-3 text-brand-lightGreen" /> Plan Strategy:
                </span>
                <div className="flex items-center gap-1 bg-surface rounded-full p-0.5 border border-border">
                  {[
                    { id: 'conservative', label: 'Low Risk' },
                    { id: 'balanced', label: 'Moderate Risk' },
                    { id: 'growth', label: 'High Risk' },
                  ].map((pt) => {
                    const isPlanActive = currentPlanType === pt.id;
                    return (
                      <button
                        key={pt.id}
                        type="button"
                        onClick={() => updateGoalPlan(goal.id, pt.id as PlanType)}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-full transition-all ${
                          isPlanActive
                            ? 'bg-brand-green text-white shadow-glow-green'
                            : 'text-text-tertiary hover:text-text-primary'
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

      {/* ADD GOAL MODAL (Section 11: Opaque backdrop and card fix to prevent glass overlap) */}
      {isAddGoalModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#0B1510] rounded-card border border-border/80 shadow-2xl p-6 sm:p-8 space-y-5 text-left relative z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-lg font-bold text-text-primary">Add Another Financial Goal</h3>
                <p className="text-xs text-text-secondary">Customize target milestone, cost and timeline</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddGoalModalOpen(false)}
                className="p-1.5 text-text-tertiary hover:text-text-primary rounded-full hover:bg-surface"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template Selector Chips (4 options: Dream Home, Wedding, Car, Other) */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Select Goal Type
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {GOAL_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.type}
                    type="button"
                    onClick={() => {
                      setNewGoalType(tmpl.type);
                      setNewGoalName(tmpl.label);
                      setNewGoalCost(tmpl.defaultCost);
                      setNewGoalYear(currentYear + tmpl.defaultYears);
                    }}
                    className={`p-2.5 rounded-2xl border transition-all text-left flex items-center gap-2 ${
                      newGoalType === tmpl.type
                        ? 'bg-surface border-brand-green shadow-glow-green'
                        : 'bg-surface/60 border-border hover:border-border'
                    }`}
                  >
                    <div className="p-1 rounded-full bg-surface shrink-0">{tmpl.icon}</div>
                    <span className="text-xs font-bold text-text-primary truncate">{tmpl.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-4 text-xs">
              {/* Goal Name */}
              <div className="space-y-1">
                <label className="text-text-secondary font-semibold">Goal Name</label>
                <input
                  type="text"
                  required
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                  placeholder="e.g. Dream House, Higher Education"
                  className="w-full bg-surface border border-border focus:border-brand-green rounded-full px-4 py-2.5 text-xs font-bold text-text-primary outline-none"
                />
              </div>

              {/* Goal Cost & Target Year */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-text-secondary font-semibold">Cost Today (₹)</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 font-mono text-text-tertiary">₹</span>
                    <input
                      type="number"
                      required
                      min="10000"
                      step="50000"
                      value={newGoalCost || ''}
                      onChange={(e) => setNewGoalCost(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full bg-surface border border-border focus:border-brand-green rounded-full pl-8 pr-3 py-2 text-xs font-mono font-bold text-text-primary outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-text-secondary font-semibold">Target Year</label>
                  <div className="relative flex items-center">
                    <Calendar className="w-3.5 h-3.5 absolute left-3 text-text-tertiary" />
                    <select
                      value={newGoalYear}
                      onChange={(e) => setNewGoalYear(parseInt(e.target.value, 10))}
                      className="w-full bg-surface border border-border focus:border-brand-green rounded-full pl-8 pr-3 py-2 text-xs font-mono font-bold text-text-primary outline-none"
                    >
                      {Array.from({ length: 35 }, (_, i) => currentYear + 1 + i).map(year => (
                        <option key={year} value={year}>
                          {year} ({year - currentYear} yrs)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Priority */}
              <div className="space-y-1">
                <label className="text-text-secondary font-semibold">Priority (P1 to P5)</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setNewGoalPriority(lvl)}
                      className={`flex-1 py-1.5 rounded-full text-xs font-mono font-bold transition-all ${
                        newGoalPriority === lvl
                          ? 'bg-brand-green text-white shadow-glow-green'
                          : 'bg-surface border border-border text-text-secondary'
                      }`}
                    >
                      P{lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddGoalModalOpen(false)}
                  className="px-5 py-2.5 rounded-full text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-brand-green hover:bg-brand-darkGreen text-white font-bold text-xs uppercase tracking-wider shadow-glow-green"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
