import React, { useEffect, useState } from 'react';
import { RiskCategory } from '../../types/finance';
import { RiskBadge } from './Badge';

interface SpeedometerGaugeProps {
  score: number; // 5 to 25
  category: RiskCategory;
  compact?: boolean;
  className?: string;
  onClickDetail?: () => void;
}

export const SpeedometerGauge: React.FC<SpeedometerGaugeProps> = ({
  score = 17,
  category = 'Balanced',
  compact = false,
  className = '',
  onClickDetail,
}) => {
  const [needleAngle, setNeedleAngle] = useState<number>(-90); // starts at -90deg (0 score)
  const [animatedScore, setAnimatedScore] = useState<number>(0);

  // Score range: 5 to 25 (min 0, max 25)
  // Angle range: -90 deg (score 0) to +90 deg (score 25)
  const targetFraction = Math.min(Math.max(score / 25, 0), 1);
  const targetAngle = -90 + targetFraction * 180;

  useEffect(() => {
    // Spring / Overshoot animation
    let startTimestamp: number | null = null;
    const duration = compact ? 1000 : 1400;

    const animateNeedle = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);

      // Overshoot spring easing
      const overshoot = 1 + Math.sin(progress * Math.PI) * 0.12 * (1 - progress);
      const currentProgress = progress >= 1 ? 1 : progress * overshoot;

      const currentAngle = -90 + (targetAngle - (-90)) * currentProgress;
      const currentScore = Math.round(score * Math.min(progress, 1));

      setNeedleAngle(currentAngle);
      setAnimatedScore(currentScore);

      if (progress < 1) {
        requestAnimationFrame(animateNeedle);
      } else {
        setNeedleAngle(targetAngle);
        setAnimatedScore(score);
      }
    };

    const timer = setTimeout(() => {
      requestAnimationFrame(animateNeedle);
    }, 150);

    return () => clearTimeout(timer);
  }, [score, targetAngle, compact]);

  const width = compact ? 220 : 300;
  const height = compact ? 130 : 175;
  const radius = compact ? 85 : 115;
  const strokeWidth = compact ? 14 : 20;

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
  const cy = height - 15;

  // 5 Color segments across 180 degrees
  const segments = [
    { name: 'Conservative', color: '#64748B', startAngle: -90, endAngle: -54 },
    { name: 'Moderate', color: '#FBBF24', startAngle: -54, endAngle: -18 },
    { name: 'Balanced', color: '#10B981', startAngle: -18, endAngle: 18 },
    { name: 'Growth', color: '#34D399', startAngle: 18, endAngle: 54 },
    { name: 'Aggressive', color: '#F87171', startAngle: 54, endAngle: 90 },
  ];

  return (
    <div
      onClick={onClickDetail}
      className={`flex flex-col items-center justify-center text-center ${
        onClickDetail ? 'cursor-pointer group' : ''
      } ${className}`}
    >
      <div className="relative" style={{ width, height }}>
        <svg width={width} height={height} className="overflow-visible">
          <defs>
            <filter id="gaugeGlowGreen" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <linearGradient id="needleGradientGreen" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>

          {/* Background track */}
          <path
            d={describeArc(cx, cy, radius, -90, 90)}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Segment Arcs */}
          {segments.map((seg, idx) => (
            <path
              key={idx}
              d={describeArc(cx, cy, radius, seg.startAngle + 1, seg.endAngle - 1)}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeOpacity={category === seg.name ? 1 : 0.45}
              filter={category === seg.name ? 'url(#gaugeGlowGreen)' : undefined}
              className="transition-all duration-300"
            />
          ))}

          {/* Tick markers */}
          {[-90, -54, -18, 18, 54, 90].map((deg, i) => {
            const inner = polarToCartesian(cx, cy, radius - strokeWidth / 2 - 4, deg);
            const outer = polarToCartesian(cx, cy, radius + strokeWidth / 2 + 4, deg);
            return (
              <line
                key={i}
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke="#080E0B"
                strokeWidth={2}
              />
            );
          })}

          {/* Center Hub */}
          <circle cx={cx} cy={cy} r={compact ? 8 : 11} fill="#080E0B" stroke="#10B981" strokeWidth={3} />
          <circle cx={cx} cy={cy} r={compact ? 3 : 5} fill="#10B981" />

          {/* Rotating Needle */}
          <g
            transform={`rotate(${needleAngle}, ${cx}, ${cy})`}
            className="transition-transform duration-75 ease-out"
          >
            {/* Needle Triangle */}
            <polygon
              points={`${cx - (compact ? 3 : 4)},${cy} ${cx + (compact ? 3 : 4)},${cy} ${cx},${cy - radius + (compact ? 6 : 8)}`}
              fill="url(#needleGradientGreen)"
              filter="drop-shadow(0 0 6px rgba(16, 185, 129, 0.8))"
            />
          </g>
        </svg>
      </div>

      {/* Label & Score Display below Gauge */}
      <div className="mt-1 space-y-1">
        <div className="flex items-center justify-center gap-2">
          <RiskBadge category={category} size={compact ? 'sm' : 'lg'} />
        </div>
        <div className="font-mono text-xs text-text-tertiary">
          Risk Score: <strong className="text-text-primary font-bold text-sm">{animatedScore}</strong> / 25
        </div>
      </div>
    </div>
  );
};
