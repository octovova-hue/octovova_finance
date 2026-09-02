import React from 'react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

interface CashFlowSparklineProps {
  cashFlow: number;
  months?: number;
  height?: number;
  className?: string;
}

export const CashFlowSparkline: React.FC<CashFlowSparklineProps> = ({
  cashFlow,
  months = 12,
  height = 40,
  className = '',
}) => {
  // Generate a realistic 12-month trajectory
  const isPositive = cashFlow >= 0;
  const base = Math.max(cashFlow, 0);
  
  const data = Array.from({ length: months }, (_, i) => {
    // Subtle monthly seasonal variance
    const variance = (Math.sin(i * 0.8) * 0.08) + 1;
    return {
      month: i + 1,
      value: Math.round(base * variance),
    };
  });

  const strokeColor = isPositive ? '#00D9A3' : '#FF5C7A';
  const fillColor = isPositive ? 'url(#sparkline-gain)' : 'url(#sparkline-danger)';

  return (
    <div className={`w-full h-[${height}px] ${className}`}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="sparkline-gain" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00D9A3" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#00D9A3" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="sparkline-danger" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF5C7A" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#FF5C7A" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={2}
            fillOpacity={1}
            fill={fillColor}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
