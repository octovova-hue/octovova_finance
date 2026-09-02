import React from 'react';
import { AnimatedNumber } from './AnimatedNumber';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: number;
  currency?: 'INR' | 'none';
  compact?: boolean;
  icon?: LucideIcon;
  subtitle?: string;
  badge?: React.ReactNode;
  trend?: {
    label: string;
    isPositive?: boolean;
  };
  variant?: 'default' | 'green' | 'mint' | 'danger';
  className?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  currency = 'INR',
  compact = false,
  icon: Icon,
  subtitle,
  badge,
  trend,
  variant = 'default',
  className = '',
}) => {
  const borderStyles = {
    default: 'border-border hover:border-border/80',
    green: 'border-brand-green/40 glass-card-raised shadow-glow-green',
    mint: 'border-brand-mint/40 glass-card-raised shadow-glow-mint',
    danger: 'border-danger/40 glass-card-raised shadow-glow-danger',
  };

  const iconBgStyles = {
    default: 'bg-surface text-text-secondary',
    green: 'bg-brand-green/20 text-brand-lightGreen',
    mint: 'bg-brand-mint/20 text-brand-mint',
    danger: 'bg-danger/20 text-danger',
  };

  return (
    <div
      className={`relative overflow-hidden rounded-card glass-card p-5 border transition-all duration-300 ${borderStyles[variant]} ${className}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className={`p-2.5 rounded-full flex items-center justify-center ${iconBgStyles[variant]}`}>
              <Icon className="w-5 h-5" />
            </div>
          )}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              {title}
            </h4>
            {subtitle && (
              <p className="text-xs text-text-tertiary mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {badge && <div>{badge}</div>}
      </div>

      <div className="mt-2 flex items-baseline justify-between gap-2">
        <AnimatedNumber
          value={value}
          currency={currency}
          compact={compact}
          className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
            value < 0 ? 'text-danger' : variant === 'mint' || variant === 'green' ? 'text-brand-lightGreen' : 'text-text-primary'
          }`}
        />
        {trend && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              trend.isPositive
                ? 'bg-brand-green/15 text-brand-lightGreen'
                : 'bg-danger/15 text-danger'
            }`}
          >
            {trend.label}
          </span>
        )}
      </div>
    </div>
  );
};
