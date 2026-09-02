import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { AssetItem, AssetType } from '../../types/finance';
import { AnimatedNumber } from '../common/AnimatedNumber';
import {
  WalletColoredIcon,
  PiggyBankColoredIcon,
  StocksGrowthColoredIcon,
  RealEstateColoredIcon,
  GoldBullionColoredIcon,
  CheckmarkColoredIcon,
} from '../common/ColoredIcon';
import { ArrowRight, ArrowLeft, Plus, Trash2 } from 'lucide-react';

interface StepAssetsProps {
  onNext: () => void;
  onPrev: () => void;
}

const ASSET_ICONS: Record<AssetType, React.ReactNode> = {
  'Cash': <WalletColoredIcon className="w-5 h-5" />,
  'Fixed Deposit': <PiggyBankColoredIcon className="w-5 h-5" />,
  'Mutual Funds': <StocksGrowthColoredIcon className="w-5 h-5" />,
  'Stocks': <StocksGrowthColoredIcon className="w-5 h-5" />,
  'Real Estate': <RealEstateColoredIcon className="w-5 h-5" />,
  'Gold': <GoldBullionColoredIcon className="w-5 h-5" />,
  'Other': <CheckmarkColoredIcon className="w-5 h-5" />,
};

export const StepAssets: React.FC<StepAssetsProps> = ({ onNext, onPrev }) => {
  const { user, updateUser } = useFinance();
  const [assets, setAssets] = useState<AssetItem[]>(
    user.assets.length > 0 && user.assets.some(a => (a.currentValue || 0) > 0)
      ? user.assets
      : [
          { id: 'ast_1', type: 'Mutual Funds', currentValue: 0 },
        ]
  );

  const totalAssets = assets.reduce((sum, item) => sum + (item.currentValue || 0), 0);
  const totalLiabilities = user.liabilities.reduce((sum, item) => sum + (item.outstandingAmount || 0), 0);
  const estimatedNetWorth = totalAssets - totalLiabilities;

  const handleAddAsset = () => {
    setAssets(prev => [
      ...prev,
      { id: `ast_${Date.now()}`, type: 'Mutual Funds', currentValue: 0 },
    ]);
  };

  const handleRemove = (id: string) => {
    setAssets(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdate = (id: string, field: 'type' | 'currentValue', value: any) => {
    setAssets(prev =>
      prev.map(item => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleContinue = () => {
    updateUser({ assets });
    onNext();
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Running Total & Net Worth Preview */}
      <div className="rounded-card glass-card p-5 border border-border flex items-center justify-between shadow-glass">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-surface">
            <StocksGrowthColoredIcon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs uppercase font-bold text-text-secondary tracking-wider block">
              Total Accumulated Assets
            </span>
            <span className="text-xs text-text-tertiary">
              Live Net Worth: <strong className="text-brand-lightGreen font-mono">
                ₹{estimatedNetWorth.toLocaleString('en-IN')}
              </strong>
            </span>
          </div>
        </div>
        <AnimatedNumber
          value={totalAssets}
          currency="INR"
          className="text-2xl sm:text-3xl font-extrabold text-brand-lightGreen"
        />
      </div>

      <div className="text-left">
        <h2 className="text-2xl font-bold text-text-primary">What assets do you hold today?</h2>
        <p className="text-xs text-text-secondary mt-1">
          Cash reserves, mutual funds, equity portfolios, property, or fixed deposits.
        </p>
      </div>

      {/* Asset Items List */}
      <div className="space-y-3">
        {assets.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-card glass-card-raised border border-border flex flex-col sm:flex-row items-center gap-3 transition-all hover:border-border"
          >
            <div className="flex items-center gap-2.5 w-full sm:w-1/2">
              {ASSET_ICONS[item.type]}
              <select
                value={item.type}
                onChange={(e) => handleUpdate(item.id, 'type', e.target.value as AssetType)}
                className="w-full bg-surface border border-border rounded-full px-3 py-2 text-xs font-semibold text-text-primary focus:border-brand-green outline-none"
              >
                <option value="Cash">Cash / Savings</option>
                <option value="Fixed Deposit">Fixed Deposit (FD)</option>
                <option value="Mutual Funds">Mutual Funds</option>
                <option value="Stocks">Direct Stocks</option>
                <option value="Real Estate">Real Estate / Land</option>
                <option value="Gold">Gold / Sovereign Gold</option>
                <option value="Other">Other Assets</option>
              </select>
            </div>

            <div className="relative w-full sm:w-1/2 flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary font-mono text-sm">₹</span>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={item.currentValue === 0 ? '' : item.currentValue}
                  onChange={(e) => handleUpdate(item.id, 'currentValue', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full bg-surface border border-border focus:border-brand-green rounded-full pl-9 pr-4 py-2 text-sm font-mono font-bold text-text-primary outline-none"
                />
              </div>

              {assets.length > 1 && (
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
          onClick={handleAddAsset}
          className="w-full py-3.5 rounded-full border-2 border-dashed border-border hover:border-brand-green text-xs font-bold text-text-secondary hover:text-brand-lightGreen flex items-center justify-center gap-2 transition-all bg-surface/40 hover:bg-surface"
        >
          <Plus className="w-4 h-4" /> Add Another Asset
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
          Proceed to Liabilities <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
