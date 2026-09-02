import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { ArrowRight, ArrowLeft } from 'lucide-react';

interface StepRiskQuizProps {
  onNext: () => void;
  onPrev: () => void;
}

export const StepRiskQuiz: React.FC<StepRiskQuizProps> = ({ onNext, onPrev }) => {
  const { submitRiskQuiz } = useFinance();
  const [currentIdx, setCurrentIdx] = useState<number>(0);

  // Horizon state (years)
  const [horizonYears, setHorizonYears] = useState<number>(7);

  // Helper score 1-5 calculated from years
  const getHorizonScore = (years: number) => {
    if (years <= 1) return 1;
    if (years <= 3) return 2;
    if (years <= 5) return 3;
    if (years <= 10) return 4;
    return 5;
  };

  // SECTION 5: Income stability question has NO option pre-selected by default
  const [stabilityScore, setStabilityScore] = useState<number | null>(null);

  const handleHorizonNext = () => {
    setCurrentIdx(1);
  };

  const handleFinishQuiz = () => {
    if (stabilityScore === null) return;
    const horizonScore = getHorizonScore(horizonYears);
    // Calculated score array (horizon, default moderate baseline, stability)
    const answersArray = [horizonScore, 3, stabilityScore];
    submitRiskQuiz(answersArray);

    // SECTION 6: Result step removed from onboarding — route directly to Goal Setting!
    onNext();
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Progress Dots (2 questions total per Section 5) */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
          Question {currentIdx + 1} of 2
        </span>
        <div className="flex items-center gap-1.5">
          {[0, 1].map((idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentIdx
                  ? 'w-6 bg-brand-green'
                  : idx < currentIdx
                  ? 'w-2 bg-brand-lightGreen'
                  : 'w-2 bg-border'
              }`}
            />
          ))}
        </div>
      </div>

      {/* QUESTION 1: INVESTMENT TIMELINE (Simplified heading, no subtext per Section 5) */}
      {currentIdx === 0 && (
        <div className="space-y-6 text-left">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">
              What is your investment timeline?
            </h2>
          </div>

          <div className="p-6 rounded-card glass-card-raised border border-border space-y-5 shadow-glass">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-text-secondary">Selected Timeline</span>
              <span className="font-mono text-2xl font-extrabold text-brand-lightGreen">
                {horizonYears} {horizonYears === 1 ? 'Year' : 'Years'}
              </span>
            </div>

            {/* Slider with 0 / 5 / 10 marked stops */}
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                value={horizonYears}
                onChange={(e) => {
                  setHorizonYears(parseInt(e.target.value, 10));
                }}
                className="w-full h-3 bg-surface rounded-lg appearance-none cursor-pointer accent-brand-green"
              />

              {/* Stops buttons: 0 / 5 / 10 */}
              <div className="flex justify-between items-center text-xs font-mono text-text-secondary pt-1">
                <button
                  type="button"
                  onClick={() => setHorizonYears(0)}
                  className={`px-3 py-1.5 rounded-full transition-colors ${
                    horizonYears === 0
                      ? 'bg-brand-green text-white font-bold shadow-glow-green'
                      : 'bg-surface hover:bg-surface-hover text-text-tertiary'
                  }`}
                >
                  0 Years (Immediate)
                </button>
                <button
                  type="button"
                  onClick={() => setHorizonYears(5)}
                  className={`px-3 py-1.5 rounded-full transition-colors ${
                    horizonYears === 5
                      ? 'bg-brand-green text-white font-bold shadow-glow-green'
                      : 'bg-surface hover:bg-surface-hover text-text-tertiary'
                  }`}
                >
                  5 Years (Medium)
                </button>
                <button
                  type="button"
                  onClick={() => setHorizonYears(10)}
                  className={`px-3 py-1.5 rounded-full transition-colors ${
                    horizonYears === 10
                      ? 'bg-brand-green text-white font-bold shadow-glow-green'
                      : 'bg-surface hover:bg-surface-hover text-text-tertiary'
                  }`}
                >
                  10 Years (Long-term)
                </button>
              </div>
            </div>

            {/* Customize Edit Field */}
            <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-3 text-xs">
              <span className="text-text-secondary font-medium">Customize exact tenure:</span>
              <div className="relative w-32">
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={horizonYears}
                  onChange={(e) => {
                    setHorizonYears(Math.max(0, parseInt(e.target.value, 10) || 0));
                  }}
                  className="w-full bg-surface border border-border focus:border-brand-green rounded-full px-3 py-1.5 text-center font-mono font-bold text-text-primary outline-none text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onPrev}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-full text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Liabilities
            </button>
            <button
              type="button"
              onClick={handleHorizonNext}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-brand-green hover:bg-brand-darkGreen text-white font-bold text-xs uppercase tracking-wider shadow-glow-green transition-all"
            >
              Next Question <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* QUESTION 2: INCOME STABILITY (No option pre-selected, Next disabled until selected) */}
      {currentIdx === 1 && (
        <div className="space-y-4 text-left">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">
              How would you describe your income stability?
            </h2>
            <p className="text-xs text-text-secondary">
              Cash flow predictability shapes the defensive cushion of your monthly allocations.
            </p>
          </div>

          <div className="space-y-2.5">
            {[
              { label: 'Irregular Income', desc: 'Variable earnings with fluctuating monthly inflows', score: 1 },
              { label: 'Bonus-Based Income', desc: 'Base salary supplemented with performance bonuses', score: 2 },
              { label: 'Freelance / Self-Employed', desc: 'Contract or business earnings based on client projects', score: 3 },
              { label: 'Regular Salary / Fixed Salary', desc: 'Consistent, predictable monthly paycheck', score: 4 },
            ].map((opt) => {
              const isSelected = stabilityScore === opt.score;
              return (
                <button
                  key={opt.score}
                  type="button"
                  onClick={() => setStabilityScore(opt.score)}
                  className={`w-full text-left p-4 rounded-card border transition-all duration-200 flex items-start gap-3.5 ${
                    isSelected
                      ? 'glass-card-raised border-brand-green shadow-glow-green'
                      : 'glass-card border-border hover:border-border/80 hover:bg-surface-hover'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected ? 'border-brand-green bg-brand-green text-white' : 'border-border-subtle bg-surface'
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div>
                    <span className="text-sm font-bold text-text-primary block">{opt.label}</span>
                    <span className="text-xs text-text-secondary mt-0.5 block">{opt.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-3">
            <button
              type="button"
              onClick={() => setCurrentIdx(0)}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-full text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Previous Question
            </button>

            {/* Next is disabled until an option is actively chosen per Section 5 */}
            <button
              type="button"
              onClick={handleFinishQuiz}
              disabled={stabilityScore === null}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-brand-green hover:bg-brand-darkGreen disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider shadow-glow-green transition-all"
            >
              Proceed to Goal Setting <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
