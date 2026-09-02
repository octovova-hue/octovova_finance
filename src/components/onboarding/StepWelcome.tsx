import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { ArrowRight } from 'lucide-react';

interface StepWelcomeProps {
  onNext: () => void;
}

export const StepWelcome: React.FC<StepWelcomeProps> = ({ onNext }) => {
  const { user, updateUser } = useFinance();
  const [name, setName] = useState(user.name || '');
  const [age, setAge] = useState(user.age ? user.age.toString() : '');
  const [stage, setStage] = useState<'name' | 'age'>('name');
  const [error, setError] = useState<string | null>(null);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      setError('Please enter a valid name (at least 2 characters)');
      return;
    }
    setError(null);
    updateUser({ name: name.trim() });
    setStage('age');
  };

  const handleAgeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 18 || ageNum > 75) {
      setError('Please enter an age between 18 and 75');
      return;
    }
    setError(null);
    updateUser({ name: name.trim(), age: ageNum });
    onNext();
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      {stage === 'name' ? (
        <form onSubmit={handleNameSubmit} className="w-full space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary">
              What should we call you?
            </h1>
            <p className="text-sm text-text-secondary">
              Let's build your personalized financial roadmap.
            </p>
          </div>

          <div className="relative max-w-md mx-auto">
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Rahul Verma"
              className="w-full text-center text-xl sm:text-2xl font-bold bg-surface border-2 border-border focus:border-brand-green rounded-full px-6 py-4 text-text-primary placeholder:text-text-tertiary outline-none transition-all shadow-glass"
            />
            {error && (
              <p className="text-xs text-danger font-medium mt-2 animate-in fade-in">{error}</p>
            )}
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-brand-green hover:bg-brand-darkGreen text-white font-bold text-sm uppercase tracking-wider shadow-glow-green transition-all transform hover:scale-105 active:scale-95"
          >
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      ) : (
        <form onSubmit={handleAgeSubmit} className="w-full space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary">
              Welcome, {name}! What is your age?
            </h1>
            <p className="text-sm text-text-secondary">
              Used to calculate investment horizons and compounding timelines.
            </p>
          </div>

          <div className="relative max-w-xs mx-auto">
            <input
              type="number"
              autoFocus
              min="18"
              max="75"
              value={age}
              onChange={(e) => {
                setAge(e.target.value);
                if (error) setError(null);
              }}
              placeholder="35"
              className="w-full text-center text-3xl sm:text-4xl font-mono font-extrabold bg-surface border-2 border-border focus:border-brand-green rounded-full px-6 py-4 text-brand-lightGreen placeholder:text-text-tertiary outline-none transition-all shadow-glass"
            />
            {error && (
              <p className="text-xs text-danger font-medium mt-2 animate-in fade-in">{error}</p>
            )}
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setStage('name')}
              className="px-6 py-3 rounded-full text-xs text-text-secondary hover:text-text-primary font-medium hover:bg-surface transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-brand-green hover:bg-brand-darkGreen text-white font-bold text-sm uppercase tracking-wider shadow-glow-green transition-all transform hover:scale-105 active:scale-95"
            >
              Proceed to Income <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
