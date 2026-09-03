import React from 'react';
import { RiskCategory } from '../../types/finance';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'green' | 'mint' | 'danger' | 'warning' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const variantStyles = {
    default: 'glass-card text-text-primary border border-border',
    green: 'bg-brand-green/20 text-brand-lightGreen border border-brand-green/40 shadow-glow-green',
    mint: 'bg-brand-mint/20 text-brand-mint border border-brand-mint/40',
    danger: 'bg-danger/20 text-danger border border-danger/40',
    warning: 'bg-warning/20 text-warning border border-warning/40',
    neutral: 'bg-surface text-text-secondary border border-border',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2.5 py-0.5 font-bold',
    md: 'text-xs px-3 py-1 font-semibold',
    lg: 'text-sm px-4 py-1.5 font-bold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full uppercase tracking-wider transition-colors ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};

export const RiskBadge: React.FC<{ category: RiskCategory; size?: 'sm' | 'md' | 'lg' }> = ({
  category,
  size = 'md',
}) => {
  const mapping: Record<RiskCategory, { variant: 'green' | 'mint' | 'danger' | 'warning' | 'neutral'; label: string }> = {
    Conservative: { variant: 'neutral', label: 'Conservative 🛡️' },
    Moderate: { variant: 'warning', label: 'Moderate ⚖️' },
    Balanced: { variant: 'green', label: 'Balanced 🎯' },
    Growth: { variant: 'mint', label: 'Growth 🚀' },
    Aggressive: { variant: 'danger', label: 'Aggressive ⚡' },
  };

  const config = mapping[category] || mapping.Balanced;

  return (
    <Badge variant={config.variant} size={size}>
      {config.label}
    </Badge>
  );
};
