import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { ExpenseCategoryType, ExpenseItem } from '../../types/finance';
import { AnimatedNumber } from '../common/AnimatedNumber';
import { formatINR } from '../../lib/formatters';
import {
  HouseColoredIcon,
  FoodColoredIcon,
  CarColoredIcon,
  BankLoanColoredIcon,
  LifestyleColoredIcon,
  UtilitiesColoredIcon,
} from '../common/ColoredIcon';
import {
  ArrowRight,
  ArrowLeft,
  TrendingDown,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface StepExpensesProps {
  onNext: () => void;
  onPrev: () => void;
}

interface CategoryConfig {
  label: string;
  icon: React.ReactNode;
}

const CATEGORIES: Record<ExpenseCategoryType, CategoryConfig> = {
  Housing: { label: 'Housing / Rent', icon: <HouseColoredIcon className="w-5 h-5" /> },
  Food: { label: 'Food & Groceries', icon: <FoodColoredIcon className="w-5 h-5" /> },
  Transport: { label: 'Transport / Fuel', icon: <CarColoredIcon className="w-5 h-5" /> },
  EMI: { label: 'Loan EMIs', icon: <BankLoanColoredIcon className="w-5 h-5" /> },
  Lifestyle: { label: 'Lifestyle / Leisure', icon: <LifestyleColoredIcon className="w-5 h-5" /> },
  Other: { label: 'Other Utilities', icon: <UtilitiesColoredIcon className="w-5 h-5" /> },
};

export const StepExpenses: React.FC<StepExpensesProps> = ({ onNext, onPrev }) => {
  const { user, updateUser } = useFinance();

  const totalIncome = user.income.reduce((sum, i) => sum + (i.monthlyAmount || 0), 0) || 150000;
  const maxExpenseSlider = Math.max(totalIncome, 100000);
  const defaultExpenseValue = Math.round(totalIncome * 0.5); // Sensible midpoint (~50% of income)

  const initialExpensesSum = user.expenses.reduce((sum, e) => sum + (e.monthlyAmount || 0), 0);
  const [totalExpenseValue, setTotalExpenseValue] = useState<number>(
    initialExpensesSum > 0 ? initialExpensesSum : defaultExpenseValue
  );

  const [showItemized, setShowItemized] = useState<boolean>(false);

  // SECTION 7: Every itemized category field defaults strictly to ₹0
  // CRITICAL: The total-expenses slider must NEVER write into these per-category fields.
  const [itemizedAmounts, setItemizedAmounts] = useState<Record<ExpenseCategoryType, number>>(() => {
    const initial: Record<ExpenseCategoryType, number> = {
      Housing: 0,
      Food: 0,
      Transport: 0,
      EMI: 0,
      Lifestyle: 0,
      Other: 0,
    };
    if (user.expenses && user.expenses.length > 0) {
      user.expenses.forEach(e => {
        if (initial[e.category] !== undefined) {
          initial[e.category] = e.monthlyAmount || 0;
        }
      });
    }
    return initial;
  });

  // Calculate net monthly cash flow
  const effectiveExpense = showItemized
    ? Object.values(itemizedAmounts).reduce((a, b) => a + b, 0)
    : totalExpenseValue;

  const monthlyCashFlow = totalIncome - effectiveExpense;

  const handleSliderChange = (newVal: number) => {
    setTotalExpenseValue(newVal);
    // SECTION 7: Slider value does NOT sync or override per-category fields
  };

  const handleItemizedAmountChange = (category: ExpenseCategoryType, amount: number) => {
    setItemizedAmounts(prev => ({
      ...prev,
      [category]: Math.max(0, amount),
    }));
  };

  const handleContinue = () => {
    // If user used itemized breakdown, save individual itemized categories
    // If user used aggregate slider, save as distributed categories
    let finalExpenses: ExpenseItem[];
    if (showItemized) {
      finalExpenses = (Object.keys(itemizedAmounts) as ExpenseCategoryType[]).map((cat, idx) => ({
        id: `exp_${idx + 1}`,
        category: cat,
        monthlyAmount: itemizedAmounts[cat] || 0,
      }));
    } else {
      finalExpenses = [
        { id: 'exp_1', category: 'Housing', monthlyAmount: Math.round(totalExpenseValue * 0.4) },
        { id: 'exp_2', category: 'Food', monthlyAmount: Math.round(totalExpenseValue * 0.3) },
        { id: 'exp_3', category: 'Transport', monthlyAmount: Math.round(totalExpenseValue * 0.15) },
        { id: 'exp_4', category: 'Other', monthlyAmount: Math.round(totalExpenseValue * 0.15) },
      ];
    }
    updateUser({ expenses: finalExpenses });
    onNext();
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Running Total & Cash Flow Banner */}
      <div className="rounded-card glass-card p-5 border border-border flex items-center justify-between shadow-glass">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-surface">
            <TrendingDown className="w-5 h-5 text-danger" />
          </div>
          <div>
            <span className="text-xs uppercase font-bold text-text-secondary tracking-wider block">
              Total Monthly Expenses
            </span>
            <span className="text-xs text-text-tertiary">
              Net Cash Flow:{' '}
              <strong className={monthlyCashFlow >= 0 ? 'text-brand-lightGreen font-mono' : 'text-danger font-mono'}>
                {monthlyCashFlow >= 0 ? '+' : ''}{formatINR(monthlyCashFlow)}/mo
              </strong>
            </span>
          </div>
        </div>
        <AnimatedNumber
          value={effectiveExpense}
          currency="INR"
          className="text-2xl sm:text-3xl font-extrabold text-danger"
        />
      </div>

      <div className="text-left">
        <h2 className="text-2xl font-bold text-text-primary">Where does your money go each month?</h2>
        <p className="text-xs text-text-secondary mt-1">
          Estimate your aggregate monthly spending or break it down by category.
        </p>
      </div>

      {/* PRIMARY INPUT: EXPENSES SLIDER */}
      <div className="p-6 rounded-card glass-card-raised border border-border space-y-4 shadow-glass">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
            Estimated Monthly Spend
          </label>
          <span className="font-mono text-xl font-extrabold text-brand-lightGreen">
            {formatINR(totalExpenseValue)}
          </span>
        </div>

        <input
          type="range"
          min="0"
          max={maxExpenseSlider}
          step="1000"
          value={totalExpenseValue}
          onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
          className="w-full h-3 bg-surface rounded-lg appearance-none cursor-pointer accent-brand-green"
        />

        <div className="flex justify-between text-[11px] font-mono text-text-tertiary">
          <span>₹0</span>
          <span>{formatINR(maxExpenseSlider / 2, true)} (50%)</span>
          <span>{formatINR(maxExpenseSlider, true)} (100% Inflow)</span>
        </div>

        {/* Text Link: "I don't know my expenses" */}
        <div className="pt-2 text-center border-t border-border/40">
          <button
            type="button"
            onClick={() => setShowItemized(!showItemized)}
            className="inline-flex items-center gap-1.5 text-xs text-brand-lightGreen font-semibold hover:underline"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            {showItemized ? "Hide itemized breakdown" : "I don't know my expenses (Itemize categories)"}
            {showItemized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* SECTION 7: ITEMIZED CATEGORY CHIPS (Every field defaults to ₹0, independent of slider) */}
      {showItemized && (
        <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider block text-left">
              Itemize By Category
            </span>
            <span className="text-[10px] text-text-tertiary">Defaults to ₹0 (independent)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Object.keys(CATEGORIES) as ExpenseCategoryType[]).map((cat) => {
              const config = CATEGORIES[cat];
              const currentAmount = itemizedAmounts[cat] || 0;

              return (
                <div
                  key={cat}
                  className={`p-3.5 rounded-card border transition-all ${
                    currentAmount > 0
                      ? 'glass-card-raised border-brand-green/40 shadow-glass'
                      : 'glass-card border-border/70 hover:border-border'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-full bg-surface">
                        {config.icon}
                      </div>
                      <span className="text-xs font-bold text-text-primary">{config.label}</span>
                    </div>
                  </div>

                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-text-tertiary font-mono text-xs">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={currentAmount === 0 ? '' : currentAmount}
                      onChange={(e) => handleItemizedAmountChange(cat, parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full bg-surface border border-border focus:border-brand-green rounded-full pl-7 pr-3 py-1.5 text-xs font-mono font-bold text-text-primary outline-none"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cash Flow Warning if Negative */}
      {monthlyCashFlow < 0 && (
        <div className="p-3.5 rounded-full bg-danger/10 border border-danger/30 text-xs text-danger flex items-center justify-center gap-2 animate-in fade-in">
          <span>⚠️ Warning: Monthly expenses exceed monthly income. We'll proceed with plan optimization.</span>
        </div>
      )}

      {/* Navigation */}
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
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-brand-green hover:bg-brand-darkGreen text-white font-bold text-xs uppercase tracking-wider shadow-glow-green transition-all"
        >
          Proceed to Assets <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
