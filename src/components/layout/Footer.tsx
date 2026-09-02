import React from 'react';
import { OctovovaLogo } from '../common/OctovovaLogo';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-border/40 bg-background/50 backdrop-blur-md py-6 px-4 text-center text-xs text-text-tertiary">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <OctovovaLogo size="sm" />
          <span className="font-bold text-text-secondary">Octovova Finance</span>
        </div>

        <p className="text-[11px] text-text-tertiary">
          Personalized Wealth Planning & Portfolio Architecture
        </p>
      </div>
    </footer>
  );
};
