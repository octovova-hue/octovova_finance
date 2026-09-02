import React, { useEffect, useState } from 'react';
import {
  RobotAdvisorColoredIcon,
  CheckmarkColoredIcon,
  PlansNavColoredIcon,
  StocksGrowthColoredIcon,
} from '../common/ColoredIcon';
import confetti from 'canvas-confetti';

import { OctovovaLogo } from '../common/OctovovaLogo';

interface StepProcessingProps {
  onComplete: () => void;
}

const PHASES = [
  { text: 'Auditing monthly cash flow & liquidity buffers...', icon: <StocksGrowthColoredIcon className="w-5 h-5" /> },
  { text: 'Applying risk category & asset allocation matrices...', icon: <PlansNavColoredIcon className="w-5 h-5" /> },
  { text: 'Computing your personalized wealth plans...', icon: <RobotAdvisorColoredIcon className="w-5 h-5" /> },
];

export const StepProcessing: React.FC<StepProcessingProps> = ({ onComplete }) => {
  const [currentPhase, setCurrentPhase] = useState<number>(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setCurrentPhase(1), 700);
    const timer2 = setTimeout(() => setCurrentPhase(2), 1400);
    const timer3 = setTimeout(() => {
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.6 },
      });
      onComplete();
    }, 2200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center px-4 space-y-8 animate-in fade-in">
      {/* Animated Core Logo */}
      <div className="relative flex items-center justify-center">
        <div className="w-24 h-24 rounded-full bg-brand-green/20 border-2 border-brand-green animate-ping absolute inset-0 opacity-40" />
        <div className="relative z-10">
          <OctovovaLogo size="xl" />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-extrabold text-text-primary tracking-tight">
          Generating Your Tailored Blueprint
        </h2>
        <p className="text-xs text-text-secondary">
          Running wealth architecture calculations across your profile.
        </p>
      </div>

      {/* Phase List */}
      <div className="w-full space-y-3 text-left">
        {PHASES.map((phase, idx) => {
          const isDone = idx < currentPhase;
          const isCurrent = idx === currentPhase;

          return (
            <div
              key={idx}
              className={`p-3.5 rounded-card border transition-all duration-300 flex items-center gap-3 ${
                isCurrent
                  ? 'glass-card-raised border-brand-green shadow-glow-green'
                  : isDone
                  ? 'glass-card border-brand-green/40 text-text-secondary'
                  : 'glass-card border-border/40 text-text-tertiary opacity-40'
              }`}
            >
              {isDone ? (
                <CheckmarkColoredIcon className="w-5 h-5 shrink-0 animate-in zoom-in" />
              ) : isCurrent ? (
                <div className="p-1 rounded-full bg-surface shrink-0">
                  {phase.icon}
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full border border-border shrink-0" />
              )}
              <span className="text-xs font-semibold text-text-primary">
                {phase.text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
