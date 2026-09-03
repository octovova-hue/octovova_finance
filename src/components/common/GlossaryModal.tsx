import React, { useState, useMemo } from 'react';
import { ModalPortal } from './ModalPortal';
import {
  Search, Wallet, TrendingUp, ShieldAlert, PiggyBank, Percent,
  Gauge, PieChart, LineChart, Activity, Target, CalendarClock,
  Landmark, Coins, X,
} from 'lucide-react';

interface GlossaryTerm {
  term: string;
  definition: string;
  category: 'money' | 'investing' | 'risk' | 'probability';
  icon: React.ReactNode;
}

const CATEGORY_META: Record<GlossaryTerm['category'], { label: string; color: string }> = {
  money: { label: 'Your Money', color: 'text-brand-lightGreen bg-brand-green/15 border-brand-green/30' },
  investing: { label: 'Investing', color: 'text-sky-300 bg-sky-400/15 border-sky-400/30' },
  risk: { label: 'Risk & Mix', color: 'text-orange-300 bg-orange-400/15 border-orange-400/30' },
  probability: { label: 'Probability', color: 'text-violet-300 bg-violet-400/15 border-violet-400/30' },
};

const TERMS: GlossaryTerm[] = [
  { term: 'Net Worth', definition: 'Everything you own, minus everything you owe.', category: 'money', icon: <Wallet className="w-4 h-4" /> },
  { term: 'Cash Flow', definition: "What's left over each month after expenses.", category: 'money', icon: <TrendingUp className="w-4 h-4" /> },
  { term: 'Emergency Fund', definition: '6 months of expenses, kept safe for surprises.', category: 'money', icon: <ShieldAlert className="w-4 h-4" /> },
  { term: 'Liquid Cushion', definition: 'Money you can get to quickly if you need it fast.', category: 'money', icon: <PiggyBank className="w-4 h-4" /> },
  { term: 'SIP', definition: 'A fixed amount you invest every month, instead of all at once.', category: 'investing', icon: <CalendarClock className="w-4 h-4" /> },
  { term: 'CAGR', definition: 'The average yearly growth rate of an investment, smoothed out.', category: 'investing', icon: <Percent className="w-4 h-4" /> },
  { term: 'Compound Growth', definition: 'Your returns start earning their own returns over time.', category: 'investing', icon: <LineChart className="w-4 h-4" /> },
  { term: 'Retirement Corpus', definition: 'The total savings you need to support yourself after retiring.', category: 'investing', icon: <Landmark className="w-4 h-4" /> },
  { term: 'Risk Score', definition: 'A 5–25 score from 5 quick questions about your comfort with risk.', category: 'risk', icon: <Gauge className="w-4 h-4" /> },
  { term: 'Asset Allocation', definition: 'How your money is split between stocks, bonds, and cash.', category: 'risk', icon: <PieChart className="w-4 h-4" /> },
  { term: 'Equity', definition: 'The stock portion of a plan — higher growth, more ups and downs.', category: 'risk', icon: <TrendingUp className="w-4 h-4" /> },
  { term: 'Volatility', definition: 'How much an investment value swings up and down over time.', category: 'risk', icon: <Activity className="w-4 h-4" /> },
  { term: 'Inflation-Adjusted', definition: 'Adjusted for the fact that prices rise over time.', category: 'probability', icon: <Coins className="w-4 h-4" /> },
  { term: 'Monte Carlo Simulation', definition: 'Testing your plan against 10,000 possible market futures.', category: 'probability', icon: <Activity className="w-4 h-4" /> },
  { term: 'Goal Success Probability', definition: 'The % of simulated futures where you actually hit your goal.', category: 'probability', icon: <Target className="w-4 h-4" /> },
];

const CATEGORY_ORDER: (GlossaryTerm['category'] | 'all')[] = ['all', 'money', 'investing', 'risk', 'probability'];

interface GlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlossaryModal: React.FC<GlossaryModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<(typeof CATEGORY_ORDER)[number]>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TERMS.filter((t) => {
      const matchesCategory = activeCategory === 'all' || t.category === activeCategory;
      const matchesQuery = !q || t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, activeCategory]);

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose} ariaLabel="Finance Glossary">
      <div className="w-full max-w-2xl max-h-[85vh] dash-card-dark rounded-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-border shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-text-primary tracking-tight">Quick Glossary</h2>
              <p className="text-xs text-text-secondary mt-0.5">
                The finance words used in this app, explained in one line each.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-text-tertiary hover:text-text-primary rounded-lg hover:bg-surface transition-colors shrink-0"
              aria-label="Close glossary"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mt-4">
            <Search className="w-4 h-4 text-text-tertiary absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a term..."
              className="w-full h-10 pl-10 pr-4 rounded-full bg-surface-dark border border-border focus:border-brand-green/50 text-sm text-text-primary placeholder:text-text-tertiary outline-none transition-all"
            />
          </div>

          {/* Category pills */}
          <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-0.5">
            {CATEGORY_ORDER.map((cat) => {
              const isActive = activeCategory === cat;
              const label = cat === 'all' ? 'All' : CATEGORY_META[cat].label;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide transition-all border ${
                    isActive
                      ? 'bg-gradient-green text-white border-transparent shadow-glow-green'
                      : 'text-text-secondary border-border hover:border-brand-green/30 hover:text-text-primary'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Term list */}
        <div className="overflow-y-auto p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.length === 0 ? (
            <div className="col-span-full text-center py-10 text-sm text-text-tertiary">
              No terms match "{query}"
            </div>
          ) : (
            filtered.map((t, i) => {
              const meta = CATEGORY_META[t.category];
              return (
                <div
                  key={t.term}
                  className="p-3.5 rounded-xl bg-surface border border-border hover:border-brand-green/30 transition-colors animate-in fade-in"
                  style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${meta.color}`}>
                      {t.icon}
                    </div>
                    <span className="text-sm font-bold text-text-primary">{t.term}</span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed pl-9">{t.definition}</p>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border text-center shrink-0">
          <span className="text-[11px] text-text-tertiary">
            Showing {filtered.length} of {TERMS.length} terms
          </span>
        </div>
      </div>
    </ModalPortal>
  );
};
