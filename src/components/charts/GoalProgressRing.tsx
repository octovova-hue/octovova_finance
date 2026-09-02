import React from 'react';

interface GoalProgressRingProps {
  progressPercent: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  color?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const GoalProgressRing: React.FC<GoalProgressRingProps> = ({
  progressPercent,
  size = 56,
  strokeWidth = 5,
  color = '#10B981',
  icon,
  className = '',
}) => {
  const normalizedPercent = Math.min(Math.max(progressPercent, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (normalizedPercent / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {icon ? (
          <span className="flex items-center justify-center">{icon}</span>
        ) : (
          <span className="text-[11px] font-mono font-bold text-text-primary">
            {Math.round(normalizedPercent)}%
          </span>
        )}
      </div>
    </div>
  );
};
