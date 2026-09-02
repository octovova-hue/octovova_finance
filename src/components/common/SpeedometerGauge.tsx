import React, { useEffect, useState } from 'react';
import { RiskCategory } from '../../types/finance';
import { RiskBadge } from './Badge';

interface SpeedometerGaugeProps {
  score: number; // 5 to 25
  category: RiskCategory;
  compact?: boolean;
  className?: string;
  onClickDetail?: () => void;
  label?: string;
}

export const SpeedometerGauge: React.FC<SpeedometerGaugeProps> = ({
  score = 15,
  category = 'Balanced',
  compact = false,
  className = '',
  onClickDetail,
  label = 'Risk Tolerance',
}) => {
  const [needleAngle, setNeedleAngle] = useState<number>(-90);
  const [animatedScore, setAnimatedScore] = useState<number>(0);
  const [fillProgress, setFillProgress] = useState<number>(0);

  // Score range: 5 to 25 (min 0, max 25)
  // Angle range: -90 deg (score 0) to +90 deg (score 25)
  const targetFraction = Math.min(Math.max(score / 25, 0), 1);
  const targetAngle = -90 + targetFraction * 180;

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = compact ? 1000 : 1300;

    const animateNeedle = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);

      // Smooth cubic-out with subtle spring overshoot
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const overshoot = progress < 0.9 ? 1 + Math.sin(progress * Math.PI) * 0.08 : 1;
      const currentProgress = Math.min(progress * overshoot, 1);

      const currentAngle = -90 + (targetAngle - (-90)) * currentProgress;
      const currentScore = Math.round(score * easeOut);

      setNeedleAngle(currentAngle);
      setAnimatedScore(currentScore);
      setFillProgress(easeOut);

      if (progress < 1) {
        requestAnimationFrame(animateNeedle);
      } else {
        setNeedleAngle(targetAngle);
        setAnimatedScore(score);
        setFillProgress(1);
      }
    };

    const timer = setTimeout(() => {
      requestAnimationFrame(animateNeedle);
    }, 100);

    return () => clearTimeout(timer);
  }, [score, targetAngle, compact]);

  const width = compact ? 220 : 290;
  const height = compact ? 125 : 165;
  const radius = compact ? 82 : 110;
  const strokeWidth = compact ? 14 : 18;

  // Arc path generator
  const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x: number, y: number, r: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, r, endAngle);
    const end = polarToCartesian(x, y, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return ['M', start.x, start.y, 'A', r, r, 0, largeArcFlag, 0, end.x, end.y].join(' ');
  };

  const cx = width / 2;
  const cy = height - 12;

  // Current active progress arc end angle
  const activeEndAngle = -90 + fillProgress * targetFraction * 180;

  return (
    <div
      onClick={onClickDetail}
      className={`flex flex-col items-center justify-center text-center select-none ${
        onClickDetail ? 'cursor-pointer group' : ''
      } ${className}`}
    >
      <div className="relative" style={{ width, height }}>
        <svg width={width} height={height} className="overflow-visible">
          <defs>
            {/* Linear gradient for background track */}
            <linearGradient id="trackGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
              <stop offset="35%" stopColor="#10B981" stopOpacity="0.9" />
              <stop offset="70%" stopColor="#F59E0B" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#EF4444" stopOpacity="0.9" />
            </linearGradient>

            {/* Glowing active arc gradient */}
            <linearGradient id="activeArcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="50%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#34D399" />
            </linearGradient>

            {/* Needle Gradient */}
            <linearGradient id="needleGradient" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#0B1510" />
              <stop offset="70%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#6EE7B7" />
            </linearGradient>

            {/* Subtle glow filter */}
            <filter id="gaugeDropShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#10B981" floodOpacity="0.35" />
            </filter>
          </defs>

          {/* 1. Inactive Background Full Track */}
          <path
            d={describeArc(cx, cy, radius, -90, 90)}
            fill="none"
            stroke="rgba(255, 255, 255, 0.07)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* 2. Color Gradient Track Base */}
          <path
            d={describeArc(cx, cy, radius, -90, 90)}
            fill="none"
            stroke="url(#trackGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeOpacity="0.25"
          />

          {/* 3. Animated Filled Arc up to active score */}
          {activeEndAngle > -90 && (
            <path
              d={describeArc(cx, cy, radius, -90, activeEndAngle)}
              fill="none"
              stroke="url(#trackGradient)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              filter="url(#gaugeDropShadow)"
            />
          )}

          {/* 4. Subtle Tick lines */}
          {[-90, -45, 0, 45, 90].map((deg, i) => {
            const inner = polarToCartesian(cx, cy, radius - strokeWidth / 2 - 3, deg);
            const outer = polarToCartesian(cx, cy, radius + strokeWidth / 2 + 3, deg);
            return (
              <line
                key={i}
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke="rgba(11, 21, 16, 0.9)"
                strokeWidth={2.5}
              />
            );
          })}

          {/* 5. Sleek Needle */}
          <g
            transform={`rotate(${needleAngle}, ${cx}, ${cy})`}
            className="transition-transform duration-75 ease-out"
          >
            {/* Needle Triangle Blade */}
            <polygon
              points={`
                ${cx - (compact ? 3 : 4)},${cy} 
                ${cx + (compact ? 3 : 4)},${cy} 
                ${cx},${cy - radius + (compact ? 4 : 6)}
              `}
              fill="url(#needleGradient)"
              filter="drop-shadow(0 0 6px rgba(16, 185, 129, 0.6))"
            />
            {/* Needle Tip Glowing Dot */}
            <circle
              cx={cx}
              cy={cy - radius + (compact ? 4 : 6)}
              r={compact ? 2 : 2.5}
              fill="#FFFFFF"
            />
          </g>

          {/* 6. Center Hub Assembly */}
          <circle cx={cx} cy={cy} r={compact ? 10 : 13} fill="#080E0B" stroke="#10B981" strokeWidth={2.5} />
          <circle cx={cx} cy={cy} r={compact ? 4 : 5.5} fill="#10B981" />
        </svg>
      </div>

      {/* Modern Score & Category Readout */}
      <div className="mt-1.5 flex flex-col items-center gap-1">
        <RiskBadge category={category} size={compact ? 'sm' : 'md'} />
        <div className="flex items-center gap-1.5 text-xs text-text-tertiary font-mono">
          <span className="text-[11px] uppercase tracking-wider text-text-secondary font-semibold">Score:</span>
          <span className="text-sm sm:text-base font-extrabold text-brand-lightGreen leading-none">{animatedScore}</span>
          <span className="text-[11px] text-text-tertiary">/ 25</span>
        </div>
      </div>
    </div>
  );
};
