import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { AssetAllocation } from '../../types/finance';

interface AllocationDonutProps {
  allocation: AssetAllocation;
  size?: number;
  innerRadius?: number;
  outerRadius?: number;
  showLegend?: boolean;
  className?: string;
}

const COLORS = {
  equity: '#10B981', // Emerald Green
  debt: '#34D399',   // Mint Green
  cash: '#64748B',   // Slate Gray
};

export const AllocationDonut: React.FC<AllocationDonutProps> = ({
  allocation,
  size = 180,
  innerRadius = 52,
  outerRadius = 75,
  showLegend = true,
  className = '',
}) => {
  const data = [
    { name: 'Equity', value: allocation.equity, color: COLORS.equity },
    { name: 'Debt', value: allocation.debt, color: COLORS.debt },
    { name: 'Cash', value: allocation.cash, color: COLORS.cash },
  ].filter(d => d.value > 0);

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div style={{ width: size, height: size }} className="relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0];
                  return (
                    <div className="rounded-full glass-card-raised px-3.5 py-1.5 text-xs font-semibold shadow-glass border border-border">
                      <span className="text-text-primary">{item.name}: </span>
                      <span className="font-mono text-brand-lightGreen">{item.value}%</span>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] uppercase font-bold text-text-tertiary tracking-wider">Equity</span>
          <span className="text-lg font-mono font-extrabold text-brand-lightGreen">{allocation.equity}%</span>
        </div>
      </div>

      {showLegend && (
        <div className="flex items-center justify-center gap-4 mt-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-brand-green" />
            <span className="text-text-secondary">Equity <strong className="text-text-primary font-mono">{allocation.equity}%</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-brand-mint" />
            <span className="text-text-secondary">Debt <strong className="text-text-primary font-mono">{allocation.debt}%</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-text-secondary" />
            <span className="text-text-secondary">Cash <strong className="text-text-primary font-mono">{allocation.cash}%</strong></span>
          </div>
        </div>
      )}
    </div>
  );
};
