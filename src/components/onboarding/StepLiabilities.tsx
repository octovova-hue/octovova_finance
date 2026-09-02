import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { LiabilityItem, LiabilityType } from '../../types/finance';
import {
  HouseColoredIcon,
  CreditCardColoredIcon,
  CarColoredIcon,
  GraduationCapColoredIcon,
  BankLoanColoredIcon,
  CheckmarkColoredIcon,
} from '../common/ColoredIcon';
import { ArrowRight, ArrowLeft, Plus, Trash2 } from 'lucide-react';

interface StepLiabilitiesProps {
  onNext: () => void;
  onPrev: () => void;
}

const DEFAULT_INTEREST_RATES: Record<LiabilityType, number> = {
  'Home Loan': 8.5,
  'Personal Loan': 12.0,
  'Car Loan': 9.0,
  'Credit Card': 36.0,
  'Education Loan': 10.0,
  'EMI': 11.0,
  'Other': 11.0,
};

const LIABILITY_ICONS: Record<LiabilityType, React.ReactNode> = {
  'Home Loan': <HouseColoredIcon className="w-5 h-5" />,
  'Personal Loan': <CreditCardColoredIcon className="w-5 h-5" />,
  'Car Loan': <CarColoredIcon className="w-5 h-5" />,
  'Credit Card': <CreditCardColoredIcon className="w-5 h-5" />,
  'Education Loan': <GraduationCapColoredIcon className="w-5 h-5" />,
  'EMI': <BankLoanColoredIcon className="w-5 h-5" />,
  'Other': <CheckmarkColoredIcon className="w-5 h-5" />,
};

export const StepLiabilities: React.FC<StepLiabilitiesProps> = ({ onNext, onPrev }) => {
  const { user, updateUser } = useFinance();
  const [liabilities, setLiabilities] = useState<LiabilityItem[]>(
    user.liabilities.length > 0 && user.liabilities.some(l => (l.outstandingAmount || 0) > 0)
      ? user.liabilities
      : [
          { id: 'lia_1', type: 'Personal Loan', outstandingAmount: 0, interestRate: 11.5 },
        ]
  );

  const handleAddLiability = () => {
    setLiabilities(prev => [
      ...prev,
      {
        id: `lia_${Date.now()}`,
        type: 'Credit Card',
        outstandingAmount: 0,
        interestRate: DEFAULT_INTEREST_RATES['Credit Card'],
      },
    ]);
  };

  const handleRemove = (id: string) => {
    setLiabilities(prev => prev.filter(item => item.id !== id));
  };

  const handleTypeChange = (id: string, type: LiabilityType) => {
    setLiabilities(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, type, interestRate: DEFAULT_INTEREST_RATES[type] }
          : item
      )
    );
  };

  const handleUpdate = (id: string, field: 'outstandingAmount' | 'interestRate', value: number) => {
    setLiabilities(prev =>
      prev.map(item => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleContinue = () => {
    updateUser({ liabilities });
    onNext();
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* SECTION 8: Removed 'Total Outstanding Debts' card */}
      <div className="text-left pt-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">Do you have any loans or liabilities?</h2>
        <p className="text-xs text-text-secondary mt-1">
          Home loans, personal loans, vehicle loans, or credit card balances. (You can remove all if debt-free)
        </p>
      </div>

      {/* Liabilities List */}
      <div className="space-y-3">
        {liabilities.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-card glass-card-raised border border-border flex flex-col sm:flex-row items-center gap-3 transition-all hover:border-border"
          >
            <div className="flex items-center gap-2.5 w-full sm:w-1/3">
              {LIABILITY_ICONS[item.type]}
              <select
                value={item.type}
                onChange={(e) => handleTypeChange(item.id, e.target.value as LiabilityType)}
                className="w-full bg-surface border border-border rounded-full px-3 py-2 text-xs font-semibold text-text-primary focus:border-brand-green outline-none"
              >
                <option value="Home Loan">Home Loan</option>
                <option value="Personal Loan">Personal Loan</option>
                <option value="Car Loan">Car Loan</option>
                <option value="Credit Card">Credit Card Debt</option>
                <option value="Education Loan">Education Loan</option>
                <option value="EMI">Recurring EMI</option>
                <option value="Other">Other Debt</option>
              </select>
            </div>

            <div className="relative w-full sm:w-2/3 flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary font-mono text-xs">₹</span>
                <input
                  type="number"
                  min="0"
                  value={item.outstandingAmount === 0 ? '' : item.outstandingAmount}
                  onChange={(e) => handleUpdate(item.id, 'outstandingAmount', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full bg-surface border border-border focus:border-brand-green rounded-full pl-8 pr-4 py-2 text-xs font-mono font-bold text-text-primary outline-none"
                />
              </div>

              {/* Interest rate input */}
              <div className="w-20 relative flex items-center">
                <input
                  type="number"
                  step="0.5"
                  value={item.interestRate || ''}
                  onChange={(e) => handleUpdate(item.id, 'interestRate', parseFloat(e.target.value) || 0)}
                  className="w-full bg-surface border border-danger/40 text-danger rounded-full px-2 py-2 text-xs font-mono font-bold text-center outline-none"
                />
                <span className="text-[10px] text-text-tertiary ml-1">%</span>
              </div>

              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                className="p-2 text-text-tertiary hover:text-danger rounded-full hover:bg-surface transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={handleAddLiability}
          className="w-full py-3.5 rounded-full border-2 border-dashed border-border hover:border-brand-green text-xs font-bold text-text-secondary hover:text-brand-lightGreen flex items-center justify-center gap-2 transition-all bg-surface/40 hover:bg-surface"
        >
          <Plus className="w-4 h-4" /> Add Another Loan / Liability
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
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-brand-green hover:bg-brand-darkGreen text-white font-bold text-xs uppercase tracking-wider shadow-glow-green transition-all"
        >
          Proceed to Risk Quiz <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
