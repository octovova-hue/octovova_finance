import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { IncomeItem, IncomeSourceType } from '../../types/finance';
import { AnimatedNumber } from '../common/AnimatedNumber';
import {
  SalaryBriefcaseColoredIcon,
  RealEstateColoredIcon,
  WalletColoredIcon,
  StocksGrowthColoredIcon,
} from '../common/ColoredIcon';
import { ArrowRight, ArrowLeft, Plus, Trash2 } from 'lucide-react';

interface StepIncomeProps {
  onNext: () => void;
  onPrev: () => void;
}

const SOURCE_ICONS: Record<IncomeSourceType, React.ReactNode> = {
  Salary: <SalaryBriefcaseColoredIcon className="w-5 h-5" />,
  Business: <RealEstateColoredIcon className="w-5 h-5" />,
  Rental: <RealEstateColoredIcon className="w-5 h-5" />,
  Freelance: <StocksGrowthColoredIcon className="w-5 h-5" />,
  Other: <WalletColoredIcon className="w-5 h-5" />,
};

export const StepIncome: React.FC<StepIncomeProps> = ({ onNext, onPrev }) => {
  const { user, updateUser } = useFinance();
  const [incomes, setIncomes] = useState<IncomeItem[]>(
    user.income.length > 0 
      ? user.income 
      : [{ id: 'inc_1', source: 'Salary', monthlyAmount: 150000 }]
  );

  const totalMonthlyIncome = incomes.reduce((sum, item) => sum + (item.monthlyAmount || 0), 0);

  const handleAddSource = () => {
    setIncomes(prev => [
      ...prev,
      { id: `inc_${Date.now()}`, source: 'Business', monthlyAmount: 25000 },
    ]);
  };

  const handleRemove = (id: string) => {
    setIncomes(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdate = (id: string, field: 'source' | 'monthlyAmount', value: any) => {
    setIncomes(prev =>
      prev.map(item => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleContinue = () => {
    updateUser({ income: incomes });
    onNext();
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Running Total Pinned Banner (Section 3: 'Real-time aggregated earnings' removed) */}
      <div className="rounded-card glass-card p-5 border border-border flex items-center justify-between shadow-glass">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-surface">
            <WalletColoredIcon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs uppercase font-bold text-text-secondary tracking-wider block">
              Total Monthly Inflow
            </span>
          </div>
        </div>
        <AnimatedNumber
          value={totalMonthlyIncome}
          currency="INR"
          className="text-2xl sm:text-3xl font-extrabold text-brand-lightGreen"
        />
      </div>

      <div className="text-left">
        <h2 className="text-2xl font-bold text-text-primary">Where does your income flow from?</h2>
        <p className="text-xs text-text-secondary mt-1">
          Add all active monthly earnings (Salary, Consulting, Rentals, etc.)
        </p>
      </div>

      {/* Income List */}
      <div className="space-y-3">
        {incomes.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-card glass-card-raised border border-border flex flex-col sm:flex-row items-center gap-3 transition-all hover:border-border"
          >
            <div className="flex items-center gap-2.5 w-full sm:w-1/3">
              {SOURCE_ICONS[item.source]}
              <select
                value={item.source}
                onChange={(e) => handleUpdate(item.id, 'source', e.target.value as IncomeSourceType)}
                className="w-full bg-surface border border-border rounded-full px-3 py-2 text-xs font-semibold text-text-primary focus:border-brand-green outline-none"
              >
                <option value="Salary">Salary</option>
                <option value="Business">Business</option>
                <option value="Rental">Rental</option>
                <option value="Freelance">Freelance</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="relative w-full sm:w-2/3 flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary font-mono text-sm">₹</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={item.monthlyAmount || ''}
                  onChange={(e) => handleUpdate(item.id, 'monthlyAmount', parseFloat(e.target.value) || 0)}
                  placeholder="Monthly amount"
                  className="w-full bg-surface border border-border focus:border-brand-green rounded-full pl-9 pr-4 py-2 text-sm font-mono font-bold text-text-primary outline-none"
                />
              </div>

              {incomes.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  className="p-2 text-text-tertiary hover:text-danger rounded-full hover:bg-surface transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={handleAddSource}
          className="w-full py-3.5 rounded-full border-2 border-dashed border-border hover:border-brand-green text-xs font-bold text-text-secondary hover:text-brand-lightGreen flex items-center justify-center gap-2 transition-all bg-surface/40 hover:bg-surface"
        >
          <Plus className="w-4 h-4" /> Add Another Income Stream
        </button>
      </div>

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
          disabled={totalMonthlyIncome <= 0}
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-brand-green hover:bg-brand-darkGreen disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider shadow-glow-green transition-all"
        >
          Proceed to Expenses <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
