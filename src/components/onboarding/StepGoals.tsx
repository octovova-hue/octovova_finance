import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { GoalItem, GoalType } from '../../types/finance';
import { computeInflationAdjustedFV } from '../../lib/calcEngine';
import { formatINR, formatYears } from '../../lib/formatters';
import {
  HouseColoredIcon,
  WeddingRingsColoredIcon,
  CarColoredIcon,
  BullseyeTargetColoredIcon,
} from '../common/ColoredIcon';
import {
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Calendar,
  Zap,
} from 'lucide-react';

interface StepGoalsProps {
  onNext: () => void;
  onPrev: () => void;
}

// Section 5: Goal Type options: Dream Home, Wedding, Car, Other
const AVAILABLE_GOAL_TEMPLATES: {
  type: GoalType;
  label: string;
  icon: React.ReactNode;
  defaultYears: number;
}[] = [
  { type: 'House', label: 'Dream Home', icon: <HouseColoredIcon className="w-5 h-5" />, defaultYears: 5 },
  { type: 'Wedding', label: 'Wedding', icon: <WeddingRingsColoredIcon className="w-5 h-5" />, defaultYears: 3 },
  { type: 'Car', label: 'Car', icon: <CarColoredIcon className="w-5 h-5" />, defaultYears: 3 },
  { type: 'Other', label: 'Other', icon: <BullseyeTargetColoredIcon className="w-5 h-5" />, defaultYears: 4 },
];

export const StepGoals: React.FC<StepGoalsProps> = ({ onNext, onPrev }) => {
  const { user, updateUser, assumptions } = useFinance();
  const currentYear = 2026;

  // Section 5: No goal type is pre-selected by default — user must actively choose
  const [goals, setGoals] = useState<GoalItem[]>(
    user.goals.length > 0 && user.goals.some(g => (g.todayCost || 0) > 0)
      ? user.goals
      : []
  );

  // Add goal template with empty (0) amount
  const handleAddGoalFromType = (template: typeof AVAILABLE_GOAL_TEMPLATES[0]) => {
    const newGoal: GoalItem = {
      id: `g_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: template.label,
      goalType: template.type,
      targetYear: currentYear + template.defaultYears,
      todayCost: 0,
      priority: 4,
      allocatedAssets: 0,
      activePlanType: 'balanced',
      createdAt: Date.now(),
    };
    setGoals(prev => [...prev, newGoal]);
  };

  const handleRemove = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const handleUpdate = (id: string, field: keyof GoalItem, value: any) => {
    setGoals(prev =>
      prev.map(g => (g.id === id ? { ...g, [field]: value } : g))
    );
  };

  const handleContinue = () => {
    const enriched = goals.map(g => {
      const years = Math.max(1, g.targetYear - currentYear);
      return {
        ...g,
        computedFutureValue: computeInflationAdjustedFV(g.todayCost, assumptions.inflationRate, years),
      };
    });
    updateUser({ goals: enriched });
    onNext();
  };

  const isFormValid = goals.length > 0 && goals.every(g => (g.todayCost || 0) > 0);

  return (
    <div className="w-full max-w-xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="text-left">
        <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">What are your primary goals?</h2>
        <p className="text-xs text-text-secondary mt-1">
          Choose your milestones below, then enter your expected cost and target timeline.
        </p>
      </div>

      {/* Goal Type Selection Chips (Section 5: 4 options: Dream Home, Wedding, Car, Other) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {AVAILABLE_GOAL_TEMPLATES.map((gt) => {
          const isSelected = goals.some(g => g.goalType === gt.type);

          return (
            <button
              key={gt.type}
              type="button"
              onClick={() => handleAddGoalFromType(gt)}
              className={`p-3 rounded-card border transition-all text-left flex items-center justify-between gap-2 group ${
                isSelected
                  ? 'glass-card-raised border-brand-green/60 shadow-glow-green'
                  : 'glass-card border-border hover:border-brand-green/40 hover:bg-surface-hover'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-full bg-surface shrink-0">
                  {gt.icon}
                </div>
                <div className="min-w-0 truncate">
                  <span className="text-xs font-bold text-text-primary block truncate">{gt.label}</span>
                </div>
              </div>
              <Plus className="w-3.5 h-3.5 text-brand-lightGreen shrink-0 group-hover:scale-125 transition-transform" />
            </button>
          );
        })}
      </div>

      {/* Empty State Prompt if No Goal Chosen Yet */}
      {goals.length === 0 && (
        <div className="p-8 rounded-card border-2 border-dashed border-border/70 text-center space-y-2 bg-surface/30 animate-in fade-in">
          <BullseyeTargetColoredIcon className="w-8 h-8 mx-auto opacity-70" />
          <p className="text-sm font-bold text-text-primary">No goal selected yet</p>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            Click on <strong>Dream Home</strong>, <strong>Wedding</strong>, <strong>Car</strong>, or <strong>Other</strong> above to add your milestone.
          </p>
        </div>
      )}

      {/* Active Goal Cards with 0 placeholder */}
      <div className="space-y-4">
        {goals.map((goal, idx) => {
          const years = Math.max(1, goal.targetYear - currentYear);
          const computedFV = computeInflationAdjustedFV(goal.todayCost, assumptions.inflationRate, years);

          return (
            <div
              key={goal.id}
              className="p-5 rounded-card glass-card-raised border border-border space-y-4 shadow-glass relative overflow-hidden"
            >
              {/* Header: Editable Goal Name Field */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-1">
                  <span className="text-xs uppercase font-bold px-2.5 py-1 rounded-full bg-brand-green/20 text-brand-lightGreen border border-brand-green/30">
                    Goal #{idx + 1}
                  </span>
                  <input
                    type="text"
                    value={goal.name}
                    onChange={(e) => handleUpdate(goal.id, 'name', e.target.value)}
                    placeholder="Enter goal name (e.g. Dream House)"
                    className="flex-1 font-extrabold text-sm sm:text-base text-text-primary bg-surface border border-border focus:border-brand-green rounded-full px-3.5 py-1 outline-none transition-all"
                  />
                </div>

                {goals.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemove(goal.id)}
                    className="p-2 text-text-tertiary hover:text-danger rounded-full hover:bg-surface transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Form Fields: Cost & Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Present Cost */}
                <div>
                  <label className="text-[11px] font-semibold text-text-secondary block mb-1">
                    Cost in Today's Money (₹)
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 font-mono text-text-tertiary text-xs">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={goal.todayCost === 0 ? '' : goal.todayCost}
                      onChange={(e) => handleUpdate(goal.id, 'todayCost', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full bg-surface border border-border focus:border-brand-green rounded-full pl-8 pr-4 py-2 text-xs font-mono font-bold text-text-primary outline-none"
                    />
                  </div>
                </div>

                {/* Target Year Picker */}
                <div>
                  <label className="text-[11px] font-semibold text-text-secondary block mb-1">
                    Target Year ({formatYears(years)} from now)
                  </label>
                  <div className="relative flex items-center">
                    <Calendar className="w-3.5 h-3.5 absolute left-3.5 text-text-tertiary" />
                    <select
                      value={goal.targetYear}
                      onChange={(e) => handleUpdate(goal.id, 'targetYear', parseInt(e.target.value, 10))}
                      className="w-full bg-surface border border-border focus:border-brand-green rounded-full pl-9 pr-3 py-2 text-xs font-mono font-bold text-text-primary outline-none"
                    >
                      {Array.from({ length: 40 }, (_, i) => currentYear + 1 + i).map(year => (
                        <option key={year} value={year}>
                          {year} ({year - currentYear} yrs)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Priority Chips */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-semibold text-text-secondary">Priority Level:</span>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => handleUpdate(goal.id, 'priority', lvl)}
                      className={`w-7 h-7 rounded-full text-xs font-mono font-bold transition-all ${
                        goal.priority === lvl
                          ? 'bg-brand-green text-white shadow-glow-green'
                          : 'bg-surface border border-border text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* LIVE INFLATION PREVIEW STRIP */}
              <div className="p-3 rounded-2xl bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-text-secondary">
                  <Zap className="w-3.5 h-3.5 text-brand-lightGreen shrink-0" />
                  <span>
                    <strong>{formatINR(goal.todayCost, true)}</strong> today →
                    <strong className="text-brand-lightGreen font-mono ml-1">{formatINR(computedFV, true)}</strong> in {years} years
                  </span>
                </div>
                <span className="text-[10px] text-text-tertiary">
                  @ {(assumptions.inflationRate * 100).toFixed(1)}% annual inflation
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation - Button renamed to "Know Your Plan" per Section 10 */}
      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={onPrev}
          className="flex items-center gap-1.5 px-6 py-2.5 rounded-full text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <button
          type="button"
          onClick={handleContinue}
          disabled={!isFormValid}
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-brand-green hover:bg-brand-darkGreen disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider shadow-glow-green transition-all transform hover:scale-105"
        >
          Know Your Plan <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
