import React from 'react';

interface OctovovaLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const OctovovaLogo: React.FC<OctovovaLogoProps> = ({
  size = 'md',
  showText = false,
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const iconSizeMap = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
    xl: 'w-9 h-9',
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Circular Green Upward Trend Bar-Chart Icon Badge */}
      <div
        className={`${sizeMap[size]} rounded-full bg-gradient-to-tr from-[#059669] via-[#10B981] to-[#34D399] flex items-center justify-center shadow-glow-green shrink-0 border border-white/20`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${iconSizeMap[size]} text-white drop-shadow-sm`}
        >
          {/* Bar 1 */}
          <rect x="4" y="14" width="3" height="6" rx="1" fill="currentColor" fillOpacity="0.85" />
          {/* Bar 2 */}
          <rect x="9.5" y="10" width="3" height="10" rx="1" fill="currentColor" fillOpacity="0.95" />
          {/* Bar 3 */}
          <rect x="15" y="6" width="3" height="14" rx="1" fill="currentColor" />
          {/* Upward Trend Arrow */}
          <path
            d="M5 11L11.5 5.5L15 9L19.5 4.5M19.5 4.5H16M19.5 4.5V8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col text-left">
          <span className="font-extrabold text-sm sm:text-base tracking-tight leading-none text-text-primary">
            OCTOVOVA <span className="text-brand-lightGreen">FINANCE</span>
          </span>
          <span className="text-[9px] uppercase tracking-widest text-text-tertiary font-semibold mt-0.5">
            Planning Engine
          </span>
        </div>
      )}
    </div>
  );
};
