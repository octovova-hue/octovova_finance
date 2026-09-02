import React, { useState } from 'react';
import { ModalPortal } from '../common/ModalPortal';
import { useFinance } from '../../context/FinanceContext';
import { GoalType } from '../../types/finance';
import { computeInflationAdjustedFV } from '../../lib/calcEngine';
import { formatINR } from '../../lib/formatters';
import {
  Home,
  Heart,
  Car,
  GraduationCap,
  Plane,
  ShieldCheck,
  Briefcase,
  Target,
  X,
  Calendar,
  IndianRupee,
  Check,
} from 'lucide-react';

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GoalCategoryOption {
  id: string;
  type: GoalType;
  label: string;
  defaultName: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultCost: number;
  defaultYears: number;
}

const GOAL_CATEGORIES: GoalCategoryOption[] = [
  {
    id: 'home',
    type: 'House',
    label: 'Dream Home',
    defaultName: 'Dream House',
    icon: Home,
    defaultCost: 8000000,
    defaultYears: 5,
  },
  {
    id: 'wedding',
    type: 'Wedding',
    label: 'Wedding',
    defaultName: 'Wedding Fund',
    icon: Heart,
    defaultCost: 2500000,
    defaultYears: 3,
  },
  {
    id: 'car',
    type: 'Car',
    label: 'Car',
    defaultName: 'New Car',
    icon: Car,
    defaultCost: 1500000,
    defaultYears: 2,
  },
  {
    id: 'education',
    type: 'Education',
    label: 'Education',
    defaultName: 'Higher Education',
    icon: GraduationCap,
    defaultCost: 3000000,
    defaultYears: 4,
  },
  {
    id: 'vacation',
    type: 'Other',
    label: 'Vacation',
    defaultName: 'World Tour',
    icon: Plane,
    defaultCost: 600000,
    defaultYears: 1,
  },
  {
    id: 'retirement',
    type: 'Retirement',
    label: 'Retirement',
    defaultName: 'Retirement Nest Egg',
    icon: ShieldCheck,
    defaultCost: 20000000,
    defaultYears: 15,
  },
  {
    id: 'business',
    type: 'Other',
    label: 'Business',
    defaultName: 'Startup Venture Fund',
    icon: Briefcase,
    defaultCost: 4000000,
    defaultYears: 5,
  },
  {
    id: 'other',
    type: 'Other',
    label: 'Other',
    defaultName: 'Financial Milestone',
    icon: Target,
    defaultCost: 1000000,
    defaultYears: 3,
  },
];

const PRIORITIES = [
  { level: 1, label: 'P1', desc: 'Critical' },
  { level: 2, label: 'P2', desc: 'High' },
  { level: 3, label: 'P3', desc: 'Medium' },
  { level: 4, label: 'P4', desc: 'Standard' },
  { level: 5, label: 'P5', desc: 'Flexible' },
];

export const AddGoalModal: React.FC<AddGoalModalProps> = ({ isOpen, onClose }) => {
  const { assumptions, addGoal } = useFinance();
  const currentYear = new Date().getFullYear() || 2026;

  // Form state
  const [selectedCategory, setSelectedCategory] = useState<GoalCategoryOption>(GOAL_CATEGORIES[0]);
  const [goalName, setGoalName] = useState<string>(GOAL_CATEGORIES[0].defaultName);
  const [costToday, setCostToday] = useState<number>(GOAL_CATEGORIES[0].defaultCost);
  const [targetYear, setTargetYear] = useState<number>(currentYear + GOAL_CATEGORIES[0].defaultYears);
  const [priority, setPriority] = useState<number>(3);
  const [error, setError] = useState<string | null>(null);

  const horizonYears = Math.max(1, targetYear - currentYear);
  const projectedFV = computeInflationAdjustedFV(costToday, assumptions.inflationRate, horizonYears);

  const handleSelectCategory = (cat: GoalCategoryOption) => {
    setSelectedCategory(cat);
    // If the user hasn't heavily customized the goal name yet or it matches previous category name
    setGoalName(cat.defaultName);
    setCostToday(cat.defaultCost);
    setTargetYear(currentYear + cat.defaultYears);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName.trim()) {
      setError('Please provide a goal name.');
      return;
    }
    if (costToday <= 0) {
      setError('Please provide a valid estimated cost.');
      return;
    }

    addGoal({
      name: goalName.trim(),
      goalType: selectedCategory.type,
      targetYear,
      todayCost: costToday,
      priority,
      allocatedAssets: 0,
      activePlanType: 'balanced',
      computedFutureValue: projectedFV,
    });

    onClose();
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose} ariaLabel="Add Financial Goal">
      <div className="w-full max-w-[700px] bg-[#0C1410] border border-white/10 rounded-2xl shadow-modal overflow-hidden text-left animate-modal-enter">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-white/8 bg-[#0F1914]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
              <h2 className="text-lg sm:text-xl font-bold text-text-primary tracking-tight">
                Add Financial Goal
              </h2>
            </div>
            <p className="text-xs text-text-secondary mt-1">
              Define your milestone, target timeline, and capital requirements to build an automated plan.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-text-tertiary hover:text-text-primary rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Section 1: Goal Category */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                1. Select Category
              </label>
              <span className="text-[11px] text-text-tertiary">
                Choose a template to prefill parameters
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {GOAL_CATEGORIES.map((cat) => {
                const IconComponent = cat.icon;
                const isSelected = selectedCategory.id === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelectCategory(cat)}
                    className={`relative p-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-brand-green/10 border-brand-green text-text-primary shadow-glow-green ring-1 ring-brand-green/30'
                        : 'bg-white/[0.02] border-white/8 text-text-secondary hover:text-text-primary hover:border-white/15 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div
                        className={`p-2 rounded-lg transition-colors ${
                          isSelected ? 'bg-brand-green text-white' : 'bg-white/5 text-text-secondary'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      {isSelected && (
                        <span className="w-4 h-4 rounded-full bg-brand-green text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-semibold block tracking-tight">
                        {cat.label}
                      </span>
                      <span className="text-[10px] text-text-tertiary block font-mono">
                        ~{formatINR(cat.defaultCost, true)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Goal Details (Goal Name) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary block">
              2. Goal Name <span className="text-brand-lightGreen">*</span>
            </label>
            <input
              type="text"
              required
              value={goalName}
              onChange={(e) => {
                setGoalName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Dream House, Higher Education, Tesla Model Y"
              className="w-full h-12 px-4 rounded-xl bg-surface-dark border border-white/10 text-sm font-semibold text-text-primary placeholder:text-text-tertiary focus:border-brand-green focus:ring-1 focus:ring-brand-green/50 focus:outline-none transition-all"
            />
          </div>

          {/* Section 3: Financial Details (Cost & Year Side by Side) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                3. Financial Details
              </label>
              <span className="text-[11px] text-brand-lightGreen font-mono">
                Inflation {(assumptions.inflationRate * 100).toFixed(0)}% p.a.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Cost Today */}
              <div className="space-y-1">
                <span className="text-xs font-medium text-text-secondary">Estimated Cost Today</span>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center pointer-events-none text-text-tertiary">
                    <IndianRupee className="w-4 h-4" />
                  </div>
                  <input
                    type="number"
                    required
                    min="10000"
                    step="50000"
                    value={costToday || ''}
                    onChange={(e) => setCostToday(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full h-11 pl-9 pr-4 rounded-xl bg-surface-dark border border-white/10 text-sm font-mono font-bold text-text-primary focus:border-brand-green focus:ring-1 focus:ring-brand-green/50 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Target Year */}
              <div className="space-y-1">
                <span className="text-xs font-medium text-text-secondary">Target Horizon</span>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center pointer-events-none text-text-tertiary">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <select
                    value={targetYear}
                    onChange={(e) => setTargetYear(parseInt(e.target.value, 10))}
                    className="w-full h-11 pl-9 pr-8 rounded-xl bg-surface-dark border border-white/10 text-sm font-mono font-bold text-text-primary focus:border-brand-green focus:ring-1 focus:ring-brand-green/50 focus:outline-none transition-all cursor-pointer appearance-none"
                  >
                    {Array.from({ length: 30 }, (_, i) => currentYear + 1 + i).map((yr) => (
                      <option key={yr} value={yr} className="bg-[#0C1410] text-text-primary">
                        {yr} ({yr - currentYear} {yr - currentYear === 1 ? 'year' : 'years'})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 pointer-events-none text-text-tertiary text-xs">
                    ▼
                  </div>
                </div>
              </div>
            </div>

            {/* Live Inflation preview banner */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/6 flex items-center justify-between text-xs mt-2">
              <span className="text-text-secondary">Future Value in {targetYear} ({horizonYears} yrs):</span>
              <span className="font-mono font-bold text-brand-lightGreen text-sm">
                {formatINR(projectedFV)}
              </span>
            </div>
          </div>

          {/* Section 4: Priority Selector (P1 to P5) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                4. Priority Level
              </label>
              <span className="text-[11px] text-text-tertiary">
                Guides automated asset allocation
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {PRIORITIES.map((p) => {
                const isSelected = priority === p.level;
                return (
                  <button
                    key={p.level}
                    type="button"
                    onClick={() => setPriority(p.level)}
                    className={`py-2 px-1 rounded-xl border text-center transition-all duration-200 ${
                      isSelected
                        ? 'bg-brand-green border-brand-green text-white shadow-glow-green'
                        : 'bg-white/[0.02] border-white/8 text-text-secondary hover:text-text-primary hover:border-white/15'
                    }`}
                  >
                    <span className="text-xs font-mono font-bold block">{p.label}</span>
                    <span className="text-[9px] uppercase tracking-wider opacity-80 block truncate">
                      {p.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <p className="text-xs text-danger font-medium">{error}</p>
          )}

          {/* Section 5: Actions (Cancel & Save Goal) */}
          <div className="pt-2 border-t border-white/8 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-5 rounded-xl border border-white/10 text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-11 px-6 rounded-xl bg-brand-green hover:bg-brand-darkGreen text-white text-xs font-bold uppercase tracking-wider shadow-glow-green transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              Save Goal
            </button>
          </div>
        </form>
      </div>
    </ModalPortal>
  );
};
