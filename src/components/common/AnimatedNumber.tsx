import React, { useEffect, useState } from 'react';
import { formatINR, formatNumber } from '../../lib/formatters';

interface AnimatedNumberProps {
  value: number;
  currency?: 'INR' | 'none';
  compact?: boolean;
  durationMs?: number;
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  currency = 'INR',
  compact = false,
  durationMs = 600,
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState<number>(value);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = displayValue;
    const endValue = value;

    if (startValue === endValue) return;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / durationMs, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (endValue - startValue) * easeProgress;
      
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setDisplayValue(endValue);
      }
    };

    const animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [value, durationMs]);

  const formatted = currency === 'INR'
    ? formatINR(displayValue, compact)
    : formatNumber(displayValue);

  return (
    <span className={`font-mono font-bold tracking-tight ${className}`}>
      {formatted}
    </span>
  );
};
